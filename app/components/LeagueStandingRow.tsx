import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";
import { Badge, Flex, Table, Text } from "@radix-ui/themes";
import { useState } from "react";
import { Standing } from "~/models/standings.server";
import { formatCurrency, formatDateMini } from "~/utils";

interface LeagueStandingRowProps {
  standing: Standing;
  allStandings: Standing[];
}

export default function LeagueStandingRow({
  standing,
  allStandings
}: LeagueStandingRowProps) {
  const [showRecord, setShowRecord] = useState(false);

  const getPlace = () => {
    const currentPoints = standing.points;
    const samePoints = allStandings.filter(s => s.points === currentPoints).length > 1;

    // Find how many unique point values are higher than current
    const higherPoints = new Set(
      allStandings
        .filter(s => s.points > currentPoints)
        .map(s => s.points)
    ).size;

    const place = higherPoints + 1;
    return samePoints ? `T${place}` : place.toString();
  };

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
        <Table.Cell className="sm:table-cell hidden">
          {getPlace()}
        </Table.Cell>
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
        <Table.Cell className="text-center sm:table-cell hidden">
          {standing.points}
        </Table.Cell>
        <Table.Cell className="text-center  sm:table-cell hidden">
          {`$${standing.totalAmountWon}`}
        </Table.Cell>

      </Table.Row>
      {showRecord ? (
        <Table.Row>
          <Table.Cell className="[&[colspan]]:col-span-3 sm:[&[colspan]]:col-span-7" colSpan={7}>
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
                  <Flex
                    ml="1"
                    justify="end"
                    className="w-8"
                    display={{ initial: 'none', xs: 'flex' }}
                  >
                    <Text color="gray">
                      {record.amountWon ? `${formatCurrency(record.amountWon)}` : ' '}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            ))}
            <Flex justify="between">
              <Text ml="8">Total</Text>
              <Text className="ml-auto mr-10 sm:mr-0">{`${totalScore(standing.totalScore)} vs ${totalScore(
                standing.totalOpponentScore,
              )}`}</Text>
              <Flex className="w-16" ml="2" justify="end" display={{ initial: 'none', xs: 'flex' }}>
                <Text>{`$${standing.totalAmountWon}`}</Text>
              </Flex>
            </Flex>
          </Table.Cell>
        </Table.Row>
      ) : null}
    </>
  );
}
