export interface HistoricalMatch {
  round: string;
  date: string;
  team1: string;
  team2: string;
  score: {
    ft: [number, number];
  };
}

export interface HistoricalLeague {
  name: string;
  matches: HistoricalMatch[];
}

export interface HeadToHeadMatch {
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
}
