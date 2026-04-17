# Weekly Recap Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-triggered weekly recap email that sends match results, money winners, standings, and next week's schedule to all league members.

**Architecture:** New Prisma model `RecapEmail` tracks sends. A React Email template renders the HTML. A new admin route provides the UI to trigger sends and calls Resend. Data is transformed from existing Prisma queries (`getSchedulesByLeagueSlug`, `getStandingsBySlug`) into the email template's props.

**Tech Stack:** Remix v2, Prisma/SQLite, `@react-email/components`, Resend, Radix UI, Tailwind CSS

---

## File Map

| File                                           | Action | Responsibility                                         |
| ---------------------------------------------- | ------ | ------------------------------------------------------ |
| `prisma/schema.prisma`                         | Modify | Add `RecapEmail` model, add relation to `League`       |
| `app/models/recap-email.server.ts`             | Create | Prisma queries: create and fetch RecapEmail records    |
| `app/emails/weekly-recap.tsx`                  | Create | React Email template component (purely presentational) |
| `app/routes/_p.admin.$league.recap-emails.tsx` | Create | Admin route: loader, action, UI for triggering sends   |
| `app/routes/_p.profile.tsx`                    | Modify | Add "Recap Emails" admin link                          |
| `package.json`                                 | Modify | Add `@react-email/components` dependency               |

---

### Task 1: Install dependency and update Prisma schema

**Files:**

- Modify: `package.json` (add dependency)
- Modify: `prisma/schema.prisma:48-60` (League model) and append new model

- [ ] **Step 1: Install `@react-email/components`**

Run:

```bash
yarn add @react-email/components
```

- [ ] **Step 2: Add `RecapEmail` model to Prisma schema**

In `prisma/schema.prisma`, add the `recapEmails` relation to the `League` model (after the `playoffMatches` field on line 59):

```prisma
  recapEmails    RecapEmail[]
```

Then append the new model at the end of the file:

```prisma
model RecapEmail {
  id        String   @id @default(cuid())
  weekDate  String
  sentAt    DateTime @default(now())
  leagueId  String
  league    League   @relation(fields: [leagueId], references: [id])
}
```

- [ ] **Step 3: Generate and run the migration**

Run:

```bash
npx prisma migrate dev --name add-recap-email
```

Expected: Migration created, `prisma generate` runs automatically, no errors.

- [ ] **Step 4: Verify the schema compiles**

Run:

```bash
npx prisma validate
```

Expected: "The schema is valid."

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ package.json yarn.lock
git commit -m "add RecapEmail model and @react-email/components dependency"
```

---

### Task 2: Create RecapEmail model queries

**Files:**

- Create: `app/models/recap-email.server.ts`

- [ ] **Step 1: Create the model file**

Create `app/models/recap-email.server.ts`:

```ts
import { League } from "@prisma/client";
import { prisma } from "~/db.server";

export function createRecapEmail(weekDate: string, leagueId: string) {
  return prisma.recapEmail.create({
    data: {
      weekDate,
      leagueId,
    },
  });
}

export function getRecapEmailsByLeagueId(leagueId: League["id"]) {
  return prisma.recapEmail.findMany({
    where: { leagueId },
    orderBy: { sentAt: "desc" },
  });
}
```

- [ ] **Step 2: Verify typecheck passes**

Run:

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/models/recap-email.server.ts
git commit -m "add RecapEmail server queries"
```

---

### Task 3: Create the React Email template

**Files:**

- Create: `app/emails/weekly-recap.tsx`

- [ ] **Step 1: Create the email template**

Create `app/emails/weekly-recap.tsx`:

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface MatchData {
  team1: string;
  score1: number;
  team2: string;
  score2: number;
}

interface MoneyWinner {
  place: string;
  teamName: string;
  score: number;
  amount: number;
}

interface StandingRow {
  rank: number;
  teamName: string;
  points: number;
}

interface DivisionData {
  name: string;
  matches: MatchData[];
  moneyWinners: MoneyWinner[];
  standings: StandingRow[];
}

interface NextWeekData {
  date: string;
  divisions: {
    name: string;
    matchups: { team1: string; team2: string }[];
  }[];
}

export interface WeeklyRecapProps {
  weekNumber: number;
  weekDate: string;
  divisions: DivisionData[];
  nextWeek: NextWeekData | null;
}

const main: React.CSSProperties = {
  backgroundColor: "#111113",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "24px",
  maxWidth: "600px",
};

const heading: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const divisionHeading: React.CSSProperties = {
  color: "#5ccfcf",
  fontSize: "20px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "0 0 16px",
};

const sectionHeading: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "14px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  textAlign: "center" as const,
  margin: "0 0 12px",
};

const card: React.CSSProperties = {
  backgroundColor: "#1c1c21",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "16px",
};

const teamName: React.CSSProperties = {
  color: "#e2e8f0",
  fontSize: "14px",
};

const winnerName: React.CSSProperties = {
  color: "#e2e8f0",
  fontSize: "14px",
  fontWeight: "bold",
};

const scoreText: React.CSSProperties = {
  color: "#e2e8f0",
  fontSize: "14px",
  fontWeight: "bold",
};

const matchDivider: React.CSSProperties = {
  borderColor: "#2a2a32",
  margin: "8px 0",
};

const sectionDivider: React.CSSProperties = {
  borderColor: "#2a2a32",
  margin: "24px 0",
};

const moneyBadge: React.CSSProperties = {
  color: "#5ccfcf",
  fontSize: "13px",
  fontWeight: "600",
};

const standingsRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "4px 0",
  color: "#e2e8f0",
  fontSize: "14px",
};

const matchupText: React.CSSProperties = {
  color: "#e2e8f0",
  fontSize: "14px",
  textAlign: "center" as const,
  padding: "4px 0",
};

const footer: React.CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "32px",
};

export default function WeeklyRecapEmail({
  weekNumber,
  weekDate,
  divisions,
  nextWeek,
}: WeeklyRecapProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Week {weekNumber} Recap — {weekDate}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            Week {weekNumber} Recap — {weekDate}
          </Heading>

          {divisions.map((division) => (
            <Section key={division.name}>
              <Text style={divisionHeading}>{division.name}</Text>

              <Text style={sectionHeading}>Match Results</Text>
              <div style={card}>
                {division.matches.map((match, i) => {
                  const team1Wins = match.score1 < match.score2;
                  const team2Wins = match.score2 < match.score1;
                  return (
                    <div key={i}>
                      {i > 0 ? <Hr style={matchDivider} /> : null}
                      <table width="100%" cellPadding={0} cellSpacing={0}>
                        <tr>
                          <td style={team1Wins ? winnerName : teamName}>
                            {match.team1}
                            {team1Wins ? " ✓" : null}
                          </td>
                          <td style={scoreText} align="right">
                            {match.score1}
                          </td>
                        </tr>
                        <tr>
                          <td style={team2Wins ? winnerName : teamName}>
                            {match.team2}
                            {team2Wins ? " ✓" : null}
                          </td>
                          <td style={scoreText} align="right">
                            {match.score2}
                          </td>
                        </tr>
                      </table>
                    </div>
                  );
                })}
              </div>

              <Text style={sectionHeading}>Money Winners</Text>
              <div style={card}>
                <table width="100%" cellPadding={0} cellSpacing={0}>
                  {division.moneyWinners.map((winner) => (
                    <tr key={winner.teamName}>
                      <td style={teamName}>{winner.teamName}</td>
                      <td style={scoreText} align="center">
                        {winner.score}
                      </td>
                      <td style={moneyBadge} align="right">
                        {winner.place}
                      </td>
                    </tr>
                  ))}
                </table>
              </div>

              <Text style={sectionHeading}>Standings</Text>
              <div style={card}>
                <table width="100%" cellPadding={0} cellSpacing={0}>
                  {division.standings.map((row) => (
                    <tr key={row.teamName}>
                      <td style={{ ...standingsRow, width: "30px" }}>
                        {row.rank}.
                      </td>
                      <td style={standingsRow}>{row.teamName}</td>
                      <td style={standingsRow} align="right">
                        {row.points} pts
                      </td>
                    </tr>
                  ))}
                </table>
              </div>

              <Hr style={sectionDivider} />
            </Section>
          ))}

          {nextWeek ? <Section>
              <Text style={divisionHeading}>Next Week — {nextWeek.date}</Text>
              {nextWeek.divisions.map((division) => (
                <div key={division.name}>
                  <Text style={sectionHeading}>{division.name}</Text>
                  <div style={card}>
                    {division.matchups.map((matchup, i) => (
                      <Text key={i} style={matchupText}>
                        {matchup.team1} vs {matchup.team2}
                      </Text>
                    ))}
                  </div>
                </div>
              ))}
            </Section> : null}

          <Text style={footer}>Tuesday Twi League</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run:

```bash
npx tsc --noEmit
```

Expected: No errors. If `@react-email/components` types aren't found, run `yarn` first to ensure the install completed.

- [ ] **Step 3: Commit**

```bash
git add app/emails/weekly-recap.tsx
git commit -m "add React Email template for weekly recap"
```

---

### Task 4: Create the admin route

**Files:**

- Create: `app/routes/_p.admin.$league.recap-emails.tsx`

This is the largest task. The route has a loader (fetch data, compute week statuses), an action (transform data, render email, send via Resend), and UI (week list with send buttons).

- [ ] **Step 1: Create the route file with loader**

Create `app/routes/_p.admin.$league.recap-emails.tsx`:

```tsx
import {
  CheckCircledIcon,
  CrossCircledIcon,
  EnvelopeClosedIcon,
} from "@radix-ui/react-icons";
import {
  Badge,
  Button,
  Card,
  Callout,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import { render } from "@react-email/components";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { Resend } from "resend";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { getScores } from "~/components/WeekResults";
import WeeklyRecapEmail from "~/emails/weekly-recap";
import type { WeeklyRecapProps } from "~/emails/weekly-recap";
import { getDivisionTeamsUsersProfileByLeagueSlug } from "~/models/division.server";
import { getLeagueBySlug } from "~/models/league.server";
import {
  createRecapEmail,
  getRecapEmailsByLeagueId,
} from "~/models/recap-email.server";
import { getSchedulesByLeagueSlug } from "~/models/schedule.server";
import { getStandingsBySlug } from "~/models/standings.server";
import { formatDate, getTeamNameByMatch } from "~/utils";

const resend = new Resend(process.env.RESEND_API_KEY || "");

interface WeekStatus {
  date: string;
  weekNumber: number;
  allScoresEntered: boolean;
  allWinnersSaved: boolean;
  isReady: boolean;
  wasCancelled: boolean;
  sentAt: string | null;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const leagueSlug = params.league as string;
  const league = await getLeagueBySlug(leagueSlug);

  if (!league) {
    throw new Response("League not found", { status: 404 });
  }

  const schedules = await getSchedulesByLeagueSlug(leagueSlug);
  const recapEmails = await getRecapEmailsByLeagueId(league.id);

  const dateMap = new Map<
    string,
    {
      allScoresEntered: boolean;
      allWinnersSaved: boolean;
      wasCancelled: boolean;
    }
  >();

  for (const schedule of schedules) {
    for (const week of schedule.weeks) {
      const existing = dateMap.get(week.date);
      const scoresEntered =
        week.matches.length > 0 &&
        week.matches.every((m) => m.scores.every((s) => s.score !== null));
      const winnersSaved = week.winners.length > 0;

      if (existing) {
        existing.allScoresEntered = existing.allScoresEntered && scoresEntered;
        existing.allWinnersSaved = existing.allWinnersSaved && winnersSaved;
        existing.wasCancelled = existing.wasCancelled || week.wasCancelled;
      } else {
        dateMap.set(week.date, {
          allScoresEntered: scoresEntered,
          allWinnersSaved: winnersSaved,
          wasCancelled: week.wasCancelled,
        });
      }
    }
  }

  const sortedDates = Array.from(dateMap.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  const weekStatuses: WeekStatus[] = sortedDates.map((date, index) => {
    const status = dateMap.get(date)!;
    const recap = recapEmails.find((r) => r.weekDate === date);
    return {
      date,
      weekNumber: index + 1,
      allScoresEntered: status.allScoresEntered,
      allWinnersSaved: status.allWinnersSaved,
      isReady:
        status.allScoresEntered &&
        status.allWinnersSaved &&
        !status.wasCancelled,
      wasCancelled: status.wasCancelled,
      sentAt: recap ? recap.sentAt.toISOString() : null,
    };
  });

  return json({ weekStatuses, leagueSlug });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const weekDate = formData.get("weekDate") as string;
  const weekNumber = Number(formData.get("weekNumber"));
  const leagueSlug = params.league as string;

  const league = await getLeagueBySlug(leagueSlug);
  if (!league) {
    return json({ error: "League not found", success: false }, { status: 404 });
  }

  const schedules = await getSchedulesByLeagueSlug(leagueSlug);
  const standings = await getStandingsBySlug(leagueSlug);

  const allDates = new Set<string>();
  for (const schedule of schedules) {
    for (const week of schedule.weeks) {
      allDates.add(week.date);
    }
  }
  const sortedAllDates = Array.from(allDates).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );
  const currentDateIndex = sortedAllDates.indexOf(weekDate);
  const nextWeekDate =
    currentDateIndex < sortedAllDates.length - 1
      ? sortedAllDates[currentDateIndex + 1]
      : null;

  const divisionProps: WeeklyRecapProps["divisions"] = [];

  for (const schedule of schedules) {
    const week = schedule.weeks.find((w) => w.date === weekDate);
    if (!week || week.wasCancelled) continue;

    const matchData = week.matches.map((match) => {
      const team1Id = match.scores[0].teamId;
      const team2Id = match.scores[1].teamId;
      return {
        team1: getTeamNameByMatch(match, team1Id),
        score1: match.scores[0].score!,
        team2: getTeamNameByMatch(match, team2Id),
        score2: match.scores[1].score!,
      };
    });

    const scores = getScores(week.matches);
    const moneyWinners = scores
      .filter((s) => s.place)
      .map((s) => ({
        place: s.place!,
        teamName: s.teamName,
        score: s.score!,
        amount: s.amountWon || 0,
      }));

    const divisionStandings = standings.find(
      (s) => s.division.id === schedule.division.id,
    );
    const standingsData = (divisionStandings?.standings || []).map(
      (s, index) => ({
        rank: index + 1,
        teamName: s.teamName,
        points: s.points,
      }),
    );

    divisionProps.push({
      name: schedule.division.name,
      matches: matchData,
      moneyWinners,
      standings: standingsData,
    });
  }

  let nextWeek: WeeklyRecapProps["nextWeek"] = null;
  if (nextWeekDate) {
    const nextDivisions: {
      name: string;
      matchups: { team1: string; team2: string }[];
    }[] = [];
    for (const schedule of schedules) {
      const week = schedule.weeks.find((w) => w.date === nextWeekDate);
      if (!week || week.wasCancelled) continue;
      const matchups = week.matches.map((match) => ({
        team1: getTeamNameByMatch(match, match.scores[0].teamId),
        team2: getTeamNameByMatch(match, match.scores[1].teamId),
      }));
      nextDivisions.push({ name: schedule.division.name, matchups });
    }
    if (nextDivisions.length > 0) {
      nextWeek = { date: formatDate(nextWeekDate), divisions: nextDivisions };
    }
  }

  const emailProps: WeeklyRecapProps = {
    weekNumber,
    weekDate: formatDate(weekDate),
    divisions: divisionProps,
    nextWeek,
  };

  const html = await render(WeeklyRecapEmail(emailProps));

  const divisions = await getDivisionTeamsUsersProfileByLeagueSlug(leagueSlug);
  const recipientEmails = new Set<string>();

  if (process.env.NODE_ENV === "production") {
    for (const division of divisions) {
      for (const team of division.teams) {
        for (const user of team.users) {
          if (user.email) {
            recipientEmails.add(user.email);
          }
        }
      }
    }
  } else {
    recipientEmails.add("sfinneral@gmail.com");
  }

  const recipients = Array.from(recipientEmails);

  if (recipients.length === 0) {
    return json(
      { error: "No recipients found", success: false },
      { status: 400 },
    );
  }

  const { error } = await resend.emails.send({
    from: "Tuesday Twi League <news@mail.afternoongolfer.com>",
    to: recipients,
    subject: `Week ${weekNumber} Recap — ${formatDate(weekDate)}`,
    html,
  });

  if (error) {
    return json(
      { error: `Failed to send email: ${error.message}`, success: false },
      { status: 500 },
    );
  }

  await createRecapEmail(weekDate, league.id);

  return json({ success: true, error: null });
}

export default function RecapEmails() {
  const { weekStatuses, leagueSlug } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submittingDate = isSubmitting
    ? navigation.formData?.get("weekDate")
    : null;

  return (
    <div>
      <Heading mb="4">Recap Emails</Heading>

      {actionData?.success ? <Callout.Root color="green" mb="4">
          <Callout.Icon>
            <CheckCircledIcon />
          </Callout.Icon>
          <Callout.Text>Recap email sent successfully!</Callout.Text>
        </Callout.Root> : null}

      {actionData?.error ? <Callout.Root color="red" mb="4">
          <Callout.Icon>
            <CrossCircledIcon />
          </Callout.Icon>
          <Callout.Text>{actionData.error}</Callout.Text>
        </Callout.Root> : null}

      <Flex direction="column" gap="3">
        {weekStatuses.map((week) => {
          if (week.wasCancelled) return null;

          return (
            <Card key={week.date}>
              <Flex justify="between" align="center">
                <Flex direction="column" gap="1">
                  <Text weight="bold" size="3">
                    Week {week.weekNumber} — {formatDate(week.date)}
                  </Text>
                  <Flex gap="2">
                    <Badge color={week.allScoresEntered ? "green" : "gray"}>
                      {week.allScoresEntered
                        ? "Scores complete"
                        : "Missing scores"}
                    </Badge>
                    <Badge color={week.allWinnersSaved ? "green" : "gray"}>
                      {week.allWinnersSaved ? "Winners saved" : "No winners"}
                    </Badge>
                  </Flex>
                  {week.sentAt ? <Text size="1" color="gray">
                      <EnvelopeClosedIcon
                        style={{
                          display: "inline",
                          verticalAlign: "middle",
                          marginRight: "4px",
                        }}
                      />
                      Sent {new Date(week.sentAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Text> : null}
                </Flex>
                <div>
                  {week.sentAt ? (
                    <ConfirmDialog
                      title="Resend Recap Email"
                      description={`Are you sure you want to resend the Week ${week.weekNumber} recap email to all league members?`}
                      confirmLabel="Resend"
                      color="blue"
                      trigger={
                        <Button
                          variant="soft"
                          disabled={!week.isReady || isSubmitting}
                          loading={submittingDate === week.date}
                        >
                          Resend
                        </Button>
                      }
                      onConfirm={() => {
                        const form = document.getElementById(
                          `form-${week.date}`,
                        ) as HTMLFormElement;
                        form?.requestSubmit();
                      }}
                    />
                  ) : (
                    <Form method="post" id={`form-${week.date}`}>
                      <input type="hidden" name="weekDate" value={week.date} />
                      <input
                        type="hidden"
                        name="weekNumber"
                        value={week.weekNumber}
                      />
                      <Button
                        type="submit"
                        disabled={!week.isReady || isSubmitting}
                        loading={submittingDate === week.date}
                      >
                        Send Recap Email
                      </Button>
                    </Form>
                  )}
                  {week.sentAt ? <Form
                      method="post"
                      id={`form-${week.date}`}
                      style={{ display: "none" }}
                    >
                      <input type="hidden" name="weekDate" value={week.date} />
                      <input
                        type="hidden"
                        name="weekNumber"
                        value={week.weekNumber}
                      />
                    </Form> : null}
                </div>
              </Flex>
            </Card>
          );
        })}
      </Flex>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run:

```bash
npx tsc --noEmit
```

Expected: No errors. The most likely issue will be the `render` import — `@react-email/components` re-exports `render` from `@react-email/render`. If `render` is not available from `@react-email/components`, install `@react-email/render` separately and import from there.

- [ ] **Step 3: Test in the browser**

Navigate to `http://localhost:3000/admin/{leagueSlug}/recap-emails`. Verify:

- Week list shows with correct dates and status badges
- Weeks with all scores and winners show the "Send Recap Email" button enabled
- Weeks without scores show disabled buttons
- No console errors

- [ ] **Step 4: Test sending an email in dev**

Click "Send Recap Email" for a completed week. Verify:

- The email is sent to `sfinneral@gmail.com` (check Resend dashboard or inbox)
- A success callout appears
- The "Sent" timestamp appears
- The button changes to "Resend" with a confirmation dialog

- [ ] **Step 5: Commit**

```bash
git add app/routes/_p.admin.$league.recap-emails.tsx
git commit -m "add admin route for sending recap emails"
```

---

### Task 5: Add admin nav link

**Files:**

- Modify: `app/routes/_p.profile.tsx:146-158`

- [ ] **Step 1: Add the Recap Emails link to the admin section**

In `app/routes/_p.profile.tsx`, after the "Enter Scores" link (line 148) add:

```tsx
<Link to={`/admin/${leagueSlug}/recap-emails`}>
  <Button>Recap Emails</Button>
</Link>
```

The full admin links block (lines 146–158) should become:

```tsx
            <Link to={`/admin/${leagueSlug}/matches`}>
              <Button>Enter Scores</Button>
            </Link>
            <Link to={`/admin/${leagueSlug}/recap-emails`}>
              <Button>Recap Emails</Button>
            </Link>
            {isSteve ? (
              <>
                <Link to={`/admin/users`}>
                  <Button>Users</Button>
                </Link>
                <Link to={`/admin/${leagueSlug}/playoffs`}>
                  <Button>Playoffs</Button>
                </Link>
              </>
            ) : null}
```

- [ ] **Step 2: Verify the link appears**

Navigate to `http://localhost:3000/profile`. As an admin user, verify the "Recap Emails" button appears in the admin links section and navigates to the correct route.

- [ ] **Step 3: Commit**

```bash
git add app/routes/_p.profile.tsx
git commit -m "add recap emails link to admin profile section"
```

---

### Task 6: End-to-end verification

- [ ] **Step 1: Full flow test**

1. Navigate to the profile page → click "Recap Emails"
2. Verify the week list shows correctly
3. Find a week where all scores are entered and winners saved
4. Click "Send Recap Email"
5. Verify success callout appears
6. Check that the email arrives at `sfinneral@gmail.com`
7. Verify the email contains: match results for both divisions, money winners, standings, and next week's schedule
8. Verify the "Sent" timestamp now shows on that week
9. Click "Resend" → verify the confirmation dialog appears → confirm → verify second email arrives

- [ ] **Step 2: Edge case checks**

1. Navigate to a week with missing scores → verify the button is disabled
2. If there is a cancelled week → verify it doesn't appear in the list
3. Check the last week of the season → verify the "Next Week's Schedule" section is absent from the email

- [ ] **Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix issues found during e2e verification"
```
