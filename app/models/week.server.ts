import { League, Schedule, Week } from "@prisma/client";
import { prisma } from "~/db.server";

export function createWeek(date: Week['date'], scheduleId: Schedule['id']) {
    return prisma.week.create({
        data: {
            date,
            scheduleId,
        },
    });
}

export function getSchedulesByLeagueSlug(leagueSlug: League['slug']) {
    return prisma.league.findMany({ where: { slug: leagueSlug } })
}