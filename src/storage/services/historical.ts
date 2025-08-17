import { supabase } from '../../lib/supabase';
import type { HistoricalMatch, HeadToHeadMatch } from '../../types/historical';

/**
 * Inserts a new historical league record and returns the newly created record, including its ID.
 * @param leagueData - The basic league data.
 * @returns The created historical league record.
 */
export async function insertHistoricalLeague(leagueData: {
  name: string;
  season: string;
  source_file: string;
}): Promise<{ id: number }> {
  const { data, error } = await supabase
    .from('historical_leagues')
    .insert(leagueData)
    .select('id')
    .single();

  if (error) {
    console.error('Error inserting historical league:', error);
    throw new Error('Failed to insert historical league.');
  }

  return data;
}

/**
 * Inserts an array of historical matches into the database.
 * @param matches - The historical matches to insert.
 * @param leagueId - The ID of the parent historical league.
 */
export async function insertHistoricalMatches(
  matches: HistoricalMatch[],
  leagueId: number
): Promise<void> {
  const recordsToInsert = matches.map(match => ({
    historical_league_id: leagueId,
    round: match.round,
    match_date: match.date,
    home_team_name: match.team1,
    away_team_name: match.team2,
    home_score: match.score.ft[0],
    away_score: match.score.ft[1],
  }));

  const { error } = await supabase
    .from('historical_matches')
    .insert(recordsToInsert);

  if (error) {
    console.error('Error inserting historical matches:', error);
    throw new Error('Failed to insert historical matches.');
  }
}

/**
 * Retrieves the head-to-head match history between two teams from the historical data.
 * @param team1Name - The name of the first team.
 * @param team2Name - The name of the second team.
 * @returns A promise that resolves to an array of historical matches.
 */
export async function getHeadToHeadHistory(
  team1Name: string,
  team2Name:string
): Promise<HeadToHeadMatch[]> {
  const { data, error } = await supabase
    .from('historical_matches')
    .select('*')
    .or(
      `and(home_team_name.eq.${team1Name},away_team_name.eq.${team2Name}),and(home_team_name.eq.${team2Name},away_team_name.eq.${team1Name})`
    )
    .order('match_date', { ascending: false });

  if (error) {
    console.error('Error fetching H2H history:', error);
    throw new Error('Failed to fetch head-to-head history.');
  }

  return data || [];
}
