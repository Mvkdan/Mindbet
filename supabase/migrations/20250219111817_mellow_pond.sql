-- Update RLS policies to allow insert and update
ALTER POLICY "Allow public read access to leagues"
  ON leagues
  RENAME TO "Allow authenticated access to leagues";

DROP POLICY "Allow authenticated access to leagues" ON leagues;

CREATE POLICY "Allow authenticated access to leagues"
  ON leagues
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER POLICY "Allow public read access to seasons"
  ON seasons
  RENAME TO "Allow authenticated access to seasons";

DROP POLICY "Allow authenticated access to seasons" ON seasons;

CREATE POLICY "Allow authenticated access to seasons"
  ON seasons
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER POLICY "Allow public read access to teams"
  ON teams
  RENAME TO "Allow authenticated access to teams";

DROP POLICY "Allow authenticated access to teams" ON teams;

CREATE POLICY "Allow authenticated access to teams"
  ON teams
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER POLICY "Allow public read access to matches"
  ON matches
  RENAME TO "Allow authenticated access to matches";

DROP POLICY "Allow authenticated access to matches" ON matches;

CREATE POLICY "Allow authenticated access to matches"
  ON matches
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER POLICY "Allow public read access to match events"
  ON match_events
  RENAME TO "Allow authenticated access to match events";

DROP POLICY "Allow authenticated access to match events" ON match_events;

CREATE POLICY "Allow authenticated access to match events"
  ON match_events
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER POLICY "Allow public read access to match statistics"
  ON match_statistics
  RENAME TO "Allow authenticated access to match statistics";

DROP POLICY "Allow authenticated access to match statistics" ON match_statistics;

CREATE POLICY "Allow authenticated access to match statistics"
  ON match_statistics
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER POLICY "Allow public read access to match lineups"
  ON match_lineups
  RENAME TO "Allow authenticated access to match lineups";

DROP POLICY "Allow authenticated access to match lineups" ON match_lineups;

CREATE POLICY "Allow authenticated access to match lineups"
  ON match_lineups
  TO authenticated
  USING (true)
  WITH CHECK (true);