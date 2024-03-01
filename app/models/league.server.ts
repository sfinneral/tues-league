import type { Course, League } from "@prisma/client";
import { prisma } from "~/db.server";

export function getLeagueBySlug(slug: Course["slug"]) {
  return prisma.league.findFirst({
    where: {
      slug,
    },
  });
}

export function getLeaguesByCourse(courseId: Course["id"]) {
  return prisma.league.findMany({
    where: { courseId: courseId },
  });
}

export function createLeague(
  name: League["name"],
  slug: League["slug"],
  startDate: League["startDate"],
  courseId: Course["id"],
) {
  return prisma.league.create({
    data: {
      name,
      slug,
      startDate,
      course: {
        connect: {
          id: courseId,
        },
      },
    },
  });
}
