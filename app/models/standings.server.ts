import { Division, League, Score, Team, Winner } from "@prisma/client";
import { getTeamNameByMatch } from "~/utils";
import { getSchedulesByLeagueSlug } from "./schedule.server";

type Outcome = "w" | "l" | "t";
interface MatchRecord {
  outcome: Outcome;
  opponent: {
    name: string;
    score: number | null;
  };
  date: string;
  teamScore: number | null;
  amountWon: number | null;
}

export interface Standing {
  teamId: Team["id"];
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  matchRecord: MatchRecord[];
  totalScore: number;
  totalOpponentScore: number;
  totalAmountWon: number;
}

export interface LeagueStandings {
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
      matchRecord: [],
      totalScore: 0,
      totalOpponentScore: 0,
      totalAmountWon: 0,
    });
  };
  const recordOutcome = (
    scheduleIndex: number,
    score: Score,
    outcome: "ties" | "wins" | "losses",
    opponent: {
      name: string;
      score: number | null;
    },
    date: string,
    winners: Winner[],
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
    const amountWon = winners?.filter((winner) => winner.teamId === t?.teamId).reduce((acc, winner) => acc + winner.amountWon, 0);
    t?.matchRecord.push({
      outcome: outcome.charAt(0) as Outcome,
      opponent,
      date,
      teamScore: score.score,
      amountWon
    });
    if (t && score.score) {
      t.totalScore = t.totalScore + score.score;
    }
    if (t && opponent.score) {
      t.totalOpponentScore = t.totalOpponentScore + opponent.score;
    }
    if (t && amountWon) {
      t.totalAmountWon = t.totalAmountWon + amountWon;
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
        const team1Name = getTeamNameByMatch(match, team1Score.teamId);
        const team2Name = getTeamNameByMatch(match, team2Score.teamId);
        const team1 = {
          name: team1Name,
          score: team1Score.score,
        };
        const team2 = {
          name: team2Name,
          score: team2Score.score,
        };
        if (team1Score.score && team2Score.score) {
          if (isNewTeam(scheduleIndex, team1Score))
            newTeam(scheduleIndex, team1Score, team1Name);
          if (isNewTeam(scheduleIndex, team2Score))
            newTeam(scheduleIndex, team2Score, team2Name);
          if (team1Score.score === team2Score.score) {
            recordOutcome(scheduleIndex, team1Score, "ties", team2, week.date, week.winners);
            recordOutcome(scheduleIndex, team2Score, "ties", team1, week.date, week.winners);
          } else if (team1Score.score >= team2Score.score) {
            recordOutcome(scheduleIndex, team2Score, "wins", team1, week.date, week.winners);
            recordOutcome(
              scheduleIndex,
              team1Score,
              "losses",
              team2,
              week.date,
              week.winners
            );
          } else {
            recordOutcome(scheduleIndex, team1Score, "wins", team2, week.date, week.winners);
            recordOutcome(
              scheduleIndex,
              team2Score,
              "losses",
              team1,
              week.date,
              week.winners
            );
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
