/*
  # Fix RLS policies and add public access

  1. Changes
    - Drop all existing RLS policies
    - Enable public access for all tables
    - Add policies for both authenticated and anon users
    - Ensure insert/update operations are allowed
  
  2. Security
    - Maintain RLS but allow public read access
    - Allow authenticated users full access
    - Allow anon users read-only access
*/

-- Disable RLS temporarily to clean up policies
ALTER TABLE leagues DISABLE ROW LEVEL SECURITY;
ALTER TABLE seasons DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE match_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE match_statistics DISABLE ROW LEVEL SECURITY;
ALTER TABLE match_lineups DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated full access to leagues" ON leagues;
DROP POLICY IF EXISTS "Allow authenticated full access to seasons" ON seasons;
DROP POLICY IF EXISTS "Allow authenticated full access to teams" ON teams;
DROP POLICY IF EXISTS "Allow authenticated full access to matches" ON matches;
DROP POLICY IF EXISTS "Allow authenticated full access to match events" ON match_events;
DROP POLICY IF EXISTS "Allow authenticated full access to match statistics" ON match_statistics;
DROP POLICY IF EXISTS "Allow authenticated full access to match lineups" ON match_lineups;

-- Re-enable RLS
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_lineups ENABLE ROW LEVEL SECURITY;

-- Create policies for leagues
CREATE POLICY "Allow public read access to leagues"
  ON leagues FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated write access to leagues"
  ON leagues FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access to leagues"
  ON leagues FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for seasons
CREATE POLICY "Allow public read access to seasons"
  ON seasons FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated write access to seasons"
  ON seasons FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access to seasons"
  ON seasons FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for teams
CREATE POLICY "Allow public read access to teams"
  ON teams FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated write access to teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access to teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for matches
CREATE POLICY "Allow public read access to matches"
  ON matches FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated write access to matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access to matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for match events
CREATE POLICY "Allow public read access to match events"
  ON match_events FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated write access to match events"
  ON match_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access to match events"
  ON match_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for match statistics
CREATE POLICY "Allow public read access to match statistics"
  ON match_statistics FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated write access to match statistics"
  ON match_statistics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access to match statistics"
  ON match_statistics FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for match lineups
CREATE POLICY "Allow public read access to match lineups"
  ON match_lineups FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated write access to match lineups"
  ON match_lineups FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access to match lineups"
  ON match_lineups FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);