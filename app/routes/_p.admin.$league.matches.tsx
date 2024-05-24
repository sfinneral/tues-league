import { Schedule } from "@prisma/client";
import { Button, Card, Flex, Heading } from "@radix-ui/themes";
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import Carousel from "~/components/Carousel";
import { UpdateScore } from "~/components/UpdateScore";
import { getSchedulesByLeagueSlug } from "~/models/schedule.server";
import { updateScore } from "~/models/score.server";
import { formatDate } from "~/utils";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  for (const entry of formData.entries()) {
    await updateScore(entry[0], Number(entry[1]));
  }

  return {};
}

export async function loader({ params }: LoaderFunctionArgs) {
  const leagueSlug = params.league as string;
  const schedules = await getSchedulesByLeagueSlug(leagueSlug);

  return json({
    schedules,
  });
}

export default function AdminMatches() {
  const { schedules } = useLoaderData<typeof loader>();

  const startIndex = (scheduleId: Schedule["id"]) => {
    const schedule = schedules.find((schedule) => schedule.id === scheduleId);
    return (
      schedule &&
      schedule.weeks.findIndex((week) => {
        return week.matches.find((match) => {
          return match.scores.find((score) => !score.score);
        });
      })
    );
  };

  return (
    <div>
      {schedules?.length ? (
        schedules.map((schedule) => (
          <div key={schedule.id} className="mb-10">
            <Heading size="4" align="center">
              {schedule.division.name}
            </Heading>
            <div className="-mt-8">
              <Carousel startIndex={startIndex(schedule.id)}>
                {schedule.weeks.map((week) => (
                  <Form method="post" key={week.id}>
                    <Heading align="center" size="4">
                      {formatDate(week.date)}
                    </Heading>
                    {week.matches.map((match) => (
                      <Card key={match.id} my="4">
                        <Flex gap="2" direction="column">
                          {match.scores.map((score) => (
                            <UpdateScore
                              key={score.id}
                              match={match}
                              score={score}
                            />
                          ))}
                        </Flex>
                      </Card>
                    ))}
                    <Flex justify="center">
                      <Button type="submit" className="w-full">
                        Save {schedule.division.name} Scores
                      </Button>
                    </Flex>
                  </Form>
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
