import type { Division, League, User } from "@prisma/client";
import { prisma } from "~/db.server";

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

export function getTeamsByDivisionId(divisionId: Division["id"]) {
  return prisma.team.findMany({
    where: {
      divisionId,
    },
    include: {
      users: true,
    },
  });
}

export function getTeamsUsersByLeagueSlug(slug: League["slug"]) {
  return prisma.team.findMany({
    where: {
      league: {
        slug,
      },
    },
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
