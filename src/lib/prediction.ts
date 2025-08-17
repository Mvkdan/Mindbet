import type { TeamStatistics } from '../types';
import type { HeadToHeadMatch } from '../types/historical';

export interface PredictionResult {
  winProbability: {
    home: number;
    away: number;
    draw: number;
  };
  predictedScore: {
    home: number;
    away: number;
  };
  keyFactors: string[];
}

export function calculatePrediction(
  homeStats: TeamStatistics,
  awayStats: TeamStatistics,
  h2hMatches: HeadToHeadMatch[] = []
): PredictionResult {
  const h2hAnalysis = analyzeH2H(h2hMatches, homeStats.team.name);

  const homePower = calculateTeamPower(homeStats, 'home', h2hAnalysis.homeWinRate);
  const awayPower = calculateTeamPower(awayStats, 'away', h2hAnalysis.awayWinRate);

  const totalPower = homePower + awayPower;
  let homeWinProb = (homePower / totalPower) * 100;
  let awayWinProb = (awayPower / totalPower) * 100;

  // Adjust for draw probability based on H2H draws
  const h2hDrawRate = h2hAnalysis.draws / (h2hAnalysis.total || 1);
  const drawProb = Math.min(homeWinProb, awayWinProb) * 0.5 + h2hDrawRate * 20;

  homeWinProb = Math.max(0, homeWinProb - drawProb / 2);
  awayWinProb = Math.max(0, awayWinProb - drawProb / 2);

  const totalProb = homeWinProb + awayWinProb + drawProb;

  const winProbability = {
    home: Math.round((homeWinProb / totalProb) * 100),
    away: Math.round((awayWinProb / totalProb) * 100),
    draw: Math.round((drawProb / totalProb) * 100),
  };

  // Predicted Score with H2H influence
  const homeAvgGoals = parseFloat(homeStats.goals.for.average.home);
  const awayAvgGoals = parseFloat(awayStats.goals.for.average.away);

  const predictedScore = {
    home: Math.round((homeAvgGoals * 0.7) + (h2hAnalysis.homeGoalsAvg * 0.3)),
    away: Math.round((awayAvgGoals * 0.7) + (h2hAnalysis.awayGoalsAvg * 0.3)),
  };

  const keyFactors = [
    `Home team form: ${homeStats.form}`,
    `Away team form: ${awayStats.form}`,
    `Home team scores ${homeStats.goals.for.average.home} goals on average at home.`,
    `Away team scores ${awayStats.goals.for.average.away} goals on average away.`,
  ];

  if (h2hAnalysis.total > 0) {
    keyFactors.push(
      `Head-to-head (${h2hAnalysis.total} matches): ${homeStats.team.name} wins: ${h2hAnalysis.homeWins}, ${awayStats.team.name} wins: ${h2hAnalysis.awayWins}, Draws: ${h2hAnalysis.draws}.`
    );
  }

  return {
    winProbability,
    predictedScore,
    keyFactors,
  };
}

function calculateTeamPower(stats: TeamStatistics, location: 'home' | 'away', h2hWinRate: number): number {
  const { fixtures, goals } = stats;
  const H2H_WEIGHT = 0.3; // 30% weight for H2H factor

  const winRate = fixtures.wins[location] / fixtures.played[location];
  const goalDifference = goals.for.total[location] - goals.against.total[location];
  const avgGoals = parseFloat(goals.for.average[location]);

  // Power based on current season form
  const formPower =
    (winRate || 0) * 50 +
    (goalDifference / (fixtures.played[location] || 1)) * 10 +
    (avgGoals || 0) * 5;

  // Power based on H2H
  const h2hPower = (h2hWinRate || 0) * 100; // Scale H2H win rate to be comparable

  const combinedPower = (formPower * (1 - H2H_WEIGHT)) + (h2hPower * H2H_WEIGHT);

  return Math.max(1, combinedPower); // Ensure power is at least 1
}

function analyzeH2H(matches: HeadToHeadMatch[], homeTeamName: string) {
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  let homeGoals = 0;
  let awayGoals = 0;

  matches.forEach(match => {
    if (match.home_team_name === homeTeamName) {
      homeGoals += match.home_score;
      awayGoals += match.away_score;
      if (match.home_score > match.away_score) homeWins++;
      else if (match.away_score > match.home_score) awayWins++;
      else draws++;
    } else {
      homeGoals += match.away_score;
      awayGoals += match.home_score;
      if (match.away_score > match.home_score) homeWins++;
      else if (match.home_score > match.away_score) awayWins++;
      else draws++;
    }
  });

  const total = matches.length;
  return {
    homeWins,
    awayWins,
    draws,
    total,
    homeGoalsAvg: total > 0 ? homeGoals / total : 0,
    awayGoalsAvg: total > 0 ? awayGoals / total : 0,
    homeWinRate: total > 0 ? homeWins / total : 0,
    awayWinRate: total > 0 ? awayWins / total : 0,
  };
}
