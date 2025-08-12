import {
    Card,
    Flex,
    Text,
} from "@radix-ui/themes";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useRouteLoaderData } from "@remix-run/react";
import { prisma } from "~/db.server";
import { getTeamName } from "~/utils";

export async function loader({ params }: LoaderFunctionArgs) {
    const leagueSlug = params.league as string;

    const league = await prisma.league.findFirst({
        where: { slug: leagueSlug },
        include: {
            playoffMatches: {
                include: {
                    teams: {
                        include: {
                            users: {
                                include: {
                                    profile: true
                                }
                            }
                        }
                    }
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

export default function LeaguePlayoffs() {
    const { league } = useLoaderData<typeof loader>();
    const { isSteve } = useRouteLoaderData("routes/_p") as { isAdmin: boolean, isSteve: boolean };
    const rounds = [
        { games: 8, paddingTop: 'pt-4' },
        { games: 4, paddingTop: 'pt-20' },
        { games: 2, paddingTop: 'pt-48' },
        { games: 1, paddingTop: 'pt-96' }
    ];

    return (
        <div>
            <Card>
                <Flex>
                    {rounds.map((round, roundIndex) => (
                        <div key={roundIndex} className="flex-1 flex flex-col justify-around gap-y-8">
                            {Array.from({ length: round.games }).map((_, gameIndex) => {
                                // Calculate starting game number for each round
                                const previousGamesCount = rounds
                                    .slice(0, roundIndex)
                                    .reduce((sum, r) => sum + r.games, 0);
                                const gameNumber = previousGamesCount + gameIndex + 1;

                                return (
                                    <Flex direction="column" key={gameIndex} className="relative">
                                        {(() => {
                                            const match = league.playoffMatches.find(m => m.bracketNumber === gameNumber);
                                            return (
                                                <>
                                                    <Text size="1" className="p-2 border-b border-gray-600 whitespace-nowrap">
                                                        {match?.teams[0] ? getTeamName(match.teams[0]) : "\u00A0"}
                                                    </Text>
                                                    {isSteve ? <Text size="1" color="gray" className="absolute top-1/2 right-2">{gameNumber}</Text> : null}
                                                    <Text size="1" className={`p-2 ${round.paddingTop} border-b border-r border-gray-600 whitespace-nowrap`}>
                                                        {match?.teams[1] ? getTeamName(match.teams[1]) : "\u00A0"}
                                                    </Text>
                                                </>
                                            );
                                        })()}
                                    </Flex>
                                );
                            })}
                        </div>
                    ))}
                </Flex>
            </Card>
        </div>
    );
}