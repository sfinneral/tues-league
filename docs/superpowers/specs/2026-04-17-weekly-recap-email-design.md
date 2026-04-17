# Weekly Recap Email — Design Spec

## Overview

Admin-triggered weekly recap email sent to all league members (excluding subs) after scores and winners are finalized for a given week. One email per send covers all divisions.

## Data Model

New model to track sent emails:

```prisma
model RecapEmail {
  id        String   @id @default(cuid())
  weekDate  String
  sentAt    DateTime @default(now())
  leagueId  String
  league    League   @relation(fields: [leagueId], references: [id])
}
```

- `weekDate` stores the ISO date string (same format as `Week.date`), identifying which week-date the recap covers across all divisions.
- One record per send (multiple records if resent for the same date).
- Relation added to `League` (`recapEmails RecapEmail[]`). No direct FK to `Week` since a recap spans multiple division-specific weeks sharing the same date.

## Admin Route

**Path:** `_p.admin.$league.recap-emails.tsx` (maps to `/admin/:league/recap-emails`)

### Loader

Fetches:
- All schedules with weeks, matches, scores, winners via `getSchedulesByLeagueSlug`
- All RecapEmail records for the league

Groups weeks by date across divisions. For each date, computes:
- All scores entered? (every `score.score` is non-null)
- Winners saved? (`week.winners.length > 0`)
- Recap email sent? (RecapEmail record exists for that date + league)

### UI

A list of week dates, each showing:
- Date heading (e.g., "Tuesday, April 21, 2026")
- Per-division status badges: "Scores complete" / "Winners saved" / "Missing scores"
- "Sent on [timestamp]" indicator if already sent
- "Send Recap Email" button — enabled only when **all divisions** have scores entered and winners saved for that date
- "Resend" button with confirmation dialog if already sent

### Action

On form submit:
1. Gathers week data for the target date across all divisions
2. Computes standings through that week via `getStandingsBySlug`
3. Finds next week's schedule (next date in the schedule)
4. Collects recipient emails:
   - **Production:** All team member emails (excluding subs) via `getDivisionTeamsUsersProfileByLeagueSlug`
   - **Development:** Only `sfinneral@gmail.com`
5. Renders the React Email template to HTML
6. Sends via Resend (`from: "Afternoon Golfer <news@mail.afternoongolfer.com>"`)
7. On success: creates a `RecapEmail` record
8. On failure: returns error to the UI without creating a record

## Email Template

**File:** `app/emails/weekly-recap.tsx`

Uses `@react-email/components` with dark theme styling to match the app.

### Structure (top to bottom)

1. **Header** — "Week N Recap — [date]"
2. **Per-division block** (repeated for each division):
   - Division name heading
   - **Match Results** — Each match: two team rows with scores, winner indicated via bold/accent. Matches separated by dividers.
   - **Money Winners** — Sorted leaderboard: place, team name, score, payout amount
3. **Standings** — Per division: rank, team name, points (compact)
4. **Next Week's Schedule** — Date heading, then per-division matchups ("Team A vs Team B"). Omitted if last week of season.
5. **Footer** — "Afternoon Golfer" branding

### Props Interface

```ts
interface WeeklyRecapProps {
  weekNumber: number;
  weekDate: string;
  divisions: Array<{
    name: string;
    matches: Array<{
      team1: string;
      score1: number;
      team2: string;
      score2: number;
    }>;
    moneyWinners: Array<{
      place: string;
      teamName: string;
      score: number;
      amount: number;
    }>;
    standings: Array<{
      rank: number;
      teamName: string;
      points: number;
    }>;
  }>;
  nextWeek: {
    date: string;
    divisions: Array<{
      name: string;
      matchups: Array<{ team1: string; team2: string }>;
    }>;
  } | null;
}
```

Data transformation from Prisma models to props happens in the route action, not in the template.

## Email Delivery

- **Subject line:** "Week N Recap — [formatted date]"
- **From:** `Afternoon Golfer <news@mail.afternoongolfer.com>`
- **Provider:** Resend (existing `RESEND_API_KEY` env var)
- **Dev/Prod switch:** `process.env.NODE_ENV === "production"`

## Edge Cases

- **Cancelled weeks:** Skipped — no recap button shown.
- **Last week of season:** "Next Week's Schedule" section omitted.
- **Mismatched division weeks:** If a division is missing a week for a given date, skip that division rather than erroring.
- **Missing email addresses:** Users without emails are silently skipped.
- **Resend failure:** Error returned to admin UI; no RecapEmail record created.

## Out of Scope

- Resend rate limiting (free tier handles league-sized sends)
- Bounce tracking / delivery status
- Scheduled/automatic sends (admin-triggered only)

## New Dependency

`@react-email/components` — React components for building emails, with Tailwind support. First-class Resend integration.

## Files to Create

| File | Purpose |
|---|---|
| `app/emails/weekly-recap.tsx` | React Email template component |
| `app/routes/_p.admin.$league.recap-emails.tsx` | Admin route (loader + action + UI) |
| `app/models/recap-email.server.ts` | Prisma queries for RecapEmail |
| `prisma/migrations/...` | Migration for RecapEmail model |

## Files to Modify

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add RecapEmail model + relation to League |
| `app/routes/_p.tsx` | Add "Recap Emails" admin nav link |
