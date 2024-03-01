import type { Division, League, Team, User } from "@prisma/client";
import { prisma } from "~/db.server";
import { UserWithProfile } from "./user.server";


export interface TeamWithUsers extends Team {
  users: UserWithProfile[];
}

export function getTeamsByLeagueSlug(slug: League["slug"]) {
  return (
    prisma.league.findFirst({
      where: {
        slug,
      },
      select: {
        teams: true,
      },
    }) || []
  );
}

export function getTeamsUsersByLeague(league: League) {
  return prisma.team.findMany({
    where: { league },
    include: {
      users: true,
    },
  });
}

export function createTeam(
  leagueId: League["id"],
  divisionId: Division["id"],
  player1Id: User["id"],
  player2Id: User["id"],
) {
  return prisma.team.create({
    data: {
      leagueId,
      divisionId,
      users: {
        connect: [
          {
            id: player1Id,
          },
          {
            id: player2Id,
          },
        ],
      },
    },
  });
}
