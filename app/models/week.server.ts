import { Schedule, Week } from "@prisma/client";
import { prisma } from "~/db.server";

export function createWeek(date: Week['date'], scheduleId: Schedule['id']) {
    return prisma.week.create({
        data: {
            date,
            scheduleId,
        },
    });
}
