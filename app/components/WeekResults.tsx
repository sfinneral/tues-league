import { Badge, BadgeProps, Card, Flex, Heading } from "@radix-ui/themes";
import { MatchWithScoresAndTeams } from "~/models/match.server";
import { formatCurrency, getTeamNameByMatch } from "~/utils";

interface WeekResultsProps {
  matches: MatchWithScoresAndTeams[];
}

interface ScoresSimple {
  score: number | null;
  teamName: string;
  place?: string;
  color?: BadgeProps["color"];
}

const getScores = (matches: MatchWithScoresAndTeams[]) => {
  const scores: ScoresSimple[] = [];
  const weeklyPayout = 225;
  const firstPlacePercent = 0.777777;
  const secondPlacePercent = 0.222222;
  matches.forEach((match) => {
    match.scores.forEach((score) => {
      scores.push({
        score: score.score,
        teamName: getTeamNameByMatch(match, score.teamId),
      });
    });
  });
  scores.sort((a, b) => {
    return (a.score || 100) - (b.score || 100);
  });

  if (scores[0].score && scores[0].score > 0) {
    // if tie for 1st
    if (scores[0].score === scores[1].score) {
      const amountOf1stTies = scores.filter(
        (score) => score.score === scores[0].score,
      ).length;
      for (let i = 0; i < amountOf1stTies; i++) {
        scores[i].place = `T1st ${formatCurrency(
          weeklyPayout / amountOf1stTies,
        )}`;
        scores[i].color = "green";
      }
    } else {
      scores[0].place = `1st ${formatCurrency(
        weeklyPayout * firstPlacePercent,
      )}`;
      scores[0].color = "green";
      // if tie for 2nd
      if (scores[1].score === scores[2].score) {
        // find all scores === scores[1]
        const amountOf2ndTies = scores.filter(
          (score) => score.score === scores[1].score,
        ).length;
        for (let i = 1; i < amountOf2ndTies + 1; i++) {
          scores[i].place = `T2nd ${formatCurrency(
            (weeklyPayout * secondPlacePercent) / amountOf2ndTies,
          )}`;
          scores[i].color = "blue";
        }
      } else {
        scores[1].place = `2nd ${formatCurrency(
          weeklyPayout * secondPlacePercent,
        )}`;
        scores[1].color = "blue";
      }
    }
  }
  return scores;
};

export function WeekResults({ matches }: WeekResultsProps) {
  return (
    <>
      <Heading align="center" size="2" mb="4">
        Week Results
      </Heading>
      <Card>
        {getScores(matches).map((score) => (
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
