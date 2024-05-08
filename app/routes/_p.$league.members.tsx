import { ChatBubbleIcon, EnvelopeClosedIcon } from "@radix-ui/react-icons";
import { Button, Card, Flex, Heading, IconButton, Text } from "@radix-ui/themes";
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
  const smsRoot = "sms://open?addresses="
  const emailRoot = "mailto:";

  const smsLink = (team: TeamWithUsers) => {
    const allUsers = [...team.users, ...(usersTeam?.users || [])];
    return smsRoot + allUsers.map(user => cleanedPhoneNumber(user.profile?.phoneNumber)).join(',');
  };

  const emailLink = (team: TeamWithUsers) => {
    const allUsers = [...team.users, ...(usersTeam?.users || [])];
    return emailRoot + allUsers.map(user => user.email).join(',');
  };

  const smsAllSubs = smsRoot + subs?.map(sub => cleanedPhoneNumber(sub.user.profile?.phoneNumber)).join(',')

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
                      <a href={smsRoot + cleanedPhoneNumber(sub.user.profile?.phoneNumber)}><IconButton variant="soft" title={`Text ${sub.user.profile?.firstName} ${sub.user.profile?.lastName}`}><ChatBubbleIcon /></IconButton></a>
                      <a href={emailRoot + sub.user.email}><IconButton variant="soft" title={`Email ${sub.user.profile?.firstName} ${sub.user.profile?.lastName}`}><EnvelopeClosedIcon /></IconButton></a>
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
            <a href={smsAllSubs} className="flex justify-center"><Button variant="soft"><ChatBubbleIcon />Text all subs</Button></a>
          </div>
        </div>
        : null}
    </div>
  );
}
