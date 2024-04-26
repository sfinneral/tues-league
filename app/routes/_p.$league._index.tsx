import { Schedule } from "@prisma/client";
import { Card, Flex, Heading } from "@radix-ui/themes";
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

  const startIndex = (scheduleId: Schedule['id']) => {
    const schedule = schedules.find(schedule => schedule.id === scheduleId)
    const firstWeekWithoutScores = schedule && schedule.weeks.findIndex(week => {
      return week.matches.find(match => {
        return match.scores.find(score => !score.score)
      })
    })
    return !firstWeekWithoutScores ? 0 : (firstWeekWithoutScores - 1)
  }
  return (
    <div>
      {schedules?.length ? (
        schedules.map((schedule) => (
          <div key={schedule.id} className="mb-4">
            <Heading size="4" align="center">
              {schedule.division.name}
            </Heading>
            <div className="-mt-5">
              <Carousel startIndex={startIndex(schedule.id)}>
                {schedule.weeks.map((week) => (
                  <div key={week.id}>
                    <Heading align="center" size="2">
                      {formatDate(week.date)}
                    </Heading>
                    {week.matches.map((match) => (
                      <Card key={match.id} my="4">
                        <Flex gap="2" direction="column">
                          {match.scores.map((score) => (
                            <Flex key={score.id} justify="between" align="center">
                              <div>{getTeamNameByMatch(match, score.teamId)}</div>
                              <div>{score.score}</div>
                            </Flex>
                          ))}
                        </Flex>
                      </Card>
                    ))}
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
