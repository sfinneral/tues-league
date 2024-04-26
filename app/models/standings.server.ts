import { Division, League, Score, Team } from "@prisma/client";
import { getTeamNameByMatch } from "~/utils";
import { getSchedulesByLeagueSlug } from "./schedule.server";

interface Standing {
  teamId: Team["id"];
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  points: number;
}

interface LeagueStandings {
  division: Division;
  standings: Standing[];
}

export const getStandingsBySlug = async (leagueSlug: League["slug"]) => {
  const schedules = await getSchedulesByLeagueSlug(leagueSlug);

  const leagueStandings: LeagueStandings[] = [];
  const isNewTeam = (scheduleIndex: number, score: Score): boolean => {
    return !leagueStandings[scheduleIndex].standings.some((team: Standing) => {
      return team.teamId === score.teamId;
    });
  };

  const newTeam = (scheduleIndex: number, score: Score, teamName: string) => {
    leagueStandings[scheduleIndex].standings.push({
      teamId: score.teamId,
      teamName,
      wins: 0,
      losses: 0,
      ties: 0,
      points: 0,
    });
  };
  const recordOutcome = (
    scheduleIndex: number,
    score: Score,
    outcome: "ties" | "wins" | "losses",
  ) => {
    const t = leagueStandings[scheduleIndex].standings.find(
      (team) => team.teamId === score.teamId,
    );
    t && t[outcome]++;
    if (outcome === "wins") {
      t && (t.points += 2);
    } else if (outcome === "ties") {
      t && t.points++;
    }
  };

  schedules.forEach((schedule, scheduleIndex) => {
    leagueStandings.push({
      division: schedule.division,
      standings: [],
    });
    schedule.weeks.forEach((week) => {
      week.matches.forEach((match) => {
        const team1Score = match.scores[0];
        const team2Score = match.scores[1];
        if (team1Score.score && team2Score.score) {
          if (isNewTeam(scheduleIndex, team1Score))
            newTeam(
              scheduleIndex,
              team1Score,
              getTeamNameByMatch(match, team1Score.teamId),
            );
          if (isNewTeam(scheduleIndex, team2Score))
            newTeam(
              scheduleIndex,
              team2Score,
              getTeamNameByMatch(match, team2Score.teamId),
            );
          if (team1Score.score === team2Score.score) {
            recordOutcome(scheduleIndex, team1Score, "ties");
            recordOutcome(scheduleIndex, team2Score, "ties");
          } else if (team1Score.score >= team2Score.score) {
            recordOutcome(scheduleIndex, team2Score, "wins");
            recordOutcome(scheduleIndex, team1Score, "losses");
          } else {
            recordOutcome(scheduleIndex, team1Score, "wins");
            recordOutcome(scheduleIndex, team2Score, "losses");
          }
        }
      });
    });
  });
  leagueStandings.forEach((leagueStanding) => {
    leagueStanding.standings.sort((a, b) => (b.points || 0) - (a.points || 0));
  });

  return leagueStandings;
};
