import { Button, Flex, Heading, TextField } from "@radix-ui/themes";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { Fragment } from "react";
import { getDivisionseByLeagueSlug } from "~/models/division.server";
import {
  createSchedule,
  deleteScheduleByDivisionId,
  getSchedulesByLeagueSlug,
} from "~/models/schedule.server";
import { formatDate, getTeamName } from "~/utils";

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("_action");
  const divisionId = formData.get("divisionId") as string;
  if (action === "delete") {
    return await deleteScheduleByDivisionId(divisionId);
  }

  if (action === "create") {
    const numberOfWeeks = formData.get("numberOfWeeks");
    const startDate = formData.get("startDate") as string;

    const leagueId = params.league as string;

    return createSchedule(
      divisionId,
      leagueId,
      Number(numberOfWeeks),
      startDate,
    );
  }
}

export async function loader({ params }: LoaderFunctionArgs) {
  const leagueSlug = params.league as string;
  const divisions = await getDivisionseByLeagueSlug(leagueSlug);

  const schedules = await getSchedulesByLeagueSlug(leagueSlug);

  return json({
    divisions,
    schedules,
  });
}

export default function AdminSchedules() {
  const { divisions, schedules } = useLoaderData<typeof loader>();

  return (
    <div>
      <Heading>Schedules</Heading>

      {divisions.map((division) => (
        <Form key={division.id} method="post">
          <Flex gap="3" className="my-3 align-middle">
            <Heading size="3" className="w-24">
              {division.name}
            </Heading>
            <input type="hidden" name="divisionId" value={division.id} />
            {!division.schedule ? (
              <>
                <TextField.Root>
                  <TextField.Input
                    placeholder="# of weeks"
                    name="numberOfWeeks"
                  />
                </TextField.Root>
                <TextField.Root>
                  <TextField.Input
                    placeholder="start date"
                    type="date"
                    name="startDate"
                  />
                </TextField.Root>
                <Button type="submit" name="_action" value="create">
                  generate
                </Button>
              </>
            ) : (
              <Button color="red" name="_action" value="delete" type="submit">
                delete schedule
              </Button>
            )}
          </Flex>
        </Form>
      ))}

      <Flex gap="3">
        {schedules.map((schedule) => (
          <div key={schedule.id}>
            <Heading size="4">{schedule.division.name}</Heading>

            <div>
              {schedule.weeks.map((week) => (
                <div key={week.id} className="my-5">
                  <Heading size="3">{formatDate(week.date)}</Heading>
                  {week.matches.map((match) => (
                    <Flex key={match.id} gap="2">
                      {match.teams.map((team, index) => (
                        <Fragment key={team.id}>
                          <div>{getTeamName(team)}</div>
                          {index === 0 && <div>vs</div>}
                        </Fragment>
                      ))}
                    </Flex>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </Flex>
    </div>
  );
}
