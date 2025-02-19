import axios, { AxiosError } from 'axios';
import type { ApiResponse, Match, League, Season, Team, Player, TeamStatistics, PlayerStatistics, Odds } from './types';

const API_KEY = 'c7a1111e0ccbcb8aeafca95b962979be';

const api = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: {
    'x-apisports-key': API_KEY
  },
  timeout: 10000 // 10 seconds timeout
});

// Simplified error object that's safe to clone
const createSafeError = (error: any) => ({
  message: error?.message || 'Unknown error',
  status: error?.response?.status,
  data: error?.response?.data
});

// Queue for rate limiting
const queue: (() => Promise<any>)[] = [];
let processing = false;

const processQueue = async () => {
  if (processing || queue.length === 0) return;
  processing = true;

  while (queue.length > 0) {
    const request = queue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        console.error('Queue processing error:', createSafeError(error));
      }
      // Wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  processing = false;
};

// Enhanced API request handler with queuing
const makeRequest = async <T>(
  config: {
    endpoint: string;
    params?: Record<string, any>;
    context: string;
  }
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const request = async () => {
      try {
        console.log(`API Request (${config.context}):`, {
          endpoint: config.endpoint,
          params: config.params
        });

        const response = await api.get<ApiResponse<T>>(config.endpoint, {
          params: config.params
        });

        console.log(`API Response (${config.context}):`, {
          status: response.status,
          results: response.data.results,
          errors: response.data.errors
        });

        if (response.data.errors?.length) {
          throw new Error(response.data.errors.join(', '));
        }

        return resolve(response.data.response || []);
      } catch (error) {
        const safeError = createSafeError(error);
        console.error(`API Error (${config.context}):`, safeError);
        reject(new Error(safeError.message));
      }
    };

    queue.push(request);
    processQueue();
  });
};

// API Functions
export const getLeagues = async (country?: string) => {
  return makeRequest<League>({
    endpoint: '/leagues',
    params: country ? { country } : undefined,
    context: 'getLeagues'
  });
};

export const getSeasons = async () => {
  return makeRequest<Season>({
    endpoint: '/leagues/seasons',
    context: 'getSeasons'
  });
};

export const getMatches = async (date: string) => {
  return makeRequest<Match>({
    endpoint: '/fixtures',
    params: { date },
    context: 'getMatches'
  });
};

export const getLiveMatches = async () => {
  return makeRequest<Match>({
    endpoint: '/fixtures',
    params: { live: 'all' },
    context: 'getLiveMatches'
  });
};

export const getTeams = async (league: number, season: number) => {
  const response = await makeRequest<{ team: Team }>({
    endpoint: '/teams',
    params: { league, season },
    context: 'getTeams'
  });
  return response.map(item => item.team);
};

export const getTeamStatistics = async (team: number, league: number, season: number) => {
  const response = await makeRequest<TeamStatistics>({
    endpoint: '/teams/statistics',
    params: { team, league, season },
    context: 'getTeamStatistics'
  });
  return response[0];
};

export const getPlayers = async (team: number, season: number) => {
  const response = await makeRequest<{ player: Player }>({
    endpoint: '/players',
    params: { team, season },
    context: 'getPlayers'
  });
  return response.map(item => item.player);
};

export const getPlayerStatistics = async (player: number, season: number) => {
  const response = await makeRequest<PlayerStatistics>({
    endpoint: '/players',
    params: { id: player, season },
    context: 'getPlayerStatistics'
  });
  return response[0];
};

export const getFixtureStatistics = async (fixture: number) => {
  return makeRequest<any>({
    endpoint: '/fixtures/statistics',
    params: { fixture },
    context: 'getFixtureStatistics'
  });
};

export const getFixtureEvents = async (fixture: number) => {
  return makeRequest<any>({
    endpoint: '/fixtures/events',
    params: { fixture },
    context: 'getFixtureEvents'
  });
};

export const getFixtureLineups = async (fixture: number) => {
  return makeRequest<any>({
    endpoint: '/fixtures/lineups',
    params: { fixture },
    context: 'getFixtureLineups'
  });
};

export const getOdds = async (fixture?: number) => {
  const today = new Date().toISOString().split('T')[0];
  return makeRequest<Match & { odds: Odds[] }>({
    endpoint: '/odds',
    params: fixture ? { fixture } : { date: today },
    context: 'getOdds'
  });
};

export const getLeagueStandings = async (league: number, season: number) => {
  const response = await makeRequest<any>({
    endpoint: '/standings',
    params: { league, season },
    context: 'getLeagueStandings'
  });
  return response[0]?.league?.standings ?? [];
};