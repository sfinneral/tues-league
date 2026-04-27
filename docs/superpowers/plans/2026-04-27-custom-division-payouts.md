# Custom Division Payouts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to configure per-division payout amounts (1st, 2nd, optional 3rd place) with tie-splitting logic, replacing the current hardcoded $225 weekly payout.

**Architecture:** Add a `DivisionPayout` model to store per-division payout config (1st/2nd/3rd place amounts). Extract payout calculation from `WeekResults.tsx` into a shared utility that accepts payout config and handles all tie scenarios. Update all consumers (`WeekResults`, league home save-winners, recap emails, standings) to pass payout config through. Add admin UI to the existing divisions page for configuring payouts.

**Tech Stack:** Prisma (SQLite), Remix, Radix UI, Vitest

---

## File Structure

| File                                           | Action | Responsibility                                             |
| ---------------------------------------------- | ------ | ---------------------------------------------------------- |
| `prisma/schema.prisma`                         | Modify | Add `DivisionPayout` model                                 |
| `app/models/division.server.ts`                | Modify | Add CRUD for division payouts                              |
| `app/utils/payouts.ts`                         | Create | Pure payout calculation logic (extracted from WeekResults) |
| `app/utils/payouts.test.ts`                    | Create | Tests for all payout + tie scenarios                       |
| `app/components/WeekResults.tsx`               | Modify | Use new payout utility instead of hardcoded logic          |
| `app/routes/_p.$league._index.tsx`             | Modify | Load payout config, pass to `getScores` and `WeekResults`  |
| `app/routes/_p.admin.$league.divisions.tsx`    | Modify | Add payout config UI per division                          |
| `app/routes/_p.$league.standings.tsx`          | Modify | Load payout config, replace hardcoded `225`                |
| `app/routes/_p.admin.$league.recap-emails.tsx` | Modify | Load payout config, pass to `getScores`                    |
| `app/models/schedule.server.ts`                | Modify | Include `DivisionPayout` in schedule queries               |

---

### Task 1: Add DivisionPayout model to Prisma schema

**Files:**

- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the DivisionPayout model and update Division**

In `prisma/schema.prisma`, add a new model after the `Division` model and add a relation to `Division`:

```prisma
model Division {
  id       String          @id @default(cuid())
  name     String
  teams    Team[]
  leagueId String
  league   League          @relation(fields: [leagueId], references: [id])
  schedule Schedule?
  payout   DivisionPayout?
}

model DivisionPayout {
  id          String   @id @default(cuid())
  firstPlace  Int
  secondPlace Int
  thirdPlace  Int?
  divisionId  String   @unique
  division    Division @relation(fields: [divisionId], references: [id], onDelete: Cascade)
}
```

`firstPlace` and `secondPlace` are required ints (dollar amounts). `thirdPlace` is optional (null means no 3rd place payout). The `onDelete: Cascade` ensures payouts are cleaned up when a division is deleted.

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add-division-payout
```

Expected: Migration succeeds, creates `DivisionPayout` table with columns `id`, `firstPlace`, `secondPlace`, `thirdPlace`, `divisionId`.

- [ ] **Step 3: Verify the generated client**

```bash
npx prisma generate
```

Expected: Prisma client regenerated with `DivisionPayout` type available.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add DivisionPayout model for per-division payout config"
```

---

### Task 2: Add division payout CRUD functions

**Files:**

- Modify: `app/models/division.server.ts`

- [ ] **Step 1: Add upsert and get functions for division payouts**

Add these functions to `app/models/division.server.ts`:

```typescript
import { Division, DivisionPayout, League } from "@prisma/client";

export interface PayoutConfig {
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number | null;
}

export const DEFAULT_PAYOUT: PayoutConfig = {
  firstPlace: 175,
  secondPlace: 50,
  thirdPlace: null,
};

export function getPayoutByDivisionId(
  divisionId: Division["id"],
): Promise<DivisionPayout | null> {
  return prisma.divisionPayout.findUnique({
    where: { divisionId },
  });
}

export function upsertDivisionPayout(
  divisionId: Division["id"],
  firstPlace: number,
  secondPlace: number,
  thirdPlace: number | null,
) {
  return prisma.divisionPayout.upsert({
    where: { divisionId },
    update: { firstPlace, secondPlace, thirdPlace },
    create: { divisionId, firstPlace, secondPlace, thirdPlace },
  });
}
```

Also add `DivisionPayout` to the existing import from `@prisma/client`.

- [ ] **Step 2: Commit**

```bash
git add app/models/division.server.ts
git commit -m "feat: add division payout CRUD and default config"
```

---

### Task 3: Create payout calculation utility with tests

**Files:**

- Create: `app/utils/payouts.ts`
- Create: `app/utils/payouts.test.ts`

This is the core logic extraction. The new function replaces the hardcoded calculation in `WeekResults.tsx`. It accepts a `PayoutConfig` and an array of matches, and returns scored results with payout amounts.

- [ ] **Step 1: Write failing tests for all payout scenarios**

Create `app/utils/payouts.test.ts`. The test file needs to build mock match data. Here is the full test file:

```typescript
import { describe, it, expect } from "vitest";
import { calculatePayouts } from "./payouts";
import type { PayoutConfig } from "~/models/division.server";

interface MockScore {
  score: number | null;
  teamId: string;
}

function buildMatches(teamScores: { teamId: string; score: number | null }[]) {
  const pairs: {
    scores: MockScore[];
    teams: { id: string; users: { profile: { lastName: string } }[] }[];
  }[] = [];
  for (let i = 0; i < teamScores.length; i += 2) {
    const t1 = teamScores[i];
    const t2 = teamScores[i + 1];
    pairs.push({
      scores: [
        { score: t1.score, teamId: t1.teamId },
        { score: t2.score, teamId: t2.teamId },
      ],
      teams: [
        { id: t1.teamId, users: [{ profile: { lastName: t1.teamId } }] },
        { id: t2.teamId, users: [{ profile: { lastName: t2.teamId } }] },
      ],
    });
  }
  return pairs as any;
}

const config3place: PayoutConfig = {
  firstPlace: 200,
  secondPlace: 60,
  thirdPlace: 40,
};

const config2place: PayoutConfig = {
  firstPlace: 175,
  secondPlace: 50,
  thirdPlace: null,
};

describe("calculatePayouts", () => {
  describe("with 3-place config ($200/$60/$40)", () => {
    it("assigns 1st, 2nd, 3rd with no ties", () => {
      const matches = buildMatches([
        { teamId: "A", score: 30 },
        { teamId: "B", score: 35 },
        { teamId: "C", score: 32 },
        { teamId: "D", score: 38 },
      ]);
      const result = calculatePayouts(matches, config3place);
      const a = result.find((r) => r.teamId === "A")!;
      const c = result.find((r) => r.teamId === "C")!;
      const b = result.find((r) => r.teamId === "B")!;
      const d = result.find((r) => r.teamId === "D")!;
      expect(a.amountWon).toBe(200);
      expect(c.amountWon).toBe(60);
      expect(b.amountWon).toBe(40);
      expect(d.amountWon).toBeUndefined();
    });

    it("handles 2-way tie for first", () => {
      const matches = buildMatches([
        { teamId: "A", score: 30 },
        { teamId: "B", score: 35 },
        { teamId: "C", score: 30 },
        { teamId: "D", score: 38 },
      ]);
      const result = calculatePayouts(matches, config3place);
      // (200+60)/2 = 130 each
      const a = result.find((r) => r.teamId === "A")!;
      const c = result.find((r) => r.teamId === "C")!;
      expect(a.amountWon).toBe(130);
      expect(c.amountWon).toBe(130);
      // 3rd place unchanged
      const b = result.find((r) => r.teamId === "B")!;
      expect(b.amountWon).toBe(40);
    });

    it("handles 3-way tie for first", () => {
      const matches = buildMatches([
        { teamId: "A", score: 30 },
        { teamId: "B", score: 30 },
        { teamId: "C", score: 30 },
        { teamId: "D", score: 38 },
      ]);
      const result = calculatePayouts(matches, config3place);
      // (200+60+40)/3 = 100 each
      const a = result.find((r) => r.teamId === "A")!;
      const b = result.find((r) => r.teamId === "B")!;
      const c = result.find((r) => r.teamId === "C")!;
      expect(a.amountWon).toBe(100);
      expect(b.amountWon).toBe(100);
      expect(c.amountWon).toBe(100);
    });

    it("handles 4-way tie for first", () => {
      const matches = buildMatches([
        { teamId: "A", score: 30 },
        { teamId: "B", score: 30 },
        { teamId: "C", score: 30 },
        { teamId: "D", score: 30 },
      ]);
      const result = calculatePayouts(matches, config3place);
      // (200+60+40)/4 = 75 each
      expect(result[0].amountWon).toBe(75);
      expect(result[1].amountWon).toBe(75);
      expect(result[2].amountWon).toBe(75);
      expect(result[3].amountWon).toBe(75);
    });

    it("handles 2-way tie for second", () => {
      const matches = buildMatches([
        { teamId: "A", score: 30 },
        { teamId: "B", score: 32 },
        { teamId: "C", score: 32 },
        { teamId: "D", score: 38 },
      ]);
      const result = calculatePayouts(matches, config3place);
      const a = result.find((r) => r.teamId === "A")!;
      const b = result.find((r) => r.teamId === "B")!;
      const c = result.find((r) => r.teamId === "C")!;
      expect(a.amountWon).toBe(200);
      // (60+40)/2 = 50 each
      expect(b.amountWon).toBe(50);
      expect(c.amountWon).toBe(50);
    });

    it("handles 3-way tie for second", () => {
      const matches = buildMatches([
        { teamId: "A", score: 30 },
        { teamId: "B", score: 32 },
        { teamId: "C", score: 32 },
        { teamId: "D", score: 32 },
      ]);
      const result = calculatePayouts(matches, config3place);
      const a = result.find((r) => r.teamId === "A")!;
      expect(a.amountWon).toBe(200);
      // (60+40)/3 = 33.33 -> 33 each
      const b = result.find((r) => r.teamId === "B")!;
      const c = result.find((r) => r.teamId === "C")!;
      const d = result.find((r) => r.teamId === "D")!;
      expect(b.amountWon).toBe(33);
      expect(c.amountWon).toBe(33);
      expect(d.amountWon).toBe(33);
    });

    it("handles 2-way tie for first and 2-way tie for third", () => {
      const matches = buildMatches([
        { teamId: "A", score: 30 },
        { teamId: "B", score: 30 },
        { teamId: "C", score: 35 },
        { teamId: "D", score: 35 },
        { teamId: "E", score: 40 },
        { teamId: "F", score: 42 },
      ]);
      const result = calculatePayouts(matches, config3place);
      // 2-way tie for 1st: (200+60)/2 = 130 each
      const a = result.find((r) => r.teamId === "A")!;
      const b = result.find((r) => r.teamId === "B")!;
      expect(a.amountWon).toBe(130);
      expect(b.amountWon).toBe(130);
      // 2-way tie for 3rd: 40/2 = 20 each
      const c = result.find((r) => r.teamId === "C")!;
      const d = result.find((r) => r.teamId === "D")!;
      expect(c.amountWon).toBe(20);
      expect(d.amountWon).toBe(20);
    });
  });

  describe("with 2-place config ($175/$50)", () => {
    it("assigns 1st and 2nd with no ties", () => {
      const matches = buildMatches([
        { teamId: "A", score: 30 },
        { teamId: "B", score: 35 },
        { teamId: "C", score: 32 },
        { teamId: "D", score: 38 },
      ]);
      const result = calculatePayouts(matches, config2place);
      const a = result.find((r) => r.teamId === "A")!;
      const c = result.find((r) => r.teamId === "C")!;
      expect(a.amountWon).toBe(175);
      expect(c.amountWon).toBe(50);
    });

    it("handles 2-way tie for first (splits full pot)", () => {
      const matches = buildMatches([
        { teamId: "A", score: 30 },
        { teamId: "B", score: 35 },
        { teamId: "C", score: 30 },
        { teamId: "D", score: 38 },
      ]);
      const result = calculatePayouts(matches, config2place);
      // (175+50)/2 = 112.5 -> 113 each
      const a = result.find((r) => r.teamId === "A")!;
      const c = result.find((r) => r.teamId === "C")!;
      expect(a.amountWon).toBe(113);
      expect(c.amountWon).toBe(113);
    });

    it("handles 2-way tie for second", () => {
      const matches = buildMatches([
        { teamId: "A", score: 30 },
        { teamId: "B", score: 32 },
        { teamId: "C", score: 32 },
        { teamId: "D", score: 38 },
      ]);
      const result = calculatePayouts(matches, config2place);
      const a = result.find((r) => r.teamId === "A")!;
      expect(a.amountWon).toBe(175);
      // 50/2 = 25 each
      const b = result.find((r) => r.teamId === "B")!;
      const c = result.find((r) => r.teamId === "C")!;
      expect(b.amountWon).toBe(25);
      expect(c.amountWon).toBe(25);
    });
  });

  it("does nothing when first score is null or 0", () => {
    const matches = buildMatches([
      { teamId: "A", score: null },
      { teamId: "B", score: null },
    ]);
    const result = calculatePayouts(matches, config3place);
    expect(result.every((r) => r.amountWon === undefined)).toBe(true);
  });

  it("includes place labels with dollar amounts", () => {
    const matches = buildMatches([
      { teamId: "A", score: 30 },
      { teamId: "B", score: 35 },
      { teamId: "C", score: 32 },
      { teamId: "D", score: 38 },
    ]);
    const result = calculatePayouts(matches, config3place);
    const a = result.find((r) => r.teamId === "A")!;
    const c = result.find((r) => r.teamId === "C")!;
    const b = result.find((r) => r.teamId === "B")!;
    expect(a.place).toContain("1st");
    expect(a.place).toContain("$200");
    expect(c.place).toContain("2nd");
    expect(b.place).toContain("3rd");
  });

  it("labels ties with T prefix", () => {
    const matches = buildMatches([
      { teamId: "A", score: 30 },
      { teamId: "B", score: 30 },
      { teamId: "C", score: 35 },
      { teamId: "D", score: 38 },
    ]);
    const result = calculatePayouts(matches, config3place);
    const a = result.find((r) => r.teamId === "A")!;
    const b = result.find((r) => r.teamId === "B")!;
    expect(a.place).toContain("T1st");
    expect(b.place).toContain("T1st");
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
npx vitest run app/utils/payouts.test.ts
```

Expected: All tests fail — `calculatePayouts` does not exist yet.

- [ ] **Step 3: Implement the calculatePayouts function**

Create `app/utils/payouts.ts`:

```typescript
import { BadgeProps } from "@radix-ui/themes";
import { MatchWithScoresAndTeams } from "~/models/match.server";
import type { PayoutConfig } from "~/models/division.server";
import { formatCurrency, getTeamNameByMatch, roundNumber } from "~/utils";

export interface ScoredResult {
  score: number | null;
  teamName: string;
  place?: string;
  color?: BadgeProps["color"];
  teamId: string;
  amountWon?: number;
}

export function calculatePayouts(
  matches: MatchWithScoresAndTeams[],
  config: PayoutConfig,
): ScoredResult[] {
  const scores: ScoredResult[] = [];

  matches.forEach((match) => {
    match.scores.forEach((score) => {
      scores.push({
        score: score.score,
        teamName: getTeamNameByMatch(match, score.teamId),
        teamId: score.teamId,
      });
    });
  });

  scores.sort((a, b) => (a.score || 100) - (b.score || 100));

  if (!scores[0]?.score || scores[0].score <= 0) {
    return scores;
  }

  const places = [config.firstPlace, config.secondPlace];
  if (config.thirdPlace !== null) {
    places.push(config.thirdPlace);
  }
  const totalPaidPlaces = places.length;

  let position = 0;
  while (position < totalPaidPlaces && position < scores.length) {
    const currentScore = scores[position].score;
    let tieCount = 0;
    for (let i = position; i < scores.length; i++) {
      if (scores[i].score === currentScore) {
        tieCount++;
      } else {
        break;
      }
    }

    const poolStart = position;
    const poolEnd = Math.min(position + tieCount, scores.length);
    const placesConsumed = poolEnd - poolStart;

    let pool = 0;
    for (
      let p = position;
      p < Math.min(position + placesConsumed, totalPaidPlaces);
      p++
    ) {
      pool += places[p];
    }

    const splitAmount = roundNumber(pool / placesConsumed);
    const placeNumber = position + 1;
    const tiePrefix = placesConsumed > 1 ? "T" : "";
    const placeLabel =
      placeNumber === 1 ? "1st" : placeNumber === 2 ? "2nd" : "3rd";
    const color: BadgeProps["color"] =
      placeNumber === 1 ? "green" : placeNumber === 2 ? "blue" : "bronze";

    for (let i = position; i < poolEnd; i++) {
      scores[i].place = `${tiePrefix}${placeLabel} ${formatCurrency(
        splitAmount,
      )}`;
      scores[i].amountWon = splitAmount;
      scores[i].color = color;
    }

    position += placesConsumed;
  }

  return scores;
}
```

The key logic: iterate through paid positions. At each position, count how many teams are tied at that score. Pool all prize money for the positions those tied teams consume, then split evenly. Advance past all tied teams and continue to the next paid position (if any remain).

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run app/utils/payouts.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/utils/payouts.ts app/utils/payouts.test.ts
git commit -m "feat: add payout calculation utility with tie-splitting logic"
```

---

### Task 4: Update WeekResults to use new payout utility

**Files:**

- Modify: `app/components/WeekResults.tsx`

- [ ] **Step 1: Replace getScores with calculatePayouts**

Rewrite `app/components/WeekResults.tsx` to delegate to the new utility. The `getScores` export must remain (it's used by the recap email and league home page) but should now accept a `PayoutConfig` parameter:

```typescript
import { Badge, BadgeProps, Card, Flex, Heading } from "@radix-ui/themes";
import { MatchWithScoresAndTeams } from "~/models/match.server";
import { DEFAULT_PAYOUT, PayoutConfig } from "~/models/division.server";
import { calculatePayouts, ScoredResult } from "~/utils/payouts";

interface WeekResultsProps {
  matches: MatchWithScoresAndTeams[];
  payoutConfig?: PayoutConfig;
}

export const getScores = (
  matches: MatchWithScoresAndTeams[],
  payoutConfig: PayoutConfig = DEFAULT_PAYOUT,
): ScoredResult[] => {
  return calculatePayouts(matches, payoutConfig);
};

export function WeekResults({ matches, payoutConfig }: WeekResultsProps) {
  return (
    <>
      <Heading align="center" size="2" mb="4">
        Week Results
      </Heading>
      <Card>
        {getScores(matches, payoutConfig).map((score) => (
          <Flex justify="between" key={score.teamName}>
            <div>
              {score.teamName}
              {score.place ? (
                <Badge ml="2" color={score.color}>
                  {score.place}
                </Badge>
              ) : null}
            </div>
            <div>{score.score || ""}</div>
          </Flex>
        ))}
      </Card>
    </>
  );
}
```

The `ScoresSimple` interface is removed — `ScoredResult` from the utility replaces it. The `getScores` function becomes a thin wrapper that defaults to `DEFAULT_PAYOUT` when no config is provided (backward-compatible for any callers that don't pass config yet).

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors. (Callers that don't pass `payoutConfig` yet still compile because the parameter defaults to `DEFAULT_PAYOUT`.)

- [ ] **Step 3: Commit**

```bash
git add app/components/WeekResults.tsx
git commit -m "refactor: delegate WeekResults payout calc to shared utility"
```

---

### Task 5: Load payout config in league home page and pass to components

**Files:**

- Modify: `app/models/schedule.server.ts`
- Modify: `app/routes/_p.$league._index.tsx`

The league home page currently calls `getScores(week.matches)` with no config. We need to make payout config available per division. The cleanest approach is to include the `DivisionPayout` relation in the schedule query so it's available everywhere schedules are loaded.

- [ ] **Step 1: Include payout in schedule query**

In `app/models/schedule.server.ts`, update the `getSchedulesByLeagueSlug` function to include the payout relation on the division include:

Change the `division` include from:

```typescript
      division: {
        include: {
          teams: true,
        },
      },
```

to:

```typescript
      division: {
        include: {
          teams: true,
          payout: true,
        },
      },
```

- [ ] **Step 2: Update league home page to use payout config**

In `app/routes/_p.$league._index.tsx`, update the `saveWinners` function and `WeekResults` component to use the division's payout config.

Add import:

```typescript
import { DEFAULT_PAYOUT, PayoutConfig } from "~/models/division.server";
```

Add a helper function inside `LeagueHome` to extract the config from a schedule:

```typescript
const getPayoutConfig = (
  schedule: (typeof schedules)[number],
): PayoutConfig => {
  if (schedule.division.payout) {
    return {
      firstPlace: schedule.division.payout.firstPlace,
      secondPlace: schedule.division.payout.secondPlace,
      thirdPlace: schedule.division.payout.thirdPlace,
    };
  }
  return DEFAULT_PAYOUT;
};
```

Update the `saveWinners` function call to pass config. Find this line:

```typescript
const winners = getScores(week.matches);
```

This needs to accept the schedule to get the config. Change the `saveWinners` function signature and body:

```typescript
const saveWinners = (
  week: WeekWithMatches,
  schedule: (typeof schedules)[number],
) => {
  const winners = getScores(week.matches, getPayoutConfig(schedule));
  const form = new FormData();
  form.append("weekId", week.id);
  form.append("winners", JSON.stringify(winners));
  fetcher.submit(form, { method: "post" });
};
```

Update the button's `onClick` in the JSX from:

```tsx
onClick={() => saveWinners(week)}
```

to:

```tsx
onClick={() => saveWinners(week, schedule)}
```

Update the `WeekResults` component usage from:

```tsx
<WeekResults matches={week.matches} />
```

to:

```tsx
<WeekResults matches={week.matches} payoutConfig={getPayoutConfig(schedule)} />
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add app/models/schedule.server.ts app/routes/_p.$league._index.tsx
git commit -m "feat: pass division payout config to WeekResults and save-winners"
```

---

### Task 6: Update recap emails to use payout config

**Files:**

- Modify: `app/routes/_p.admin.$league.recap-emails.tsx`

- [ ] **Step 1: Pass payout config to getScores in recap email action**

In `app/routes/_p.admin.$league.recap-emails.tsx`, the `action` function calls `getScores(matches)` at line 162. Add the import and pass config.

Add import:

```typescript
import { DEFAULT_PAYOUT } from "~/models/division.server";
```

Change this block (around line 162):

```typescript
const scores = getScores(matches);
```

to:

```typescript
const payoutConfig = schedule.division.payout
  ? {
      firstPlace: schedule.division.payout.firstPlace,
      secondPlace: schedule.division.payout.secondPlace,
      thirdPlace: schedule.division.payout.thirdPlace,
    }
  : DEFAULT_PAYOUT;
const scores = getScores(matches, payoutConfig);
```

This works because `getSchedulesByLeagueSlug` now includes the `payout` relation (from Task 5).

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add app/routes/_p.admin.$league.recap-emails.tsx
git commit -m "feat: use division payout config in recap emails"
```

---

### Task 7: Update standings page to use payout config

**Files:**

- Modify: `app/routes/_p.$league.standings.tsx`

The standings page has a hardcoded `225` for the admin audit footer. It should now compute the per-division weekly total from the payout config.

- [ ] **Step 1: Load payout config and replace hardcoded value**

In `app/routes/_p.$league.standings.tsx`, the standings data comes from `getStandingsBySlug` which returns `LeagueStandings[]` — each entry has a `division` field. The schedule query already includes `payout` on the division.

However, the standings server function returns a `Division` type which won't include the payout by default. The simplest fix is to also load the payout config in the standings route loader.

Add imports:

```typescript
import {
  getPayoutByDivisionId,
  DEFAULT_PAYOUT,
} from "~/models/division.server";
```

Update the loader to also fetch payout configs:

```typescript
export async function loader({ params }: LoaderFunctionArgs) {
  const leagueSlug = params.league as string;
  const leagueStandings = await getStandingsBySlug(leagueSlug);

  const payoutConfigs: Record<
    string,
    { firstPlace: number; secondPlace: number; thirdPlace: number | null }
  > = {};
  for (const ls of leagueStandings) {
    const payout = await getPayoutByDivisionId(ls.division.id);
    payoutConfigs[ls.division.id] = payout
      ? {
          firstPlace: payout.firstPlace,
          secondPlace: payout.secondPlace,
          thirdPlace: payout.thirdPlace,
        }
      : DEFAULT_PAYOUT;
  }

  return json({
    leagueStandings,
    payoutConfigs,
  });
}
```

In the component, replace the hardcoded `225` calculation. Change from:

```tsx
const { leagueStandings } = useLoaderData<typeof loader>();
```

to:

```tsx
const { leagueStandings, payoutConfigs } = useLoaderData<typeof loader>();
```

Add a helper to compute weekly total:

```typescript
const getWeeklyTotal = (divisionId: string) => {
  const config = payoutConfigs[divisionId] || DEFAULT_PAYOUT;
  return config.firstPlace + config.secondPlace + (config.thirdPlace || 0);
};
```

Replace the hardcoded `225` footer block. Change from:

```tsx
<Text size="2">{`${
  leagueStanding.standings[0].matchRecord.length
} weeks x 225 = ${formatCurrency(
  leagueStanding.standings[0].matchRecord.length * 225,
)}`}</Text>
```

to:

```tsx
<Text size="2">{`${
  leagueStanding.standings[0].matchRecord.length
} weeks x ${formatCurrency(
  getWeeklyTotal(leagueStanding.division.id),
)} = ${formatCurrency(
  leagueStanding.standings[0].matchRecord.length *
    getWeeklyTotal(leagueStanding.division.id),
)}`}</Text>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add app/routes/_p.$league.standings.tsx
git commit -m "feat: use division payout config in standings audit footer"
```

---

### Task 8: Add payout configuration UI to admin divisions page

**Files:**

- Modify: `app/routes/_p.admin.$league.divisions.tsx`

- [ ] **Step 1: Update loader to include payout data**

In `app/routes/_p.admin.$league.divisions.tsx`, update the loader to fetch divisions with their payout config.

Replace the `getDivisionsByLeague` import and add new imports:

```typescript
import {
  getDivisionsByLeague,
  getPayoutByDivisionId,
  upsertDivisionPayout,
  DEFAULT_PAYOUT,
} from "~/models/division.server";
```

Update the loader to include payout data with each division:

```typescript
export async function loader({ params }: LoaderFunctionArgs) {
  const league = await getLeagueBySlug(params.league as string);
  invariant(league, "league is invalid");
  const divisions = await getDivisionsByLeague(league);

  const divisionsWithPayouts = await Promise.all(
    divisions.map(async (division) => {
      const payout = await getPayoutByDivisionId(division.id);
      return {
        ...division,
        payout: payout
          ? {
              firstPlace: payout.firstPlace,
              secondPlace: payout.secondPlace,
              thirdPlace: payout.thirdPlace,
            }
          : null,
      };
    }),
  );

  return json({ divisions: divisionsWithPayouts });
}
```

- [ ] **Step 2: Add "savePayout" action handler**

In the `action` function, add a new case for saving payout config:

```typescript
if (action === "savePayout") {
  const divisionId = formData.get("divisionId") as string;
  const firstPlace = Number(formData.get("firstPlace"));
  const secondPlace = Number(formData.get("secondPlace"));
  const thirdPlaceRaw = formData.get("thirdPlace") as string;
  const thirdPlace = thirdPlaceRaw ? Number(thirdPlaceRaw) : null;

  invariant(Boolean(divisionId), "division id is required");
  invariant(
    !isNaN(firstPlace) && firstPlace > 0,
    "1st place amount is required",
  );
  invariant(
    !isNaN(secondPlace) && secondPlace > 0,
    "2nd place amount is required",
  );

  return upsertDivisionPayout(divisionId, firstPlace, secondPlace, thirdPlace);
}
```

- [ ] **Step 3: Add payout config form UI for each division**

Update the component to show payout configuration per division. Replace the existing division list section with a version that includes payout fields.

Replace the full component with:

```tsx
export default function AdminDivisions() {
  const { divisions } = useLoaderData<typeof loader>();
  const formRef = useRef<HTMLFormElement>(null);
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  useEffect(() => {
    formRef.current?.reset();
  }, [actionData]);
  return (
    <div>
      <Heading>Divisions</Heading>

      <section>
        {divisions.map((division) => (
          <Card key={division.id} my="4">
            <Flex justify="between" align="center" mb="3">
              <Heading size="3">{division.name}</Heading>
              <ConfirmDialog
                title="Delete Division"
                description={`Are you sure you want to delete "${division.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                trigger={
                  <IconButton color="red" variant="solid" size="1">
                    <Cross2Icon />
                  </IconButton>
                }
                onConfirm={() => {
                  const formData = new FormData();
                  formData.set("_action", "delete");
                  formData.set("divisionId", division.id);
                  submit(formData, { method: "post" });
                }}
              />
            </Flex>
            <Form method="post">
              <input type="hidden" name="_action" value="savePayout" />
              <input type="hidden" name="divisionId" value={division.id} />
              <Flex gap="3" align="end" wrap="wrap">
                <label>
                  <Text size="1" weight="bold" mb="1" as="p">
                    1st Place ($)
                  </Text>
                  <TextField.Root
                    name="firstPlace"
                    type="number"
                    defaultValue={
                      division.payout?.firstPlace ?? DEFAULT_PAYOUT.firstPlace
                    }
                    min={0}
                    style={{ width: 80 }}
                  />
                </label>
                <label>
                  <Text size="1" weight="bold" mb="1" as="p">
                    2nd Place ($)
                  </Text>
                  <TextField.Root
                    name="secondPlace"
                    type="number"
                    defaultValue={
                      division.payout?.secondPlace ?? DEFAULT_PAYOUT.secondPlace
                    }
                    min={0}
                    style={{ width: 80 }}
                  />
                </label>
                <label>
                  <Text size="1" weight="bold" mb="1" as="p">
                    3rd Place ($)
                  </Text>
                  <TextField.Root
                    name="thirdPlace"
                    type="number"
                    defaultValue={division.payout?.thirdPlace ?? ""}
                    min={0}
                    placeholder="—"
                    style={{ width: 80 }}
                  />
                </label>
                <Button type="submit" variant="soft">
                  Save Payouts
                </Button>
              </Flex>
            </Form>
          </Card>
        ))}
      </section>

      <Form method="post" ref={formRef}>
        <Card mt="4">
          <Heading size="2">Add new Division</Heading>
          <Flex gap="3" py="3">
            <TextField.Root name="name" placeholder="division name" />
            <Button name="_action" value="create" type="submit" variant="solid">
              save
            </Button>
          </Flex>
        </Card>
      </Form>
    </div>
  );
}
```

Add `Text` to the Radix imports at the top if not already there:

```typescript
import {
  Button,
  Card,
  Flex,
  Heading,
  IconButton,
  Text,
  TextField,
} from "@radix-ui/themes";
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/routes/_p.admin.$league.divisions.tsx
git commit -m "feat: add payout configuration UI to admin divisions page"
```

---

### Task 9: Manual testing and verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test admin payout configuration**

1. Navigate to the admin divisions page for a league
2. Verify each division shows payout fields pre-filled with defaults ($175/$50, empty 3rd)
3. Set Division 1 to $200/$60/$40 and click "Save Payouts"
4. Verify the values persist after page reload
5. Set Division 2 to $200/$60 (leave 3rd empty) and save
6. Verify it persists

- [ ] **Step 3: Test payout calculations on league home**

1. Navigate to the league home page
2. Find a week with scores entered
3. Verify Division 1 shows payouts based on $200/$60/$40
4. Verify Division 2 shows payouts based on $200/$60
5. If there's a week with tied scores, verify tie-splitting works correctly

- [ ] **Step 4: Test standings page**

1. Navigate to standings
2. As the admin, verify the footer shows the correct weekly total per division (not hardcoded 225)
3. Division 1 should show `N weeks x $300 = $X`
4. Division 2 should show `N weeks x $260 = $X`

- [ ] **Step 5: Test save/update winners**

1. On the league home page, click "Save Winners" for a week
2. Verify the correct payout amounts are saved
3. Check standings to confirm amounts match

- [ ] **Step 6: Commit any fixes if needed**
