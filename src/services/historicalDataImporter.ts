import axios from 'axios';
import type { HistoricalLeague } from '../types/historical';

const BASE_URL = 'https://raw.githubusercontent.com/openfootball/football.json/master';

/**
 * Fetches historical league data for a specific season and league file.
 * @param season - The season in 'YYYY-YY' format (e.g., '2023-24').
 * @param leagueFile - The name of the league JSON file (e.g., 'en.1.json').
 * @returns A Promise that resolves to the historical league data.
 */
export async function fetchHistoricalLeagueData(
  season: string,
  leagueFile: string
): Promise<HistoricalLeague> {
  const url = `${BASE_URL}/${season}/${leagueFile}`;
  try {
    const response = await axios.get<HistoricalLeague>(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching historical data from ${url}:`, error);
    throw new Error('Failed to fetch historical league data.');
  }
}
