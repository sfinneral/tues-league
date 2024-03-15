import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { getDivisionTeamsUsersProfileByLeagueSlug } from "~/models/division.server";

import { Button, Flex, Heading, TextField } from "@radix-ui/themes";
import type { ActionFunctionArgs } from "@remix-run/node";
import { createSchedule } from "~/models/schedule.server";
import { getSchedulesByLeagueSlug } from "~/models/week.server";


export async function action({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData();
    const numberOfWeeks = formData.get('numberOfWeeks');
    const startDate = formData.get('startDate') as string;
    const divisionId = formData.get('divisionId') as string;
    const leagueId = params.league as string;

    const schedule = createSchedule(divisionId, leagueId, Number(numberOfWeeks), startDate);

    return json({
        schedule
    })
}


export async function loader({ params }: LoaderFunctionArgs) {
    const leagueSlug = params.league as string;
    const divisions = await getDivisionTeamsUsersProfileByLeagueSlug(leagueSlug);

    const schedules = await getSchedulesByLeagueSlug(leagueSlug);

    return json({
        divisions,
        schedules
    });
}

export default function AdminSchedules() {
    const { divisions, schedules } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();

    return (
        <div>
            <Heading>Schedules</Heading>

            {divisions.map(division => (
                <Form key={division.id} method="post">
                    <Flex gap="3" className="my-3">
                        <Heading size="3" className="w-24">{division.name}</Heading>
                        <TextField.Root>
                            <TextField.Input placeholder="# of weeks" name="numberOfWeeks" />
                        </TextField.Root>
                        <TextField.Root>
                            <TextField.Input placeholder="start date" type="date" name="startDate" />
                        </TextField.Root>
                        <input type="hidden" name="divisionId" value={division.id} />

                        <Button type="submit">generate</Button>
                    </Flex>
                </Form>
            ))}

            {schedules.map(schedule => (
                <div>{schedule.id}</div>
            ))}

        </div>
    );
}