import { Button, Card, Flex, Heading, Select } from "@radix-ui/themes";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { getDivisionTeamsUsersProfileByLeagueSlug } from "~/models/division.server";
import { getLeagueBySlug } from "~/models/league.server";
import { createTeam, getTeamsUsersByLeagueSlug } from "~/models/team.server";
import { getAllUsers } from "~/models/user.server";
import { getTeamName } from "~/utils";

export async function action({ request, params }: ActionFunctionArgs) {
  const league = await getLeagueBySlug(params.league as string);
  invariant(Boolean(league), "league is invalid");
  const formData = await request.formData();
  const player1Id = formData.get("player1") as string;
  const player2Id = formData.get("player2") as string;
  const divisionId = formData.get("division") as string;

  invariant(Boolean(player1Id), "player 1 is required");
  invariant(Boolean(player2Id), "player 2 is required");
  invariant(Boolean(divisionId), "division is required");

  return createTeam(league!.id, divisionId, player1Id, player2Id);
}

export async function loader({ params }: LoaderFunctionArgs) {
  const leagueSlug = params.league as string;
  const teams = await getTeamsUsersByLeagueSlug(leagueSlug);
  const users = await getAllUsers();
  const divisions = await getDivisionTeamsUsersProfileByLeagueSlug(leagueSlug);

  return json({
    divisions,
    users,
    teams,
  });
}

export default function AdminTeams() {
  const { users, divisions, teams } = useLoaderData<typeof loader>();
  const formRef = useRef<HTMLFormElement>(null);
  const actionData = useActionData<typeof action>();
  useEffect(() => {
    formRef.current?.reset();
  }, [actionData]);

  const usersIdsOnTeams = teams.reduce((acc, curr) => {
    curr.users.forEach((u) => {
      acc.push(u.id);
    });
    return acc;
  }, [] as string[]);

  const usersWithoutTeam = users.filter(
    (user) => !usersIdsOnTeams.includes(user.id),
  );

  return (
    <div>
      <Heading>{divisions[0].league.name} Teams</Heading>
      <Flex gap="9" className="my-10">
        {divisions.map((division) => (
          <div key={division.id}>
            <Heading size="2">{division.name.toUpperCase()}</Heading>
            {division.teams.map((team) => (
              <div key={team.id}>{getTeamName(team)}</div>
            ))}
          </div>
        ))}
      </Flex>
      <Flex py="3">
        <Form method="post" ref={formRef} key={usersWithoutTeam.length}>
          <Card>
            <Heading>Add new team</Heading>
            <Flex gap="3" py="3">
              <Select.Root name="player1">
                <Select.Trigger placeholder="select player 1" />
                <Select.Content>
                  {usersWithoutTeam.map((user) => (
                    <Select.Item
                      key={user.id}
                      value={user.id}
                    >{`${user.profile?.firstName} ${user.profile?.lastName}`}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <Select.Root name="player2">
                <Select.Trigger placeholder="select player 2" />
                <Select.Content>
                  {usersWithoutTeam.map((user) => (
                    <Select.Item
                      key={user.id}
                      value={user.id}
                    >{`${user.profile?.firstName} ${user.profile?.lastName}`}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <Select.Root name="division">
                <Select.Trigger placeholder="select division" />
                <Select.Content>
                  {divisions.map((division) => (
                    <Select.Item
                      key={division.id}
                      value={division.id}
                    >{`${division.name}`}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <Button type="submit" variant="solid">
                save
              </Button>
            </Flex>
          </Card>
        </Form>
      </Flex>
    </div>
  );
}
