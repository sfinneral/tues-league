import { Division, DivisionPayout, League } from "@prisma/client";
import { prisma } from "~/db.server";

export function getDivisionTeamsUsersProfileByLeagueSlug(slug: League["slug"]) {
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

export function getDivisionseByLeagueSlug(slug: League["slug"]) {
  return prisma.division.findMany({
    where: { league: { slug } },
    include: {
      schedule: true,
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

export function deleteDivisionById(id: Division["id"]) {
  return prisma.division.delete({
    where: { id },
  });
}

export interface PayoutConfig {
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number | null;
}

export const DEFAULT_PAYOUT: PayoutConfig = {
  firstPlace: 175,
  secondPlace: 50,
  thirdPlace: null,
};

export function getPayoutByDivisionId(
  divisionId: Division["id"],
): Promise<DivisionPayout | null> {
  return prisma.divisionPayout.findUnique({
    where: { divisionId },
  });
}

export function upsertDivisionPayout(
  divisionId: Division["id"],
  firstPlace: number,
  secondPlace: number,
  thirdPlace: number | null,
) {
  return prisma.divisionPayout.upsert({
    where: { divisionId },
    update: { firstPlace, secondPlace, thirdPlace },
    create: { divisionId, firstPlace, secondPlace, thirdPlace },
  });
}
