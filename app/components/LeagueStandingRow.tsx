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
        <Table.Cell className="text-center">{standing.points}</Table.Cell>
      </Table.Row>
      {showRecord ? (
        <Table.Row>
          <Table.Cell colSpan={3}>
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
                </Flex>
              </Flex>
            ))}
          </Table.Cell>
        </Table.Row>
      ) : null}
    </>
  );
}
