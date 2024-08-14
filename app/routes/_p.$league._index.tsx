import { Schedule, Score, Team } from "@prisma/client";
import { Badge, Card, Flex, Heading, Separator } from "@radix-ui/themes";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Carousel from "~/components/Carousel";
import { WeekResults } from "~/components/WeekResults";
import { getSchedulesByLeagueSlug } from "~/models/schedule.server";
import { formatDate, getTeamNameByMatch } from "~/utils";

export async function loader({ params }: LoaderFunctionArgs) {
  const leagueSlug = params.league as string;
  const schedules = await getSchedulesByLeagueSlug(leagueSlug);

  return json({
    schedules,
  });
}

export default function LeagueHome() {
  const { schedules } = useLoaderData<typeof loader>();

  const startIndex = (scheduleId: Schedule["id"]) => {
    const schedule = schedules.find((schedule) => schedule.id === scheduleId);
    const firstWeekWithoutScores =
      schedule &&
      schedule.weeks.findIndex((week) => {
        return week.matches.find((match) => {
          return match.scores.find((score) => !score.score);
        });
      });
    if (!schedule || firstWeekWithoutScores === undefined || firstWeekWithoutScores === 0) {
      return 0
    }
    if (firstWeekWithoutScores < 0) {
      return schedule.weeks.length - 1
    }
    return firstWeekWithoutScores - 1
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
