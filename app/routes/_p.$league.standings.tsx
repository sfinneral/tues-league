import { Card, Heading, Table, Text } from "@radix-ui/themes";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import LeagueStandingRow from "~/components/LeagueStandingRow";
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
            <Heading size="5" align="center" mb="4">
              {leagueStanding.division.name}
            </Heading>
            <Table.Root size="1">
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
                  <LeagueStandingRow
                    standing={standing}
                    key={standing.teamId}
                  />
                ))}
              </Table.Body>
            </Table.Root>
            <br />
          </Card>
        ))
      ) : (
        <Text>No standings yet</Text>
      )}
    </div>
  );
}
