import { describe, it, expect } from "vitest";
import type { PayoutConfig } from "~/models/division.server";
import type { MatchWithScoresAndTeams } from "~/models/match.server";
import { calculatePayouts } from "./payouts";

function buildMatches(teamScores: { teamId: string; score: number | null }[]) {
  const pairs = [];
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
  return pairs as unknown as MatchWithScoresAndTeams[];
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
      const a = result.find((r) => r.teamId === "A")!;
      const c = result.find((r) => r.teamId === "C")!;
      expect(a.amountWon).toBe(130);
      expect(c.amountWon).toBe(130);
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
      const a = result.find((r) => r.teamId === "A")!;
      const b = result.find((r) => r.teamId === "B")!;
      expect(a.amountWon).toBe(130);
      expect(b.amountWon).toBe(130);
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
