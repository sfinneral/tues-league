import { Match, Score, Team } from "@prisma/client";
import { prisma } from "~/db.server";

export function createScore(
  matchId: Match["id"],
  teamId: Team["id"],
  score?: Score["score"],
) {
  return prisma.score.create({
    data: {
      matchId,
      teamId,
      score,
    },
  });
}

export function updateScore(id: Score["id"], score: Score["score"]) {
  return prisma.score.update({
    where: { id },
    data: {
      score,
    },
  });
}
