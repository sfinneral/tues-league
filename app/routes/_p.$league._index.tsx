import { Schedule, Score, Team } from "@prisma/client";
import type { Week, Match } from "@prisma/client";
import { Badge, Button, Card, Flex, Heading, Separator } from "@radix-ui/themes";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useNavigation, useFetcher, useRouteLoaderData } from "@remix-run/react";
import Carousel from "~/components/Carousel";
import { getScores, WeekResults } from "~/components/WeekResults";
import { getSchedulesByLeagueSlug } from "~/models/schedule.server";
import { saveWinners } from "~/models/week.server";
import { formatDate, getTeamNameByMatch, roundNumber } from "~/utils";

type MatchWithRelations = Match & {
  scores: Score[];
  teams: Team[];
};

type WeekWithMatches = Week & {
  matches: MatchWithRelations[];
};

interface ActionData {
  success: boolean;
  error?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const weekId = formData.get("weekId") as string;
  const winnersData = formData.get("winners") as string;
  const winners = JSON.parse(winnersData);

  try {
    await saveWinners(
      weekId,
      winners.map((w: { teamId: string; amountWon: number }) => ({
        teamId: w.teamId,
        amountWon: roundNumber(w.amountWon)
      }))
    );

    return json<ActionData>({ success: true });
  } catch (error) {
    console.error('Failed to save winners:', error);
    return json<ActionData>(
      { success: false, error: "Failed to save winners" },
      { status: 400 }
    );
  }
}

export async function loader({ params }: LoaderFunctionArgs) {
  const leagueSlug = params.league as string;
  const schedules = await getSchedulesByLeagueSlug(leagueSlug);

  return json({
    schedules,
  });
}

export default function LeagueHome() {
  const { schedules } = useLoaderData<typeof loader>();
  const { isSteve } = useRouteLoaderData("routes/_p") as { isAdmin: boolean, isSteve: boolean };
  const navigation = useNavigation();
  const fetcher = useFetcher<ActionData>();
  const isSubmitting = navigation.state === "submitting" || fetcher.state === "submitting";

  const startIndex = (scheduleId: Schedule["id"]) => {
    const schedule = schedules.find((schedule) => schedule.id === scheduleId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstWeekWithoutScores =
      schedule &&
      schedule.weeks.findIndex((week) => {
        const weekDate = new Date(week.date);
        weekDate.setHours(0, 0, 0, 0);

        if (weekDate < today) return false;

        return week.matches.find((match) => {
          return match.scores.find((score) => !score.score);
        });
      });

    if (!schedule || firstWeekWithoutScores === undefined || firstWeekWithoutScores === 0) {
      return 0;
    }
    if (firstWeekWithoutScores < 0) {
      return schedule.weeks.length - 1;
    }
    return firstWeekWithoutScores - 1;
  };

  const outcomeBadge = (scores: Score[], teamId: Team["id"]) => {
    const sortedScores = [...scores].sort(
      (a, b) => (a.score || Infinity) - (b.score || Infinity),
    );
    if (!sortedScores[0].score) return null;
    if (sortedScores[0].score === sortedScores[1].score) {
      return (
        <Badge ml="2" color="blue">
          Tie
        </Badge>
      );
    } else if (sortedScores[0].teamId === teamId) {
      return (
        <Badge ml="2" color="green">
          Win
        </Badge>
      );
    } else {
      return null;
    }
  };

  const saveWinners = (week: WeekWithMatches) => {
    const winners = getScores(week.matches);
    const form = new FormData();
    form.append("weekId", week.id);
    form.append("winners", JSON.stringify(winners));
    fetcher.submit(form, { method: "post" });
  };

  return (
    <div>
      {schedules?.length ? (
        schedules.map((schedule) => (
          <div key={schedule.id} className="mb-16">
            <Heading size="5" align="center">
              {schedule.division.name}
            </Heading>
            <div className="-mt-8">
              <Carousel startIndex={startIndex(schedule.id)}>
                {schedule.weeks.map((week) => (
                  <div key={week.id}>
                    <Heading align="center" size="2">
                      {formatDate(week.date)}
                    </Heading>
                    <Card my="4">
                      {week.matches.map((match, matchIndex) => (
                        <div key={match.id}>
                          <Flex direction="column">
                            {match.scores.map((score) => (
                              <Flex
                                key={score.id}
                                justify="between"
                                align="center"
                              >
                                <div>
                                  {getTeamNameByMatch(match, score.teamId)}
                                  {outcomeBadge(match.scores, score.teamId)}
                                </div>
                                <div>{score.score}</div>
                              </Flex>
                            ))}
                          </Flex>
                          {matchIndex < week.matches.length - 1 ? (
                            <Separator size="4" my="4" />
                          ) : null}
                        </div>
                      ))}
                    </Card>
                    <WeekResults matches={week.matches} />
                    {isSteve ? <Flex justify="center" my="4" direction="row" gap="2" align="center">
                      <Button
                        variant="soft"
                        onClick={() => saveWinners(week)}
                        loading={isSubmitting}
                      >
                        {'Save Winners'}
                      </Button>
                    </Flex> : null}
                  </div>
                ))}
              </Carousel>
            </div>
          </div>
        ))
      ) : (
        <p>No schedule yet</p>
      )}
    </div>
  );
}
