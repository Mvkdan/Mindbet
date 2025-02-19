/*
  # Football Database Schema

  1. New Tables
    - `leagues`
      - League information and metadata
    - `seasons`
      - Season information for each league
    - `teams`
      - Team information and metadata
    - `matches`
      - Match data including scores and statistics
    - `match_events`
      - Events during matches (goals, cards, etc.)
    - `match_statistics`
      - Detailed match statistics
    - `match_lineups`
      - Team lineups for matches
    
  2. Security
    - Enable RLS on all tables
    - Add policies for read access
    
  3. Relationships
    - Foreign key constraints between tables
    - Indexes for performance
*/

-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  country text,
  type text,
  logo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to leagues"
  ON leagues FOR SELECT
  TO authenticated
  USING (true);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id bigint PRIMARY KEY,
  year int NOT NULL,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to seasons"
  ON seasons FOR SELECT
  TO authenticated
  USING (true);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  country text,
  founded int,
  logo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id bigint PRIMARY KEY,
  league_id bigint REFERENCES leagues(id),
  season_id bigint REFERENCES seasons(id),
  home_team_id bigint REFERENCES teams(id),
  away_team_id bigint REFERENCES teams(id),
  match_date timestamptz NOT NULL,
  status text,
  status_elapsed int,
  venue_name text,
  referee text,
  home_score int,
  away_score int,
  home_halftime_score int,
  away_halftime_score int,
  home_fulltime_score int,
  away_fulltime_score int,
  home_extratime_score int,
  away_extratime_score int,
  home_penalty_score int,
  away_penalty_score int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_league ON matches(league_id);
CREATE INDEX idx_matches_season ON matches(season_id);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to matches"
  ON matches FOR SELECT
  TO authenticated
  USING (true);

-- Match events table
CREATE TABLE IF NOT EXISTS match_events (
  id bigserial PRIMARY KEY,
  match_id bigint REFERENCES matches(id),
  team_id bigint REFERENCES teams(id),
  player_name text,
  assist_name text,
  event_type text NOT NULL,
  event_detail text,
  elapsed int,
  extra_elapsed int,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_match_events_match ON match_events(match_id);

ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to match events"
  ON match_events FOR SELECT
  TO authenticated
  USING (true);

-- Match statistics table
CREATE TABLE IF NOT EXISTS match_statistics (
  id bigserial PRIMARY KEY,
  match_id bigint REFERENCES matches(id),
  team_id bigint REFERENCES teams(id),
  stat_type text NOT NULL,
  stat_value text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_match_statistics_match ON match_statistics(match_id);

ALTER TABLE match_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to match statistics"
  ON match_statistics FOR SELECT
  TO authenticated
  USING (true);

-- Match lineups table
CREATE TABLE IF NOT EXISTS match_lineups (
  id bigserial PRIMARY KEY,
  match_id bigint REFERENCES matches(id),
  team_id bigint REFERENCES teams(id),
  player_name text NOT NULL,
  player_number int,
  player_position text,
  is_starter boolean DEFAULT true,
  grid_position text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_match_lineups_match ON match_lineups(match_id);

ALTER TABLE match_lineups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to match lineups"
  ON match_lineups FOR SELECT
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_leagues_updated_at
  BEFORE UPDATE ON leagues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasons_updated_at
  BEFORE UPDATE ON seasons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();