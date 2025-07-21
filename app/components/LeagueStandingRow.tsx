import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";
import { Badge, Flex, Table, Text } from "@radix-ui/themes";
import { useState } from "react";
import { Standing } from "~/models/standings.server";
import { formatDateMini } from "~/utils";

interface LeagueStandingRowProps {
  standing: Standing;
}

export default function LeagueStandingRow({
  standing,
}: LeagueStandingRowProps) {
  const [showRecord, setShowRecord] = useState(false);
  const badgeColor = (outcome: string) => {
    return outcome === "w" ? "green" : outcome === "l" ? "red" : "blue";
  };
  const totalScore = (totalScore: number) => {
    const score = totalScore - standing.matchRecord.length * 36;
    if (score === 0) return "EVEN";
    else if (score >= 0) return `+${score}`;
    else return score;
  };
  return (
    <>
      <Table.Row
        key={standing.teamId}
        onClick={() => setShowRecord(!showRecord)}
        className="cursor-pointer"
      >
        <Table.RowHeaderCell>
          <Flex align="center">
            {showRecord ? (
              <CaretDownIcon color="green" />
            ) : (
              <CaretRightIcon color="green" />
            )}
            <Text>{standing.teamName}</Text>
          </Flex>
        </Table.RowHeaderCell>
        <Table.Cell>
          <Flex justify="between">
            <div>{standing.wins}</div>
            <div>-</div>
            <div>{standing.losses}</div>
            <div>-</div>
            <div>{standing.ties}</div>
          </Flex>
        </Table.Cell>
        <Table.Cell className="text-center">
          {totalScore(standing.totalScore)}
        </Table.Cell>
        <Table.Cell className="text-center">
          {`$${standing.totalAmountWon}`}
        </Table.Cell>
      </Table.Row>
      {showRecord ? (
        <Table.Row>
          <Table.Cell colSpan={4}>
            {standing.matchRecord.map((record) => (
              <Flex justify="between" key={record.date} my="1">
                <Flex>
                  <Text color="gray" className="w-12">
                    {formatDateMini(record.date)}
                  </Text>
                  <Text color="gray" className="mr-auto">
                    {record.opponent.name}
                  </Text>
                </Flex>
                <Flex justify="end">
                  <Text color="gray">
                    {record.teamScore} - {record.opponent.score}
                  </Text>
                  <Flex className="w-8" ml="2" justify="center">
                    <Badge color={badgeColor(record.outcome)}>
                      {record.outcome.toUpperCase()}
                    </Badge>
                  </Flex>
                  <Flex className="w-7" ml="1" justify="center">
                    <Text color="gray">
                      {record.amountWon ? `${record.amountWon}` : ' '}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            ))}
            <Flex justify="between">
              <Text ml="8">Total</Text>
              <Text className="ml-auto">{`${totalScore(standing.totalScore)} vs ${totalScore(
                standing.totalOpponentScore,
              )}`}</Text>
              <Flex className="w-16" ml="2" justify="end">
                <Text>{`$${standing.totalAmountWon}`}</Text>
              </Flex>
            </Flex>
          </Table.Cell>
        </Table.Row>
      ) : null}
    </>
  );
}
