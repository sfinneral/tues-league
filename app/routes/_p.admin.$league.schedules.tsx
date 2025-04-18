import { Cross2Icon } from "@radix-ui/react-icons";
import { Button, Card, Flex, Heading, IconButton, TextField } from "@radix-ui/themes";
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { Fragment } from "react";
import AddaWeek from "~/components/AddaWeek";
import { getDivisionseByLeagueSlug } from "~/models/division.server";
import {
  addWeekToSchedule,
  createSchedule,
  deleteScheduleByDivisionId,
  getSchedulesByLeagueSlug,
  deleteWeekToSchedule,
} from "~/models/schedule.server";
import { formatDate, getTeamName } from "~/utils";

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("_action");
  const divisionId = formData.get("divisionId") as string;
  if (action === "delete") {
    return await deleteScheduleByDivisionId(divisionId);
  }

  if (action === "deleteWeek") {
    const weekId = formData.get("weekId") as string;
    const scheduleId = formData.get("scheduleId") as string;
    return await deleteWeekToSchedule(scheduleId, weekId);
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

  if (action === "addWeek") {
    const formDataMatches = formData.get("matches");
    const matches = JSON.parse(formDataMatches as string);

    return addWeekToSchedule(
      formData.get("scheduleId") as string,
      formData.get("weekDate") as string,
      matches
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
      <Heading mb="4">Schedules</Heading>
      <Card mb="8">
        {divisions.map((division) => (
          <Form key={division.id} method="post">
            <Flex gap="3" className="my-3 align-middle">
              <Heading size="3" className="w-24">
                {division.name}
              </Heading>
              {division.schedule ? <input type="hidden" name="scheduleId" value={division.schedule.id} /> : null}
              <input type="hidden" name="divisionId" value={division.id} />
              {!division.schedule ? (
                <>
                  <TextField.Root
                    placeholder="# of weeks"
                    name="numberOfWeeks"
                  />

                  <TextField.Root
                    placeholder="start date"
                    type="date"
                    name="startDate"
                  />
                  <Button type="submit" name="_action" value="create">
                    generate
                  </Button>
                </>
              ) :

                <Button color="red" name="_action" value="delete" type="submit">
                  delete schedule
                </Button>
              }
            </Flex>
            <AddaWeek teams={division.teams} />
          </Form>
        ))}
      </Card>

      {schedules.map((schedule) => (
        <div key={schedule.id}>
          <Heading size="4">{schedule.division.name}</Heading>

          <div>
            {schedule.weeks.map((week) => (
              <div key={week.id} className="my-5">
                <Flex justify='between'>
                  <Heading size="3">{formatDate(week.date)}</Heading>
                  <Form method="post">
                    <input type="hidden" name="weekId" value={week.id} />
                    <input type="hidden" name="scheduleId" value={schedule.id} />
                    <IconButton type="submit" name="_action" value="deleteWeek" variant="surface">
                      <Cross2Icon />
                    </IconButton>
                  </Form>
                </Flex>

                {week.matches.map((match) => (
                  <Flex key={match.id} gap="2">
                    {match.teams.map((team, index) => (
                      <Fragment key={team.id}>
                        <div>{getTeamName(team)}</div>
                        {index === 0 ? <div>vs</div> : null}
                      </Fragment>
                    ))}
                  </Flex>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

