import { ChatBubbleIcon, EnvelopeClosedIcon } from "@radix-ui/react-icons";
import { Card, Flex, Heading, IconButton, Text } from "@radix-ui/themes";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getDivisionTeamsUsersProfileByLeagueSlug } from "~/models/division.server";
import { getSubsByLeagueSlug } from "~/models/sub.server";
import { TeamWithUsers } from "~/models/team.server";
import { getUsersTeams } from "~/models/user.server";
import { cleanedPhoneNumber, formatPhoneNumber } from "~/utils";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const leagueSlug = params.league as string;
  const divisions = await getDivisionTeamsUsersProfileByLeagueSlug(leagueSlug);
  const usersTeam = await getUsersTeams(request, leagueSlug);
  const leagueSubs = await getSubsByLeagueSlug(leagueSlug);

  return json({
    divisions,
    usersTeam,
    subs: leagueSubs?.subs
  });
}

export default function LeagueMembers() {
  const { divisions, usersTeam, subs } = useLoaderData<typeof loader>();

  const smsLink = (team: TeamWithUsers) => {
    let smsString = "sms://open?addresses=";
    const allUsers = [...team.users, ...(usersTeam?.users || [])];
    allUsers.forEach((team, index) => {
      smsString += `${cleanedPhoneNumber(team.profile?.phoneNumber)}${index < (allUsers.length - 1) ? "," : ""}`;
    });
    return smsString;
  };

  const emailLink = (team: TeamWithUsers) => {
    let emailString = "mailto:";
    const allUsers = [...team.users, ...(usersTeam?.users || [])];
    allUsers.forEach((user, index) => {
      emailString += `${user.email}${index < (allUsers.length - 1) ? "," : ""}`;
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
                    <Flex direction="column" gap='2' key={user.id}>
                      <Text weight="bold">
                        {user.profile?.firstName} {user.profile?.lastName}
                      </Text>
                      <Text size="1" color="gray">
                        {user.email}
                      </Text>
                      <Text size="1" color="gray">
                        {formatPhoneNumber(user.profile?.phoneNumber)}
                      </Text>
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
                    <IconButton title="Email the team" variant="soft">
                      <EnvelopeClosedIcon />
                    </IconButton>
                  </a>
                </Flex>
              </Flex>
            </Card>
          ))}
        </div>
      ))}
      {subs && subs.length ?
        <div>
          <Heading align="center" size="3">
            Subs
          </Heading>
          <div>
            {subs?.map(sub => (
              <Card my='4' key={sub.id}>
                <Flex justify='between' align='center' gap='2' key={sub.id}>
                  <Flex direction='column' gap='4'>
                    <Text weight="bold">
                      {sub.user.profile?.firstName} {sub.user.profile?.lastName}
                    </Text>
                    <Flex gap='2'>
                      <a href={`sms://open?addresses=${cleanedPhoneNumber(sub.user.profile?.phoneNumber)}`}><IconButton variant="soft" title={`Text ${sub.user.profile?.firstName} ${sub.user.profile?.lastName}`}><ChatBubbleIcon /></IconButton></a>
                      <a href={`mailto:${sub.user.email}`}><IconButton variant="soft" title={`Email ${sub.user.profile?.firstName} ${sub.user.profile?.lastName}`}><EnvelopeClosedIcon /></IconButton></a>
                    </Flex>
                  </Flex>
                  <Flex direction='column' gap='2'>
                    <Text size="1" color="gray">
                      {sub.user.email}
                    </Text>
                    <Text size="1" color="gray">
                      {formatPhoneNumber(sub.user.profile?.phoneNumber)}
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </div>
        </div>
        : null}
    </div>
  );
}
