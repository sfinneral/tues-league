import { Card, Flex, Heading, Table, Text } from "@radix-ui/themes";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useRouteLoaderData } from "@remix-run/react";
import LeagueStandingRow from "~/components/LeagueStandingRow";
import {
  DEFAULT_PAYOUT,
  getPayoutByDivisionId,
} from "~/models/division.server";
import { getStandingsBySlug, Standing } from "~/models/standings.server";
import { formatCurrency } from "~/utils";

export async function loader({ params }: LoaderFunctionArgs) {
  const leagueSlug = params.league as string;
  const leagueStandings = await getStandingsBySlug(leagueSlug);

  const payoutConfigs: Record<
    string,
    { firstPlace: number; secondPlace: number; thirdPlace: number | null }
  > = {};
  for (const ls of leagueStandings) {
    const payout = await getPayoutByDivisionId(ls.division.id);
    payoutConfigs[ls.division.id] = payout
      ? {
          firstPlace: payout.firstPlace,
          secondPlace: payout.secondPlace,
          thirdPlace: payout.thirdPlace,
        }
      : DEFAULT_PAYOUT;
  }

  return json({
    leagueStandings,
    payoutConfigs,
  });
}

export default function LeagueStandings() {
  const { leagueStandings, payoutConfigs } = useLoaderData<typeof loader>();
  const { isSteve } = useRouteLoaderData("routes/_p") as { isSteve: boolean };
  const getWeeklyTotal = (divisionId: string) => {
    const config = payoutConfigs[divisionId] || { firstPlace: 175, secondPlace: 50, thirdPlace: null };
    return config.firstPlace + config.secondPlace + (config.thirdPlace || 0);
  };
  const getTotalAmountWon = (standings: Standing[]) => {
    return formatCurrency(
      standings.reduce((acc, standing) => {
        return acc + (standing.totalAmountWon || 0);
      }, 0),
    );
  };

  return (
    <div>
      {leagueStandings ? (
        leagueStandings.map((leagueStanding) => (
          <Card key={leagueStanding.division.id} className="mb-8">
            <Heading size="5" align="center" mb="4">
              {leagueStanding.division.name}
            </Heading>
            <Table.Root size="1">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell className="sm:table-cell hidden">
                    {" "}
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Team</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className="text-center">
                    Record
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className="text-center">
                    Total
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className="text-center sm:table-cell hidden">
                    Points
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className="text-center sm:table-cell hidden">
                    Won
                  </Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {leagueStanding.standings.map((standing) => (
                  <LeagueStandingRow
                    standing={standing}
                    allStandings={leagueStanding.standings}
                    key={standing.teamId}
                  />
                ))}
              </Table.Body>
            </Table.Root>
            {isSteve && leagueStanding?.standings[0]?.matchRecord ? (
              <Flex
                justify="between"
                p="2"
                display={{ initial: "none", xs: "flex" }}
              >
                <Text size="2">{`${
                  leagueStanding.standings[0].matchRecord.length
                } weeks x ${formatCurrency(getWeeklyTotal(leagueStanding.division.id))} = ${formatCurrency(
                  leagueStanding.standings[0].matchRecord.length *
                    getWeeklyTotal(leagueStanding.division.id),
                )}`}</Text>
                <Text size="2">
                  {getTotalAmountWon(leagueStanding.standings)}
                </Text>
              </Flex>
            ) : null}
            <br />
          </Card>
        ))
      ) : (
        <Text>No standings yet</Text>
      )}
    </div>
  );
}
