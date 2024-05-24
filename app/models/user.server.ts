import type { League, Password, Profile, User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/db.server";
import { getUserId } from "~/session.server";
import { getLeagueIdBySlug } from "./league.server";

export type { User } from "@prisma/client";

export interface UserWithProfile extends User {
  profile: Profile;
}

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
    },
  });
}

export function getUserWithSubs(id: User["id"]) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      subs: {
        include: {
          league: true,
        },
      },
    },
  });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    select: { profile: true, email: true, id: true },
  });
}

export async function createUser(
  email: User["email"],
  password: string,
  firstName: string,
  lastName: string,
  phoneNumber: string,
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
      profile: {
        create: {
          phoneNumber,
          firstName,
          lastName,
        },
      },
    },
  });
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}

export async function verifyLogin(
  email: User["email"],
  password: Password["hash"],
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash,
  );

  if (!isValid) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}

export async function getLeagueSlugByUserId(id: User["id"]) {
  const user = await prisma.user.findFirst({
    where: { id },
    select: {
      teams: {
        select: {
          league: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });
  return user?.teams[0]?.league.slug;
}

export async function updateUser(
  id: User["id"],
  email: User["email"],
  firstName: Profile["firstName"],
  lastName: Profile["lastName"],
  phoneNumber: Profile["phoneNumber"],
) {
  return prisma.user.update({
    where: { id },
    data: {
      email,
      profile: {
        update: {
          firstName,
          lastName,
          phoneNumber,
        },
      },
    },
  });
}

export async function getUsersTeams(
  request: Request,
  leagueSlug: League["slug"],
) {
  const userId = await getUserId(request);
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    select: {
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
  const league = await getLeagueIdBySlug(leagueSlug);

  return user && league
    ? user.teams.find((team) => team.leagueId === league.id)
    : null;
}
