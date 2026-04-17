import {
  Badge,
  Button,
  Card,
  Callout,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  EnvelopeClosedIcon,
} from "@radix-ui/react-icons";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { getDivisionTeamsUsersProfileByLeagueSlug } from "~/models/division.server";
import { getLeagueBySlug } from "~/models/league.server";
import {
  createRecapEmail,
  getRecapEmailsByLeagueId,
} from "~/models/recap-email.server";
import { getSchedulesByLeagueSlug } from "~/models/schedule.server";
import { getStandingsBySlug } from "~/models/standings.server";
import { getScores } from "~/components/WeekResults";
import { formatDate, getTeamNameByMatch } from "~/utils";
import WeeklyRecapEmail from "~/emails/weekly-recap";
import type { WeeklyRecapProps } from "~/emails/weekly-recap";

interface WeekStatus {
  date: string;
  weekNumber: number;
  allScoresEntered: boolean;
  allWinnersSaved: boolean;
  isReady: boolean;
  wasCancelled: boolean;
  sentAt: string | null;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const leagueSlug = params.league as string;
  const league = await getLeagueBySlug(leagueSlug);

  if (!league) {
    throw new Response("League not found", { status: 404 });
  }

  const schedules = await getSchedulesByLeagueSlug(leagueSlug);
  const recapEmails = await getRecapEmailsByLeagueId(league.id);

  const dateMap = new Map<
    string,
    {
      allScoresEntered: boolean;
      allWinnersSaved: boolean;
      wasCancelled: boolean;
    }
  >();

  for (const schedule of schedules) {
    for (const week of schedule.weeks) {
      const existing = dateMap.get(week.date);
      const scoresEntered =
        week.matches.length > 0 &&
        week.matches.every((m) => m.scores.every((s) => s.score !== null));
      const winnersSaved = week.winners.length > 0;

      if (existing) {
        existing.allScoresEntered = existing.allScoresEntered && scoresEntered;
        existing.allWinnersSaved = existing.allWinnersSaved && winnersSaved;
        existing.wasCancelled = existing.wasCancelled || week.wasCancelled;
      } else {
        dateMap.set(week.date, {
          allScoresEntered: scoresEntered,
          allWinnersSaved: winnersSaved,
          wasCancelled: week.wasCancelled,
        });
      }
    }
  }

  const sortedDates = Array.from(dateMap.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  const weekStatuses: WeekStatus[] = sortedDates.map((date, index) => {
    const status = dateMap.get(date)!;
    const recap = recapEmails.find((r) => r.weekDate === date);
    return {
      date,
      weekNumber: index + 1,
      allScoresEntered: status.allScoresEntered,
      allWinnersSaved: status.allWinnersSaved,
      isReady: status.allScoresEntered && status.allWinnersSaved && !status.wasCancelled,
      wasCancelled: status.wasCancelled,
      sentAt: recap ? recap.sentAt.toISOString() : null,
    };
  });

  return json({ weekStatuses, leagueSlug });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const weekDate = formData.get("weekDate") as string;
  const weekNumber = Number(formData.get("weekNumber"));
  const leagueSlug = params.league as string;

  const league = await getLeagueBySlug(leagueSlug);
  if (!league) {
    return json({ error: "League not found", success: false }, { status: 404 });
  }

  const schedules = await getSchedulesByLeagueSlug(leagueSlug);
  const standings = await getStandingsBySlug(leagueSlug);

  const allDates = new Set<string>();
  for (const schedule of schedules) {
    for (const week of schedule.weeks) {
      allDates.add(week.date);
    }
  }
  const sortedAllDates = Array.from(allDates).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );
  const currentDateIndex = sortedAllDates.indexOf(weekDate);
  const nextWeekDate =
    currentDateIndex < sortedAllDates.length - 1
      ? sortedAllDates[currentDateIndex + 1]
      : null;

  const divisionProps: WeeklyRecapProps["divisions"] = [];

  for (const schedule of schedules) {
    const week = schedule.weeks.find((w) => w.date === weekDate);
    if (!week || week.wasCancelled) continue;

    const matchData = week.matches.map((match) => {
      const team1Id = match.scores[0].teamId;
      const team2Id = match.scores[1].teamId;
      return {
        team1: getTeamNameByMatch(match as any, team1Id),
        score1: match.scores[0].score!,
        team2: getTeamNameByMatch(match as any, team2Id),
        score2: match.scores[1].score!,
      };
    });

    const scores = getScores(week.matches as any);
    const moneyWinners = scores
      .filter((s) => s.place)
      .map((s) => ({
        place: s.place!,
        teamName: s.teamName,
        score: s.score!,
        amount: s.amountWon || 0,
      }));

    const divisionStandings = standings.find(
      (s) => s.division.id === schedule.division.id,
    );
    const standingsData = (divisionStandings?.standings || []).map(
      (s, index) => ({
        rank: index + 1,
        teamName: s.teamName,
        wins: s.wins,
        losses: s.losses,
        ties: s.ties,
        points: s.points,
      }),
    );

    divisionProps.push({
      name: schedule.division.name,
      matches: matchData,
      moneyWinners,
      standings: standingsData,
    });
  }

  let nextWeek: WeeklyRecapProps["nextWeek"] = null;
  if (nextWeekDate) {
    const nextDivisions: Array<{
      name: string;
      matchups: Array<{ team1: string; team2: string }>;
    }> = [];
    for (const schedule of schedules) {
      const week = schedule.weeks.find((w) => w.date === nextWeekDate);
      if (!week || week.wasCancelled) continue;
      const matchups = week.matches.map((match) => ({
        team1: getTeamNameByMatch(match as any, match.scores[0].teamId),
        team2: getTeamNameByMatch(match as any, match.scores[1].teamId),
      }));
      nextDivisions.push({ name: schedule.division.name, matchups });
    }
    if (nextDivisions.length > 0) {
      nextWeek = { date: formatDate(nextWeekDate), divisions: nextDivisions };
    }
  }

  const emailProps: WeeklyRecapProps = {
    weekNumber,
    weekDate: formatDate(weekDate),
    divisions: divisionProps,
    nextWeek,
  };

  const html = await render(WeeklyRecapEmail(emailProps));

  const divisions = await getDivisionTeamsUsersProfileByLeagueSlug(leagueSlug);
  const recipientEmails = new Set<string>();

  if (process.env.NODE_ENV === "production") {
    for (const division of divisions) {
      for (const team of division.teams) {
        for (const user of team.users) {
          if (user.email) {
            recipientEmails.add(user.email);
          }
        }
      }
    }
  } else {
    recipientEmails.add("sfinneral@gmail.com");
  }

  const recipients = Array.from(recipientEmails);

  if (recipients.length === 0) {
    return json(
      { error: "No recipients found", success: false },
      { status: 400 },
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY || "");
  const { error } = await resend.emails.send({
    from: "Afternoon Golfer <news@mail.afternoongolfer.com>",
    to: recipients,
    subject: `Week ${weekNumber} Recap — ${formatDate(weekDate)}`,
    html,
  });

  if (error) {
    return json(
      { error: `Failed to send email: ${error.message}`, success: false },
      { status: 500 },
    );
  }

  await createRecapEmail(weekDate, league.id);

  return json({ success: true, error: null });
}

export default function RecapEmails() {
  const { weekStatuses } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";
  const submittingDate = isSubmitting
    ? navigation.formData?.get("weekDate")
    : null;

  function handleResend(weekDate: string, weekNumber: number) {
    if (!confirm("Are you sure you want to resend this recap email to all league members?")) {
      return;
    }
    submit(
      { weekDate, weekNumber: String(weekNumber) },
      { method: "post" },
    );
  }

  return (
    <div>
      <Heading mb="4">Recap Emails</Heading>

      {actionData?.success && !isSubmitting && (
        <Callout.Root color="green" mb="4">
          <Callout.Icon>
            <CheckCircledIcon />
          </Callout.Icon>
          <Callout.Text>Recap email sent successfully!</Callout.Text>
        </Callout.Root>
      )}

      {actionData?.error && !isSubmitting && (
        <Callout.Root color="red" mb="4">
          <Callout.Icon>
            <CrossCircledIcon />
          </Callout.Icon>
          <Callout.Text>{actionData.error}</Callout.Text>
        </Callout.Root>
      )}

      <Flex direction="column" gap="3">
        {weekStatuses.map((week) => {
          if (week.wasCancelled) return null;

          return (
            <Card key={week.date}>
              <Flex justify="between" align="center">
                <Flex direction="column" gap="1">
                  <Text weight="bold" size="3">
                    Week {week.weekNumber} — {formatDate(week.date)}
                  </Text>
                  <Flex gap="2">
                    <Badge
                      color={week.allScoresEntered ? "green" : "gray"}
                    >
                      {week.allScoresEntered
                        ? "Scores complete"
                        : "Missing scores"}
                    </Badge>
                    <Badge
                      color={week.allWinnersSaved ? "green" : "gray"}
                    >
                      {week.allWinnersSaved
                        ? "Winners saved"
                        : "No winners"}
                    </Badge>
                  </Flex>
                  {week.sentAt && (
                    <Text size="1" color="gray">
                      <EnvelopeClosedIcon
                        style={{
                          display: "inline",
                          verticalAlign: "middle",
                          marginRight: "4px",
                        }}
                      />
                      Sent{" "}
                      {new Date(week.sentAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Text>
                  )}
                </Flex>
                {week.sentAt ? (
                  <Button
                    variant="soft"
                    disabled={!week.isReady || isSubmitting}
                    loading={submittingDate === week.date}
                    onClick={() => handleResend(week.date, week.weekNumber)}
                  >
                    Resend
                  </Button>
                ) : (
                  <Form method="post">
                    <input
                      type="hidden"
                      name="weekDate"
                      value={week.date}
                    />
                    <input
                      type="hidden"
                      name="weekNumber"
                      value={week.weekNumber}
                    />
                    <Button
                      type="submit"
                      disabled={!week.isReady || isSubmitting}
                      loading={submittingDate === week.date}
                    >
                      Send Recap Email
                    </Button>
                  </Form>
                )}
              </Flex>
            </Card>
          );
        })}
      </Flex>
    </div>
  );
}
