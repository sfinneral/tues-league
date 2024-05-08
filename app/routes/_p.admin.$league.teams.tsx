import { Cross2Icon, Pencil2Icon } from "@radix-ui/react-icons";
import { Button, Card, Flex, Heading, IconButton, Select, Text } from "@radix-ui/themes";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { getDivisionTeamsUsersProfileByLeagueSlug } from "~/models/division.server";
import { getLeagueBySlug } from "~/models/league.server";
import { createSub, deleteSub, getSubsByLeagueSlug } from "~/models/sub.server";
import { TeamWithUsers, createTeam, getTeamsUsersByLeagueSlug, updateTeamUsers } from "~/models/team.server";
import { getAllUsers } from "~/models/user.server";
import { getTeamName } from "~/utils";

export async function action({ request, params }: ActionFunctionArgs) {
  const league = await getLeagueBySlug(params.league as string);
  invariant(Boolean(league), "league is invalid");
  const formData = await request.formData();
  const action = formData.get("_action") as string;
  if (action === 'create') {
    const player1Id = formData.get("player1") as string;
    const player2Id = formData.get("player2") as string;
    const divisionId = formData.get("division") as string;

    invariant(Boolean(player1Id), "player 1 is required");
    invariant(Boolean(player2Id), "player 2 is required");
    invariant(Boolean(divisionId), "division is required");

    return createTeam(league!.id, divisionId, player1Id, player2Id);
  }

  if (action === 'editTeam') {
    const player1Id = formData.get("player1") as string;
    const player2Id = formData.get("player2") as string;
    const teamId = formData.get("teamId") as string;

    invariant(Boolean(player1Id), "player 1 is required");
    invariant(Boolean(player2Id), "player 2 is required");

    return updateTeamUsers(teamId, player1Id, player2Id);
  }

  if (action === 'addSub') {
    const userId = formData.get("subPlayer") as string;
    invariant(Boolean(userId), "sub Player is required");
    if (league) {
      return createSub(userId, league.id);
    }

  }

  if (action === 'removeSub') {
    const subId = formData.get("subId") as string;
    invariant(Boolean(subId), "subId is required");
    return deleteSub(subId);
  }

  return null

}

export async function loader({ params }: LoaderFunctionArgs) {
  const leagueSlug = params.league as string;
  const teams = await getTeamsUsersByLeagueSlug(leagueSlug);
  const users = await getAllUsers();
  const divisions = await getDivisionTeamsUsersProfileByLeagueSlug(leagueSlug);
  const league = await getSubsByLeagueSlug(leagueSlug)

  return json({
    divisions,
    users,
    teams,
    subs: league ? league.subs : []
  });
}

export default function AdminTeams() {
  const { users, divisions, teams, subs } = useLoaderData<typeof loader>();
  const [isEditing, setIsEditing] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamWithUsers>()
  const formRef = useRef<HTMLFormElement>(null);
  const editingFormRef = useRef<HTMLFormElement>(null);
  const subFormRef = useRef<HTMLFormElement>(null);
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  useEffect(() => {
    formRef.current?.reset();
    editingFormRef.current?.reset();
    subFormRef.current?.reset();
    setEditingTeam(undefined);
    setIsEditing(false);
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

  const availableForSubs = usersWithoutTeam.filter((user) => !subs.some(sub => sub.userId === user.id))

  const availableUsersForEdit = users.filter(
    (user) => {
      return !usersIdsOnTeams.includes(user.id) || editingTeam?.users.some(u => u.id === user.id)
    }
  );

  const editTeam = (team: TeamWithUsers) => {
    setIsEditing(true);
    setEditingTeam(team)
  }

  return (
    <div>
      <Heading>{divisions[0].league.name} Teams</Heading>
      <Flex gap="9" className="my-10">
        {divisions.map((division) => (
          <div key={division.id}>
            <Heading size="2">{division.name.toUpperCase()}</Heading>
            {division.teams.map((team) => (
              <Flex align='center' gap='2' key={team.id}>
                <div>{getTeamName(team)}</div>

                <IconButton variant="ghost" onClick={() => editTeam(team as unknown as TeamWithUsers)}><Pencil2Icon /></IconButton>

              </Flex>
            ))}
          </div>
        ))}
      </Flex>
      {subs && subs.length ?
        <Flex direction='column' mb='8'>
          <Heading size='3'>Subs</Heading>
          {subs.map(sub => (
            <Form method='post' key={sub.id}>
              <Flex align='center' gap='2'>
                <Text>{sub.user.profile?.firstName} {sub.user.profile?.lastName}</Text>
                <input type="hidden" name="subId" value={sub.id} />
                <IconButton type="submit" name="_action" value="removeSub" color="red" variant="ghost"><Cross2Icon /></IconButton>
              </Flex>
            </Form>
          ))}
        </Flex>
        : null}
      {isEditing && editingTeam ? <Form method="post" ref={editingFormRef} key={navigation.state}>
        <Card>
          <Heading>Edit team users</Heading>
          <Flex gap="3" py="3" direction='column'>
            <Select.Root key={editingTeam?.users[0].id} name="player1" defaultValue={editingTeam?.users[0].id || ''}>
              <Select.Trigger placeholder="select player 1" />
              <Select.Content>
                {availableUsersForEdit.map((user) => (
                  <Select.Item
                    key={user.id}
                    value={user.id}
                  >{`${user.profile?.firstName} ${user.profile?.lastName}`}</Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Select.Root key={editingTeam?.users[1].id} name="player2" defaultValue={editingTeam?.users[1].id || ''}>
              <Select.Trigger placeholder="select player 2" />
              <Select.Content>
                {availableUsersForEdit.map((user) => (
                  <Select.Item
                    key={user.id}
                    value={user.id}
                  >{`${user.profile?.firstName} ${user.profile?.lastName}`}</Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <input type="hidden" name="teamId" value={editingTeam.id} />
            <Button variant="solid" name="_action" value='editTeam' type="submit">
              save
            </Button>
          </Flex>
        </Card>
      </Form> :
        <Form method="post" ref={formRef} key={usersWithoutTeam.length}>
          <Card>
            <Heading>Add new team</Heading>
            <Flex gap="3" py="3" direction='column'>
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
              <Button type="submit" variant="solid" name="_action" value='create'>
                save
              </Button>
            </Flex>
          </Card>
        </Form>
      }
      <div className="my-8">
        <Form method="post" ref={subFormRef} key={availableForSubs.length}>
          <Card>
            <Heading>Add new sub</Heading>
            <Flex gap="3" py="3" direction='column'>
              <Select.Root name="subPlayer">
                <Select.Trigger placeholder="select player 1" />
                <Select.Content>
                  {availableForSubs.map((user) => (
                    <Select.Item
                      key={user.id}
                      value={user.id}
                    >{`${user.profile?.firstName} ${user.profile?.lastName}`}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <Button type="submit" variant="solid" name="_action" value='addSub'>
                save
              </Button>
            </Flex>
          </Card>
        </Form>
      </div>
    </div>
  );
}
