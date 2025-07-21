import { Schedule, Week } from "@prisma/client";
import { prisma } from "~/db.server";
import { MatchWithScoresAndTeams } from "./match.server";

export interface WeekWithTheWorks extends Week {
  matches: MatchWithScoresAndTeams[];
}

export interface WinnerData {
  teamId: string;
  amountWon: number;
}

export function createWeek(date: Week["date"], scheduleId: Schedule["id"]) {
  return prisma.week.create({
    data: {
      date,
      scheduleId,
    },
  });
}

export async function saveWinners(weekId: Week["id"], winners: WinnerData[]) {
  // Delete existing winners
  await prisma.winner.deleteMany({
    where: { weekId }
  });

  // Create new winners
  const winnerPromises = winners
    .filter((w) => w.amountWon > 0)
    .map((w) =>
      prisma.winner.create({
        data: {
          teamId: w.teamId,
          amountWon: w.amountWon,
          weekId
        }
      })
    );

  if (winnerPromises.length > 0) {
    await Promise.all(winnerPromises);
  }
}
