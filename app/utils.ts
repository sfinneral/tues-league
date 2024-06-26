import { Team } from "@prisma/client";
import { useMatches } from "@remix-run/react";
import { useMemo } from "react";

import type { User } from "~/models/user.server";
import { MatchWithScoresAndTeams } from "./models/match.server";

const DEFAULT_REDIRECT = "/";

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT,
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
  id: string,
): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id],
  );
  return route?.data as Record<string, unknown>;
}

function isUser(user: unknown): user is User {
  return (
    user != null &&
    typeof user === "object" &&
    "email" in user &&
    typeof user.email === "string"
  );
}

export function useOptionalUser(): User | undefined {
  const data = useMatchesData("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

export function useUser(): User {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead.",
    );
  }
  return maybeUser;
}

export function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length > 3 && email.includes("@");
}
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function getTeamName(team: any): string {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return team.users.reduce((acc: any, curr: any) => {
    if (acc === "") {
      return curr.profile.lastName;
    } else {
      return `${acc} / ${curr.profile.lastName}`;
    }
  }, "");
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function shuffle(array: any[]) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
  }).format(new Date(dateString));
}

export function formatDateMini(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(dateString));
}

export const getTeamNameByMatch = (
  match: MatchWithScoresAndTeams,
  teamId: Team["id"],
) => {
  const team = match.teams.find((team) => team.id === teamId);
  return getTeamName(team);
};

export const formatPhoneNumber = (phoneNumberString?: string | null) => {
  if (!phoneNumberString) return "";
  const cleaned = cleanedPhoneNumber(phoneNumberString);
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return "(" + match[1] + ") " + match[2] + "-" + match[3];
  }
  return phoneNumberString;
};

export const cleanedPhoneNumber = (phoneNumberString?: string | null) => {
  if (!phoneNumberString) return "";
  if (phoneNumberString.split("")[0] === "1") {
    phoneNumberString = phoneNumberString.substring(1);
  }
  return ("" + phoneNumberString).replace(/\D/g, "");
};

export const formatCurrency = (number = 0) => {
  const usDollar = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return usDollar.format(number);
};
