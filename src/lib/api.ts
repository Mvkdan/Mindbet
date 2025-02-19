import axios, { AxiosError } from 'axios';
import { logger } from './logger';
import type { Match, FixtureStatistics, FixtureEvent, FixtureLineup, Odds } from '../types';

const API_KEY = 'c7a1111e0ccbcb8aeafca95b962979be';
const API_BASE_URL = 'https://v3.football.api-sports.io';

// Configuration Axios avec retry et timeout
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'x-apisports-key': API_KEY,
    'Content-Type': 'application/json'
  },
  timeout: 15000, // 15 secondes timeout
  // Add retry configuration
  validateStatus: status => status < 500
});

// Retry interceptor
apiClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const { config } = error;
  if (!config || !config.retry) {
    return Promise.reject(error);
  }

  config.retry -= 1;

  if (config.retry === 0) {
    return Promise.reject(error);
  }

  // Delay before retrying
  await new Promise(resolve => setTimeout(resolve, config.retryDelay || 1000));
  
  return apiClient(config);
});

// Add retry configuration to all requests
apiClient.interceptors.request.use(config => {
  config.retry = 3; // Number of retries
  config.retryDelay = 1000; // Delay between retries in milliseconds
  return config;
});

// Rate limiting configuration
const RATE_LIMIT = {
  requests: 30,
  per: 60 * 1000 // 1 minute
};

class RateLimiter {
  private requests: number = 0;
  private resetTime: number = Date.now() + RATE_LIMIT.per;

  async checkLimit(): Promise<void> {
    const now = Date.now();
    if (now > this.resetTime) {
      this.requests = 0;
      this.resetTime = now + RATE_LIMIT.per;
    }

    if (this.requests >= RATE_LIMIT.requests) {
      const waitTime = this.resetTime - now;
      logger.warn('RateLimiter', `Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requests = 0;
    }

    this.requests++;
  }
}

const rateLimiter = new RateLimiter();

// Intercepteur pour la limite de requêtes
apiClient.interceptors.request.use(async config => {
  await rateLimiter.checkLimit();
  return config;
});

// Cache avec invalidation
class ApiCache {
  private cache: Map<string, any> = new Map();
  private expirations: Map<string, number> = new Map();

  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, data);
    this.expirations.set(key, Date.now() + ttl);
  }

  get(key: string): any {
    const expiration = this.expirations.get(key);
    if (!expiration || Date.now() > expiration) {
      this.cache.delete(key);
      this.expirations.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  clear(): void {
    this.cache.clear();
    this.expirations.clear();
  }
}

const cache = new ApiCache();

// Durées de cache
const CACHE_DURATIONS = {
  LIVE: 30 * 1000, // 30 secondes
  MATCHES: 5 * 60 * 1000, // 5 minutes
  FIXTURE_DETAILS: 60 * 1000, // 1 minute
  STATISTICS: 5 * 60 * 1000, // 5 minutes
  EVENTS: 60 * 1000, // 1 minute
  LINEUPS: 5 * 60 * 1000, // 5 minutes
  ODDS: 5 * 60 * 1000 // 5 minutes
};

// Fonction générique pour les requêtes avec cache
async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  duration: number
): Promise<T> {
  const cached = cache.get(key);
  if (cached) return cached;

  const data = await fetcher();
  cache.set(key, data, duration);
  return data;
}

// API Functions
export const api = {
  matches: {
    getLive: () => fetchWithCache(
      'matches/live',
      async () => {
        const response = await apiClient.get('/fixtures', { params: { live: 'all' } });
        return response.data.response || [];
      },
      CACHE_DURATIONS.LIVE
    ),
    getByDate: (date: string) => fetchWithCache(
      `matches/${date}`,
      async () => {
        const response = await apiClient.get('/fixtures', { params: { date } });
        return response.data.response || [];
      },
      CACHE_DURATIONS.MATCHES
    ),
    getDetails: (matchId: number) => fetchWithCache(
      `match/${matchId}`,
      async () => {
        const response = await apiClient.get('/fixtures', { params: { id: matchId } });
        return response.data.response[0];
      },
      CACHE_DURATIONS.FIXTURE_DETAILS
    )
  },
  fixtures: {
    getStatistics: (fixtureId: number) => fetchWithCache(
      `statistics/${fixtureId}`,
      async () => {
        const response = await apiClient.get('/fixtures/statistics', { params: { fixture: fixtureId } });
        return response.data.response || [];
      },
      CACHE_DURATIONS.STATISTICS
    ),
    getEvents: (fixtureId: number) => fetchWithCache(
      `events/${fixtureId}`,
      async () => {
        const response = await apiClient.get('/fixtures/events', { params: { fixture: fixtureId } });
        return response.data.response || [];
      },
      CACHE_DURATIONS.EVENTS
    ),
    getLineups: (fixtureId: number) => fetchWithCache(
      `lineups/${fixtureId}`,
      async () => {
        const response = await apiClient.get('/fixtures/lineups', { params: { fixture: fixtureId } });
        return response.data.response || [];
      },
      CACHE_DURATIONS.LINEUPS
    ),
    getOdds: (fixtureId: number) => fetchWithCache(
      `odds/${fixtureId}`,
      async () => {
        const response = await apiClient.get('/odds', { params: { fixture: fixtureId } });
        return response.data.response[0]?.bookmakers || [];
      },
      CACHE_DURATIONS.ODDS
    ),
    getAllMatchData: async (fixtureId: number) => {
      try {
        const [statistics, events, lineups, odds] = await Promise.all([
          api.fixtures.getStatistics(fixtureId),
          api.fixtures.getEvents(fixtureId),
          api.fixtures.getLineups(fixtureId),
          api.fixtures.getOdds(fixtureId)
        ]);

        return {
          statistics,
          events,
          lineups,
          odds,
          error: null
        };
      } catch (error) {
        logger.error('API', 'Error fetching match data', error);
        return {
          statistics: [],
          events: [],
          lineups: [],
          odds: [],
          error: error instanceof Error ? error.message : 'Une erreur est survenue'
        };
      }
    }
  },
  players: {
    getByBatch: async (batchId: number, batchSize: number = 200) => {
      const season = new Date().getFullYear();
      try {
        const { data } = await apiClient.get('/players', {
          params: {
            season,
            page: batchId + 1,
            per_page: batchSize
          }
        });

        if (!data.response) {
          logger.warn('API', 'No player data in response', { batchId });
          return [];
        }

        return data.response;
      } catch (error) {
        logger.error('API', 'Error fetching players batch', { error, batchId });
        throw error;
      }
    },

    getStatistics: async (playerId: number, season?: number) => {
      const currentSeason = season || new Date().getFullYear();
      try {
        const { data } = await apiClient.get('/players', {
          params: {
            id: playerId,
            season: currentSeason
          }
        });

        return data.response?.[0]?.statistics || [];
      } catch (error) {
        logger.error('API', 'Error fetching player statistics', { error, playerId });
        return [];
      }
    }
  }
};