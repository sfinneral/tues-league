import { Match, Score, Team, Week } from "@prisma/client";
import { prisma } from "~/db.server";

export interface MatchWithScoresAndTeams extends Match {
  scores: Score[];
  teams: Team[];
}

export function createMatch(
  weekId: Week["id"],
  team1Id: Team["id"],
  team2Id: Team["id"],
) {
  return prisma.match.create({
    data: {
      weekId,
      teams: {
        connect: [
          {
            id: team1Id,
          },
          {
            id: team2Id,
          },
        ],
      },
      scores: {
        create: [{ teamId: team1Id }, { teamId: team2Id }],
      },
    },
  });
}
