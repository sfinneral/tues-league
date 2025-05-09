import { Division, League, Schedule, Team, Week } from "@prisma/client";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { shuffle } from "~/utils";
import { getLeagueBySlug } from "./league.server";
import { createMatch } from "./match.server";
import { getTeamsByDivisionId } from "./team.server";
import { createWeek } from "./week.server";

export async function createSchedule(
  divisionId: Division["id"],
  leagueSlug: League["slug"],
  numberOfWeeks: number,
  startDate: string,
) {
  const league = await getLeagueBySlug(leagueSlug);
  invariant(league, "League is invalid");

  const schedule = await prisma.schedule.create({
    data: {
      leagueId: league.id,
      divisionId,
    },
  });
  const teams = await getTeamsByDivisionId(divisionId);

  const row1 = shuffle(teams);
  const row2 = shuffle(row1.splice(0, row1.length / 2));

  for (let index = 0; index < Number(numberOfWeeks); index++) {
    const date = new Date(startDate + "T08:00:00");
    date.setDate(date.getDate() + 7 * index);
    const week = await createWeek(date.toISOString(), schedule.id);
    row1.forEach(async (team, i) => {
      await createMatch(week.id, team.id, row2[i].id);
    });

    // remove and insert 0 index of row2 in 1 index of row1
    row1.splice(1, 0, row2[0]);
    row2.splice(0, 1);
    // remove last item in row1 and add it to end of row2
    row2.splice(row2.length, 0, row1[row1.length - 1]);
    row1.splice(-1, 1);
  }

  return getScheduleById(schedule.id);
}

export async function deleteWeekToSchedule(id: Schedule["id"], weekId: Week["id"]) {
  return prisma.week.delete({
    where: { id: weekId },
  });
}

export async function addWeekToSchedule(scheduleId: Schedule["id"], date: string, matches: { team1: Team["id"], team2: Team["id"] }[]) {
  const weekDate = new Date(date + "T08:00:00");
  const week = await createWeek(weekDate.toISOString(), scheduleId);
  matches.forEach(async (match) => {
    await createMatch(week.id, match.team1, match.team2);
  });
  return getScheduleById(scheduleId);
}

export async function getScheduleById(id: Schedule["id"]) {
  return prisma.schedule.findFirst({
    where: { id },
  });
}

export async function getScheduleByDivisionId(divisionId: Division["id"]) {
  return prisma.schedule.findFirst({ where: { divisionId } });
}

export async function getSchedulesByLeagueSlug(slug: League["slug"]) {
  return prisma.schedule.findMany({
    where: {
      league: { slug },
    },
    include: {
      division: {
        include: {
          teams: true,
        }
      },
      weeks: {
        orderBy: {
          date: "asc",
        },
        include: {
          matches: {
            include: {
              scores: true,
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
          },
        },
      },
    },
  });
}

export async function deleteScheduleByDivisionId(id: Division["id"]) {
  return prisma.schedule.delete({
    where: { divisionId: id },
    include: {
      division: true,
    },
  });
}
