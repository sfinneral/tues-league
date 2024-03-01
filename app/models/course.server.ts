import type { Course } from "@prisma/client";
import { prisma } from "~/db.server";

export function getCourseBySlug(slug: Course["slug"]) {
  return prisma.course.findFirst({
    where: {
      slug,
    },
  });
}

export function getAllCourses() {
  return prisma.course.findMany();
}

export function createCourse(name: Course["name"], slug: Course["slug"]) {
  return prisma.course.create({
    data: {
      name,
      slug,
    },
  });
}
