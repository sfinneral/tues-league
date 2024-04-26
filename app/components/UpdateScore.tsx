import { Score } from "@prisma/client";
import { Flex, TextField } from "@radix-ui/themes";
import { useState } from "react";
import { MatchWithScoresAndTeams } from "~/models/match.server";
import { getTeamNameByMatch } from "~/utils";

interface UpdateScoreProps {
  match: MatchWithScoresAndTeams;
  score: Score;
}

export function UpdateScore({ match, score }: UpdateScoreProps) {
  const [theScore, setTheScore] = useState<number | null>(score.score);

  return (
    <Flex justify="between" align="center">
      {getTeamNameByMatch(match, score.teamId)}
      <TextField.Root
        size="3"
        className="w-14 text-center justify-center"
        type="number"
        name={score.id}
        value={theScore || undefined}
        onChange={(e) => setTheScore(Number(e.target.value))}
      />
    </Flex>
  );
}
