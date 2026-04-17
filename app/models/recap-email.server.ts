import { League } from "@prisma/client";
import { prisma } from "~/db.server";

export function createRecapEmail(weekDate: string, leagueId: string) {
  return prisma.recapEmail.create({
    data: {
      weekDate,
      leagueId,
    },
  });
}

export function getRecapEmailsByLeagueId(leagueId: League["id"]) {
  return prisma.recapEmail.findMany({
    where: { leagueId },
    orderBy: { sentAt: "desc" },
  });
}
