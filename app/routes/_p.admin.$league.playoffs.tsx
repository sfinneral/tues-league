import { Button, Card, Flex, Heading, Select } from "@radix-ui/themes";
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import * as React from "react";
import { prisma } from "~/db.server";
import { getTeamName } from "~/utils";

export async function action({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData();
    const bracketNumber = Number(formData.get("bracketNumber"));
    const team1Id = formData.get("team1") as string;
    const team2Id = formData.get("team2") as string;
    const leagueSlug = params.league as string;

    const league = await prisma.league.findFirst({
        where: { slug: leagueSlug },
        select: { id: true }
    });

    if (!league) {
        throw new Response("League not found", { status: 404 });
    }

    // Find existing match for this bracket number
    const existingMatch = await prisma.playoffMatch.findFirst({
        where: {
            leagueId: league.id,
            bracketNumber
        },
        include: {
            teams: true
        }
    });

    if (existingMatch) {
        // First disconnect existing teams
        await prisma.playoffMatch.update({
            where: { id: existingMatch.id },
            data: {
                teams: {
                    disconnect: existingMatch.teams.map(team => ({ id: team.id }))
                }
            }
        });

        // Then connect new teams
        await prisma.playoffMatch.update({
            where: { id: existingMatch.id },
            data: {
                teams: {
                    connect: [{ id: team1Id }, { id: team2Id }]
                }
            }
        });
    } else {
        // Create new match
        await prisma.playoffMatch.create({
            data: {
                bracketNumber,
                leagueId: league.id,
                teams: {
                    connect: [{ id: team1Id }, { id: team2Id }]
                }
            }
        });
    }

    return json({ success: true });
}

export async function loader({ params }: LoaderFunctionArgs) {
    const leagueSlug = params.league as string;

    const league = await prisma.league.findFirst({
        where: { slug: leagueSlug },
        include: {
            teams: {
                include: {
                    users: {
                        include: {
                            profile: true
                        }
                    },
                    division: true
                }
            },
            playoffMatches: {
                include: {
                    teams: true
                },
                orderBy: {
                    bracketNumber: 'asc'
                }
            }
        }
    });

    if (!league) {
        throw new Response("League not found", { status: 404 });
    }

    return json({ league });
}

export default function AdminPlayoffs() {
    const { league } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";
    const [selectedTeams, setSelectedTeams] = React.useState<Record<number, { team1?: string; team2?: string }>>(
        // Initialize with existing matches
        league.playoffMatches.reduce((acc, match) => ({
            ...acc,
            [match.bracketNumber]: {
                team1: match.teams[0]?.id,
                team2: match.teams[1]?.id
            }
        }), {})
    );

    return (
        <div>
            <Heading size="4" mb="4">Playoff Matches</Heading>
            <Flex direction="column" gap="4">
                {Array.from({ length: 15 }).map((_, index) => {
                    const bracketNumber = index + 1;


                    return (
                        <Card key={bracketNumber}>
                            <Flex direction="column" gap="2">
                                <Heading size="2">Game {bracketNumber}</Heading>
                                <Form method="post">
                                    <input type="hidden" name="bracketNumber" value={bracketNumber} />
                                    <Flex gap="2" align="center">
                                        <Select.Root
                                            name="team1"
                                            value={selectedTeams[bracketNumber]?.team1 || ""}
                                            onValueChange={(value) => setSelectedTeams(prev => ({
                                                ...prev,
                                                [bracketNumber]: { ...prev[bracketNumber], team1: value }
                                            }))}
                                        >
                                            <Select.Trigger placeholder="Select Team 1" />
                                            <Select.Content>
                                                {league.teams.map(team => (
                                                    <Select.Item key={team.id} value={team.id}>
                                                        {getTeamName(team)}
                                                    </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select.Root>
                                        <span>vs</span>
                                        <Select.Root
                                            name="team2"
                                            value={selectedTeams[bracketNumber]?.team2 || ""}
                                            onValueChange={(value) => setSelectedTeams(prev => ({
                                                ...prev,
                                                [bracketNumber]: { ...prev[bracketNumber], team2: value }
                                            }))}
                                        >
                                            <Select.Trigger placeholder="Select Team 2" />
                                            <Select.Content>
                                                {league.teams.map(team => (
                                                    <Select.Item key={team.id} value={team.id}>
                                                        {getTeamName(team)}
                                                    </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select.Root>
                                        <Button
                                            type="submit"
                                            loading={isSubmitting}
                                            disabled={!selectedTeams[bracketNumber]?.team1 || !selectedTeams[bracketNumber]?.team2}
                                        >
                                            Save
                                        </Button>
                                    </Flex>
                                </Form>
                            </Flex>
                        </Card>
                    );
                })}
            </Flex>
        </div>
    );
}
