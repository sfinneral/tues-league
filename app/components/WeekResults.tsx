import { Card, Flex, Heading } from "@radix-ui/themes";
import { MatchWithScoresAndTeams } from "~/models/match.server";
import { getTeamNameByMatch } from "~/utils";

interface WeekResultsProps {
  matches: MatchWithScoresAndTeams[];
}

const getScores = (matches: MatchWithScoresAndTeams[]) => {
  const scores: { score: number | null; teamName: string }[] = [];
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
            <div>{score.teamName}</div>
            <div>{score.score}</div>
          </Flex>
        ))}
      </Card>
    </>
  );
}
