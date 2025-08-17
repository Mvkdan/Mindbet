-- historical_leagues table
CREATE TABLE IF NOT EXISTS historical_leagues (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  season text NOT NULL,
  source_file text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE historical_leagues IS 'Stores metadata for leagues imported from historical sources like football.json';
COMMENT ON COLUMN historical_leagues.name IS 'The name of the league and season, e.g., "Premier League 2023/24"';
COMMENT ON COLUMN historical_leagues.season IS 'The season identifier, e.g., "2023-24"';
COMMENT ON COLUMN historical_leagues.source_file IS 'The source file name from the repository, e.g., "en.1.json"';

ALTER TABLE historical_leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to historical_leagues"
  ON historical_leagues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow individual insert access to historical_leagues"
  ON historical_leagues FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- historical_matches table
CREATE TABLE IF NOT EXISTS historical_matches (
  id bigserial PRIMARY KEY,
  historical_league_id bigint NOT NULL REFERENCES historical_leagues(id) ON DELETE CASCADE,
  round text,
  match_date date,
  home_team_name text NOT NULL,
  away_team_name text NOT NULL,
  home_team_id bigint REFERENCES teams(id),
  away_team_id bigint REFERENCES teams(id),
  home_score int NOT NULL,
  away_score int NOT NULL,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE historical_matches IS 'Stores match data imported from historical sources';
COMMENT ON COLUMN historical_matches.historical_league_id IS 'FK to the historical league metadata';
COMMENT ON COLUMN historical_matches.home_team_name IS 'Team name as it appears in the source data';
COMMENT ON COLUMN historical_matches.away_team_name IS 'Team name as it appears in the source data';
COMMENT ON COLUMN historical_matches.home_team_id IS 'FK to the main teams table, for reconciliation';
COMMENT ON COLUMN historical_matches.away_team_id IS 'FK to the main teams table, for reconciliation';

CREATE INDEX idx_historical_matches_league_id ON historical_matches(historical_league_id);
CREATE INDEX idx_historical_matches_date ON historical_matches(match_date);
CREATE INDEX idx_historical_matches_home_team_id ON historical_matches(home_team_id);
CREATE INDEX idx_historical_matches_away_team_id ON historical_matches(away_team_id);

ALTER TABLE historical_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to historical_matches"
  ON historical_matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow individual insert access to historical_matches"
  ON historical_matches FOR INSERT
  TO authenticated
  WITH CHECK (true);
