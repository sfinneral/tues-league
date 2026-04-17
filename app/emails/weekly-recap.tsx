import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface MatchData {
  team1: string;
  score1: number;
  team2: string;
  score2: number;
}

interface MoneyWinner {
  place: string;
  teamName: string;
  score: number;
  amount: number;
}

interface StandingRow {
  rank: number;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  points: number;
}

interface DivisionData {
  name: string;
  matches: MatchData[];
  moneyWinners: MoneyWinner[];
  standings: StandingRow[];
}

interface NextWeekData {
  date: string;
  divisions: Array<{
    name: string;
    matchups: Array<{ team1: string; team2: string }>;
  }>;
}

export interface WeeklyRecapProps {
  weekNumber: number;
  weekDate: string;
  divisions: DivisionData[];
  nextWeek: NextWeekData | null;
}

const main: React.CSSProperties = {
  backgroundColor: "#111113",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "24px",
  maxWidth: "600px",
};

const heading: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const divisionHeading: React.CSSProperties = {
  color: "#5ccfcf",
  fontSize: "20px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "0 0 16px",
};

const sectionHeading: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "14px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  textAlign: "center" as const,
  margin: "0 0 12px",
};

const card: React.CSSProperties = {
  backgroundColor: "#1c1c21",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "16px",
};

const teamName: React.CSSProperties = {
  color: "#e2e8f0",
  fontSize: "14px",
};

const winnerName: React.CSSProperties = {
  color: "#e2e8f0",
  fontSize: "14px",
  fontWeight: "bold",
};

const scoreText: React.CSSProperties = {
  color: "#e2e8f0",
  fontSize: "14px",
  fontWeight: "bold",
};

const matchDivider: React.CSSProperties = {
  borderColor: "#2a2a32",
  margin: "8px 0",
};

const sectionDivider: React.CSSProperties = {
  borderColor: "#2a2a32",
  margin: "24px 0",
};

const moneyBadge: React.CSSProperties = {
  color: "#5ccfcf",
  fontSize: "13px",
  fontWeight: "600",
};

const standingsCell: React.CSSProperties = {
  padding: "4px 0",
  color: "#e2e8f0",
  fontSize: "14px",
};

const matchupText: React.CSSProperties = {
  color: "#e2e8f0",
  fontSize: "14px",
  textAlign: "center" as const,
  padding: "4px 0",
};

const footer: React.CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "32px",
};

export default function WeeklyRecapEmail({
  weekNumber,
  weekDate,
  divisions,
  nextWeek,
}: WeeklyRecapProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Week ${weekNumber} Recap — ${weekDate}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            Week {weekNumber} Recap — {weekDate}
          </Heading>

          {divisions.map((division) => (
            <Section key={division.name}>
              <Text style={divisionHeading}>{division.name}</Text>

              <Text style={sectionHeading}>Match Results</Text>
              <div style={card}>
                {division.matches.map((match, i) => {
                  const team1Wins = match.score1 < match.score2;
                  const team2Wins = match.score2 < match.score1;
                  return (
                    <div key={i}>
                      {i > 0 && <Hr style={matchDivider} />}
                      <table width="100%" cellPadding={0} cellSpacing={0}>
                        <tr>
                          <td style={team1Wins ? winnerName : teamName}>
                            {match.team1}
                            {team1Wins && " ✓"}
                          </td>
                          <td style={scoreText} align="right">
                            {match.score1}
                          </td>
                        </tr>
                        <tr>
                          <td style={team2Wins ? winnerName : teamName}>
                            {match.team2}
                            {team2Wins && " ✓"}
                          </td>
                          <td style={scoreText} align="right">
                            {match.score2}
                          </td>
                        </tr>
                      </table>
                    </div>
                  );
                })}
              </div>

              <Text style={sectionHeading}>Money Winners</Text>
              <div style={card}>
                <table width="100%" cellPadding={0} cellSpacing={0}>
                  {division.moneyWinners.map((winner) => (
                    <tr key={winner.teamName}>
                      <td style={teamName}>{winner.teamName}</td>
                      <td style={scoreText} align="center">
                        {winner.score}
                      </td>
                      <td style={moneyBadge} align="right">
                        {winner.place}
                      </td>
                    </tr>
                  ))}
                </table>
              </div>

              <Text style={sectionHeading}>Standings</Text>
              <div style={card}>
                <table width="100%" cellPadding={0} cellSpacing={0}>
                  {division.standings.map((row) => (
                    <tr key={row.teamName}>
                      <td style={{ ...standingsCell, width: "30px" }}>
                        {row.rank}.
                      </td>
                      <td style={standingsCell}>{row.teamName}</td>
                      <td style={{ ...standingsCell, color: "#94a3b8" }} align="right">
                        {row.wins}-{row.losses}{row.ties > 0 ? `-${row.ties}` : ""}
                      </td>
                      <td style={{ ...standingsCell, width: "50px" }} align="right">
                        {row.points} pts
                      </td>
                    </tr>
                  ))}
                </table>
              </div>

              <Hr style={sectionDivider} />
            </Section>
          ))}

          {nextWeek && (
            <Section>
              <Text style={divisionHeading}>Next Week — {nextWeek.date}</Text>
              {nextWeek.divisions.map((division) => (
                <div key={division.name}>
                  <Text style={sectionHeading}>{division.name}</Text>
                  <div style={card}>
                    {division.matchups.map((matchup, i) => (
                      <Text key={i} style={matchupText}>
                        {matchup.team1} vs {matchup.team2}
                      </Text>
                    ))}
                  </div>
                </div>
              ))}
            </Section>
          )}

          <Text style={footer}>Afternoon Golfer</Text>
        </Container>
      </Body>
    </Html>
  );
}
