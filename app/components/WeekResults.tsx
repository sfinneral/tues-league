import { Badge, Card, Flex, Heading } from "@radix-ui/themes";
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
