// API Response Types
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

// Base Types
export interface League {
  id: number;
  name: string;
  type: string;
  logo: string;
  country: string;
  standings?: Standing[][];
}

export interface Standing {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  update: string;
}

export interface Season {
  year: number;
  start: string;
  end: string;
  current: boolean;
}

export interface Team {
  id: number;
  name: string;
  code: string;
  country: string;
  founded: number;
  national: boolean;
  logo: string;
}

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

export interface Player {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  nationality: string;
  height: string;
  weight: string;
  injured: boolean;
  photo: string;
}

export interface Coach {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  nationality: string;
  photo: string;
}

// Match Types
export interface Match {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed?: number;
    };
    venue: Venue;
    referee?: string;
  };
  teams: {
    home: Team;
    away: Team;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  league: League;
  score: {
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
  };
}

// Statistics Types
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
      minute: {
        '0-15': { total: number; percentage: string };
        '16-30': { total: number; percentage: string };
        '31-45': { total: number; percentage: string };
        '46-60': { total: number; percentage: string };
        '61-75': { total: number; percentage: string };
        '76-90': { total: number; percentage: string };
        '91-105': { total: number; percentage: string };
        '106-120': { total: number; percentage: string };
      };
    };
    against: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute: {
        '0-15': { total: number; percentage: string };
        '16-30': { total: number; percentage: string };
        '31-45': { total: number; percentage: string };
        '46-60': { total: number; percentage: string };
        '61-75': { total: number; percentage: string };
        '76-90': { total: number; percentage: string };
        '91-105': { total: number; percentage: string };
        '106-120': { total: number; percentage: string };
      };
    };
  };
  biggest: {
    streak: {
      wins: number;
      draws: number;
      loses: number;
    };
    wins: {
      home: string;
      away: string;
    };
    loses: {
      home: string;
      away: string;
    };
    goals: {
      for: {
        home: number;
        away: number;
      };
      against: {
        home: number;
        away: number;
      };
    };
  };
  clean_sheets: {
    home: number;
    away: number;
    total: number;
  };
  failed_to_score: {
    home: number;
    away: number;
    total: number;
  };
  penalty: {
    scored: {
      total: number;
      percentage: string;
    };
    missed: {
      total: number;
      percentage: string;
    };
    total: number;
  };
  lineups: Array<{
    formation: string;
    played: number;
  }>;
  cards: {
    yellow: {
      '0-15': { total: number; percentage: string };
      '16-30': { total: number; percentage: string };
      '31-45': { total: number; percentage: string };
      '46-60': { total: number; percentage: string };
      '61-75': { total: number; percentage: string };
      '76-90': { total: number; percentage: string };
      '91-105': { total: number; percentage: string };
      '106-120': { total: number; percentage: string };
    };
    red: {
      '0-15': { total: number; percentage: string };
      '16-30': { total: number; percentage: string };
      '31-45': { total: number; percentage: string };
      '46-60': { total: number; percentage: string };
      '61-75': { total: number; percentage: string };
      '76-90': { total: number; percentage: string };
      '91-105': { total: number; percentage: string };
      '106-120': { total: number; percentage: string };
    };
  };
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
      number: number;
      position: string;
      rating: string;
      captain: boolean;
    };
    substitutes: {
      in: number;
      out: number;
      bench: number;
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
    duels: {
      total: number;
      won: number;
    };
    dribbles: {
      attempts: number;
      success: number;
      past: number;
    };
    fouls: {
      drawn: number;
      committed: number;
    };
    cards: {
      yellow: number;
      yellowred: number;
      red: number;
    };
    penalty: {
      won: number;
      committed: number;
      scored: number;
      missed: number;
      saved: number;
    };
  }>;
}

export interface FixtureStatistics {
  team: Team;
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
}

export interface FixtureEvent {
  time: {
    elapsed: number;
    extra?: number;
  };
  team: Team;
  player: {
    id: number;
    name: string;
  };
  assist: {
    id: number;
    name: string;
  } | null;
  type: string;
  detail: string;
  comments: string | null;
}

export interface FixtureLineup {
  team: Team;
  coach: Coach;
  formation: string;
  startXI: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
      grid: string;
    };
  }>;
  substitutes: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
      grid: null;
    };
  }>;
}