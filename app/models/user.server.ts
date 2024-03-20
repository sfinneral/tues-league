import type { Password, User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getAllUsers() {
  return prisma.user.findMany({ select: { profile: true, id: true } });
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
