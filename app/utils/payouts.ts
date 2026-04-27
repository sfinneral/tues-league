import { BadgeProps } from "@radix-ui/themes";
import type { PayoutConfig } from "~/models/division.server";
import { MatchWithScoresAndTeams } from "~/models/match.server";
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
