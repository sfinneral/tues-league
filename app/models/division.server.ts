import { Division, League } from "@prisma/client";
import { prisma } from "~/db.server";

export function getDivisionTeamsUsersProfileByLeagueSlug(slug: League['slug']) {
  return prisma.division.findMany({
    where: { league: { slug } },
    include: {
      league: true,
      teams: {
        include: {
          users: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
  });
}

export function getDivisionsByLeague(league: League) {
  return prisma.division.findMany({
    where: { league },
  });
}

export function createDivision(name: Division["name"], leagueId: League["id"]) {
  return prisma.division.create({
    data: {
      name,
      league: {
        connect: {
          id: leagueId,
        },
      },
    },
  });
}
