// Configuration de base de l'API
export const API_CONFIG = {
  BASE_URL: 'https://v3.football.api-sports.io',
  VERSION: 'v3',
  TIMEOUT: 10000,
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 30,
    REQUESTS_PER_DAY: 100
  }
};

// Endpoints de l'API
export const ENDPOINTS = {
  SEASONS: {
    LIST: '/leagues/seasons',
    CURRENT: '/leagues/seasons/current'
  },
  LEAGUES: {
    LIST: '/leagues',
    BY_ID: (id: number) => `/leagues/${id}`,
    STANDINGS: (id: number, season: number) => `/leagues/${id}/standings?season=${season}`
  },
  TEAMS: {
    LIST: '/teams',
    BY_ID: (id: number) => `/teams/${id}`,
    STATISTICS: (id: number, league: number, season: number) => 
      `/teams/statistics?team=${id}&league=${league}&season=${season}`,
    SEASONS: (id: number) => `/teams/seasons?team=${id}`
  },
  MATCHES: {
    LIST: '/fixtures',
    BY_ID: (id: number) => `/fixtures/${id}`,
    LIVE: '/fixtures/live',
    BY_DATE: (date: string) => `/fixtures/date/${date}`,
    HEAD_TO_HEAD: (team1: number, team2: number) => 
      `/fixtures/headtohead?h2h=${team1}-${team2}`,
    STATISTICS: (id: number) => `/fixtures/${id}/statistics`,
    EVENTS: (id: number) => `/fixtures/${id}/events`,
    LINEUPS: (id: number) => `/fixtures/${id}/lineups`
  },
  PLAYERS: {
    LIST: '/players',
    BY_ID: (id: number) => `/players/${id}`,
    STATISTICS: (id: number, season: number) => 
      `/players?id=${id}&season=${season}`,
    SEASONS: (id: number) => `/players/seasons?player=${id}`,
    TOP_SCORERS: (league: number, season: number) => 
      `/players/topscorers?league=${league}&season=${season}`
  },
  ODDS: {
    LIST: '/odds',
    BY_FIXTURE: (id: number) => `/odds/fixture/${id}`,
    LIVE: '/odds/live',
    BOOKMAKERS: '/odds/bookmakers',
    BETS: '/odds/bets'
  }
} as const;