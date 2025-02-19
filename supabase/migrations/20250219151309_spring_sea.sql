/*
  # Add players tables and relationships

  1. New Tables
    - `players`
      - `id` (uuid, primary key)
      - `name` (text)
      - `nationality` (text)
      - `photo` (text)
      - `team_id` (references teams)
      - `league_id` (references leagues)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `players` table
    - Add policies for authenticated users
*/

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  nationality text,
  photo text,
  team_id bigint REFERENCES teams(id),
  league_id bigint REFERENCES leagues(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_league ON players(league_id);

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to players"
  ON players FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated write access to players"
  ON players FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access to players"
  ON players FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();