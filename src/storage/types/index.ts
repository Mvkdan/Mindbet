// Types de base
export interface ApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: string[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T[];
}

// Types communs
export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  surface: string;
  image: string;
}

export interface Team {
  id: number;
  name: string;
  code: string;
  country: string;
  founded: number;
  national: boolean;
  logo: string;
  venue: Venue;
}

export interface League {
  id: number;
  name: string;
  type: string;
  logo: string;
  country: string;
  season: number;
  round: string;
}

export interface Score {
  halftime: {
    home: number | null;
    away: number | null;
  };
  fulltime: {
    home: number | null;
    away: number | null;
  };
  extratime: {
    home: number | null;
    away: number | null;
  };
  penalty: {
    home: number | null;
    away: number | null;
  };
}

export interface Fixture {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  status: {
    long: string;
    short: string;
    elapsed: number | null;
  };
  venue: Venue;
  league: League;
}

export interface Match {
  fixture: Fixture;
  teams: {
    home: Team;
    away: Team;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: Score;
}

// Types spécifiques aux statistiques
export interface TeamStatistics {
  team: Team;
  league: League;
  form: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute: Record<string, { total: number; percentage: string }>;
    };
    against: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute: Record<string, { total: number; percentage: string }>;
    };
  };
  lineups: Array<{
    formation: string;
    played: number;
  }>;
}

export interface PlayerStatistics {
  player: Player;
  statistics: Array<{
    team: Team;
    league: League;
    games: {
      appearences: number;
      lineups: number;
      minutes: number;
      position: string;
      rating: string;
      captain: boolean;
    };
    shots: {
      total: number;
      on: number;
    };
    goals: {
      total: number;
      conceded: number;
      assists: number;
      saves: number;
    };
    passes: {
      total: number;
      key: number;
      accuracy: number;
    };
    tackles: {
      total: number;
      blocks: number;
      interceptions: number;
    };
    cards: {
      yellow: number;
      yellowred: number;
      red: number;
    };
  }>;
}

// Types pour les cotes et paris
export interface Odds {
  league: League;
  fixture: Fixture;
  update: string;
  bookmakers: Array<{
    id: number;
    name: string;
    bets: Array<{
      id: number;
      name: string;
      values: Array<{
        value: string;
        odd: string;
      }>;
    }>;
  }>;
}