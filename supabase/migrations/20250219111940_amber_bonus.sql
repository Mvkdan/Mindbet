-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated access to leagues" ON leagues;
DROP POLICY IF EXISTS "Allow authenticated access to seasons" ON seasons;
DROP POLICY IF EXISTS "Allow authenticated access to teams" ON teams;
DROP POLICY IF EXISTS "Allow authenticated access to matches" ON matches;
DROP POLICY IF EXISTS "Allow authenticated access to match events" ON match_events;
DROP POLICY IF EXISTS "Allow authenticated access to match statistics" ON match_statistics;
DROP POLICY IF EXISTS "Allow authenticated access to match lineups" ON match_lineups;

-- Create new policies with full access for authenticated users
CREATE POLICY "Allow authenticated full access to leagues"
  ON leagues
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to seasons"
  ON seasons
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to teams"
  ON teams
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to matches"
  ON matches
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to match events"
  ON match_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to match statistics"
  ON match_statistics
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to match lineups"
  ON match_lineups
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);