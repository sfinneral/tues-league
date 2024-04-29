import { ChatBubbleIcon, EnvelopeClosedIcon } from "@radix-ui/react-icons";
import { Card, Flex, Heading, IconButton, Text } from "@radix-ui/themes";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getDivisionTeamsUsersProfileByLeagueSlug } from "~/models/division.server";
import { TeamWithUsers } from "~/models/team.server";
import { getUsersTeams } from "~/models/user.server";
import { formatPhoneNumber } from "~/utils";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const leagueSlug = params.league as string;
  const divisions = await getDivisionTeamsUsersProfileByLeagueSlug(leagueSlug);
  const usersTeam = await getUsersTeams(request, leagueSlug);

  return json({
    divisions,
    usersTeam,
  });
}

export default function LeagueMembers() {
  const { divisions, usersTeam } = useLoaderData<typeof loader>();

  const smsLink = (team: TeamWithUsers) => {
    let smsString = "sms://open?addresses=";
    const allUsers = [...team.users, ...(usersTeam?.users || [])];
    allUsers.forEach((team, index) => {
      smsString += `${team.profile?.phoneNumber}${index < allUsers.length - 1 && ","
        }`;
    });
    return smsString;
  };

  const emailLink = (team: TeamWithUsers) => {
    let emailString = "mailto:";
    const allUsers = [...team.users, ...(usersTeam?.users || [])];
    allUsers.forEach((user, index) => {
      emailString += `${user.email}${index < allUsers.length - 1 && ","}`;
    });
    return emailString;
  };

  return (
    <div>
      {divisions.map((division) => (
        <div className="mb-10" key={division.id}>
          <Heading align="center" size="3">
            {division.name}
          </Heading>
          {division.teams.map((team) => (
            <Card my="4" key={team.id}>
              <Flex direction="column" gap="4">
                <Flex justify="between" gap="4">
                  {team.users.map((user) => (
                    <Flex direction="column" key={user.id}>
                      <Text weight="bold">
                        {user.profile?.firstName} {user.profile?.lastName}
                      </Text>
                      <Flex direction="column">
                        <Text size="1" color="gray">
                          {user.email}
                        </Text>
                        <Text size="1" color="gray">
                          {formatPhoneNumber(user.profile?.phoneNumber)}
                        </Text>
                      </Flex>
                    </Flex>
                  ))}
                </Flex>
                <Flex gap="2" justify="center">
                  <a href={smsLink(team as unknown as TeamWithUsers)}>
                    <IconButton title="Text the team" variant="soft">
                      <ChatBubbleIcon />
                    </IconButton>
                  </a>
                  <a href={emailLink(team as unknown as TeamWithUsers)}>
                    <IconButton title="Text the team" variant="soft">
                      <EnvelopeClosedIcon />
                    </IconButton>
                  </a>
                </Flex>
              </Flex>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
