import { Team } from "@prisma/client";
import { Button, Flex, TextField, Select } from "@radix-ui/themes";
import { MouseEventHandler, useMemo, useState } from "react";
import { getTeamName } from "~/utils";

interface AddaWeekProps {
    teams: Team[];
}

export default function AddaWeek({ teams = [] }: AddaWeekProps) {
    const [showForm, setShowForm] = useState(false);
    const [matches, setMatches] = useState<{ team1: Team, team2: Team }[]>([]);
    const [selectedTeam1, setSelectedTeam1] = useState<string | null>(null);
    const [selectedTeam2, setSelectedTeam2] = useState<string | null>(null);

    const clickAddAWeek: MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();
        setShowForm(true);
    }

    const [availableTeam1s, availableTeam2s] = useMemo(() => {
        const availableTeams = teams.filter((team) => {
            return !matches.some((match) => match.team1.id === team.id || match.team2.id === team.id);
        });
        return [
            availableTeams.filter((team) => team.id !== selectedTeam2),
            availableTeams.filter((team) => team.id !== selectedTeam1)
        ]
    }, [selectedTeam1, selectedTeam2, teams, matches]);


    // Radix Select passes the value directly, not an event
    const handleTeam1Change = (value: string) => {
        setSelectedTeam1(value);
    }

    const handleTeam2Change = (value: string) => {
        setSelectedTeam2(value);
    }

    const handleAddMatch = () => {
        if (selectedTeam1 && selectedTeam2) {
            const team1 = teams.find(team => team.id === selectedTeam1);
            const team2 = teams.find(team => team.id === selectedTeam2);

            if (team1 && team2) {
                setMatches([...matches, { team1, team2 }]);
                setSelectedTeam1(null);
                setSelectedTeam2(null);
            }
        }
    }

    const cancelAddWeek = () => {
        setMatches([]);
        setSelectedTeam1(null);
        setSelectedTeam2(null);
        setShowForm(false);
    }

    return (
        <div>
            {!showForm ? <Button variant="surface" onClick={clickAddAWeek}>Add a week</Button> : <Flex direction="column" gap="3" className="my-3">
                <TextField.Root placeholder="date" type="date" name="weekDate" />

                {matches.length > 0 ? <div>
                    <div className="text-sm font-medium mb-1">Scheduled Matches:</div>
                    {matches.map((match, index) => (
                        <Flex key={index} gap="2" align="center" className="py-1">
                            <div className="font-medium">{getTeamName(match.team1)}</div>
                            <div className="text-gray-500">vs</div>
                            <div className="font-medium">{getTeamName(match.team2)}</div>
                        </Flex>
                    ))}
                </div> : null}
                <Flex gap="2" align="center">
                    <Select.Root
                        name="team1Id"
                        value={selectedTeam1 || undefined}
                        onValueChange={handleTeam1Change}
                    >
                        <Select.Trigger placeholder="Select Team 1" />
                        <Select.Content>
                            {availableTeam1s.map((team) => (
                                <Select.Item key={team.id} value={team.id}>
                                    {getTeamName(team)}
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Root>

                    <span>vs</span>

                    <Select.Root
                        name="team2Id"
                        value={selectedTeam2 || undefined}
                        onValueChange={handleTeam2Change}
                    >
                        <Select.Trigger placeholder="Select Team 2" />
                        <Select.Content>
                            {availableTeam2s.map((team) => (
                                <Select.Item key={team.id} value={team.id}>
                                    {getTeamName(team)}
                                </Select.Item>
                            ))}
                        </Select.Content>
                    </Select.Root>
                    <input
                        type="hidden"
                        name="matches"
                        value={JSON.stringify(matches.map((match) => ({ team1: match.team1.id, team2: match.team2.id })))}
                    />
                    <Button variant="soft" type="button" onClick={handleAddMatch}>Add</Button>
                </Flex>

                <Flex gap="3" justify="end">
                    <Button
                        type="submit"
                        name="_action"
                        value="addWeek"
                        disabled={matches.length < teams.length / 2}
                    >
                        Add week
                    </Button>
                    <Button variant="soft" type="button" onClick={cancelAddWeek}>Cancel</Button>
                </Flex>
            </Flex>}
        </div>
    );
}