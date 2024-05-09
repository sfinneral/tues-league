import { Card, Flex, Heading, Table, Text } from "@radix-ui/themes";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getStandingsBySlug } from "~/models/standings.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const leagueSlug = params.league as string;
  const leagueStandings = await getStandingsBySlug(leagueSlug);

  return json({
    leagueStandings,
  });
}

export default function LeagueStandings() {
  const { leagueStandings } = useLoaderData<typeof loader>();
  return (
    <div>
      {leagueStandings ? (
        leagueStandings.map((leagueStanding) => (
          <Card key={leagueStanding.division.id} className="mb-8">
            <Heading size="5" align="center">
              {leagueStanding.division.name}
            </Heading>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Team</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className="text-center">
                    Record
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className="text-center">
                    Points
                  </Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {leagueStanding.standings.map((standing) => (
                  <Table.Row key={standing.teamId}>
                    <Table.RowHeaderCell>
                      {standing.teamName}
                    </Table.RowHeaderCell>
                    <Table.Cell>
                      <Flex justify="between">
                        <div>{standing.wins}</div>
                        <div>-</div>
                        <div>{standing.losses}</div>
                        <div>-</div>
                        <div>{standing.ties}</div>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      {standing.points}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Card>
        ))
      ) : (
        <Text>No standings yet</Text>
      )}
    </div>
  );
}
