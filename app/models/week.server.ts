import { Schedule, Week } from "@prisma/client";
import { prisma } from "~/db.server";
import { MatchWithScoresAndTeams } from "./match.server";

export interface WeekWithTheWorks extends Week {
  matches: MatchWithScoresAndTeams[];
}

export function createWeek(date: Week["date"], scheduleId: Schedule["id"]) {
  return prisma.week.create({
    data: {
      date,
      scheduleId,
    },
  });
}
