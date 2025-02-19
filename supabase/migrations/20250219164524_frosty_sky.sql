/*
  # Système d'enregistrement des matchs sportifs

  1. Tables principales
    - `sports` : Types de sports supportés
    - `competitions` : Niveaux de compétition
    - `match_details` : Détails supplémentaires des matchs
    - `officials` : Arbitres et officiels
    - `match_officials` : Association matchs-officiels

  2. Modifications
    - Ajout de colonnes à la table matches
    - Ajout de contraintes et index

  3. Sécurité
    - Activation RLS sur toutes les tables
    - Politiques d'accès basées sur l'authentification
*/

-- Table des sports
CREATE TABLE IF NOT EXISTS sports (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sports ENABLE ROW LEVEL SECURITY;

-- Table des compétitions
CREATE TABLE IF NOT EXISTS competitions (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  sport_id bigint REFERENCES sports(id),
  level text NOT NULL, -- 'championship', 'cup', 'friendly'
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- Table des officiels
CREATE TABLE IF NOT EXISTS officials (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL, -- 'referee', 'assistant', 'fourth_official'
  nationality text,
  license_number text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE officials ENABLE ROW LEVEL SECURITY;

-- Table d'association matchs-officiels
CREATE TABLE IF NOT EXISTS match_officials (
  id bigserial PRIMARY KEY,
  match_id bigint REFERENCES matches(id),
  official_id bigint REFERENCES officials(id),
  role text NOT NULL, -- 'main', 'assistant1', 'assistant2', 'fourth'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE match_officials ENABLE ROW LEVEL SECURITY;

-- Table des détails supplémentaires des matchs
CREATE TABLE IF NOT EXISTS match_details (
  id bigserial PRIMARY KEY,
  match_id bigint REFERENCES matches(id),
  weather_conditions text,
  pitch_condition text,
  attendance integer,
  var_used boolean DEFAULT false,
  additional_time_first_half integer,
  additional_time_second_half integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE match_details ENABLE ROW LEVEL SECURITY;

-- Ajout de colonnes à la table matches
ALTER TABLE matches 
  ADD COLUMN IF NOT EXISTS sport_id bigint REFERENCES sports(id),
  ADD COLUMN IF NOT EXISTS competition_id bigint REFERENCES competitions(id),
  ADD COLUMN IF NOT EXISTS importance text CHECK (importance IN ('high', 'medium', 'low')),
  ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected')),
  ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_matches_sport ON matches(sport_id);
CREATE INDEX IF NOT EXISTS idx_matches_competition ON matches(competition_id);
CREATE INDEX IF NOT EXISTS idx_matches_validation ON matches(validation_status);
CREATE INDEX IF NOT EXISTS idx_match_officials_match ON match_officials(match_id);
CREATE INDEX IF NOT EXISTS idx_match_details_match ON match_details(match_id);

-- Politiques RLS

-- Sports
CREATE POLICY "Allow public read access to sports"
  ON sports FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create sports"
  ON sports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sports"
  ON sports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Competitions
CREATE POLICY "Allow public read access to competitions"
  ON competitions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create competitions"
  ON competitions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update competitions"
  ON competitions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Officials
CREATE POLICY "Allow public read access to officials"
  ON officials FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create officials"
  ON officials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update officials"
  ON officials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Match Officials
CREATE POLICY "Allow public read access to match_officials"
  ON match_officials FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create match_officials"
  ON match_officials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update match_officials"
  ON match_officials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Match Details
CREATE POLICY "Allow public read access to match_details"
  ON match_details FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create match_details"
  ON match_details FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update match_details"
  ON match_details FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fonction pour valider un match
CREATE OR REPLACE FUNCTION validate_match(
  match_id bigint,
  status text,
  validator_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que le statut est valide
  IF status NOT IN ('validated', 'rejected') THEN
    RAISE EXCEPTION 'Invalid validation status';
  END IF;

  -- Mettre à jour le match
  UPDATE matches
  SET validation_status = status,
      validated_by = validator_id,
      validated_at = now(),
      updated_at = now()
  WHERE id = match_id;
END;
$$;

-- Fonction pour obtenir les statistiques complètes d'un match
CREATE OR REPLACE FUNCTION get_match_full_statistics(match_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'match', m,
    'details', md,
    'officials', jsonb_agg(DISTINCT mo),
    'statistics', jsonb_agg(DISTINCT ms),
    'events', jsonb_agg(DISTINCT me),
    'lineups', jsonb_agg(DISTINCT ml)
  )
  INTO result
  FROM matches m
  LEFT JOIN match_details md ON md.match_id = m.id
  LEFT JOIN match_officials mo ON mo.match_id = m.id
  LEFT JOIN match_statistics ms ON ms.match_id = m.id
  LEFT JOIN match_events me ON me.match_id = m.id
  LEFT JOIN match_lineups ml ON ml.match_id = m.id
  WHERE m.id = match_id
  GROUP BY m.id, md.id;

  RETURN result;
END;
$$;

-- Données initiales pour les sports
INSERT INTO sports (name, description) VALUES
  ('Football', 'Association football / soccer'),
  ('Futsal', 'Indoor football'),
  ('Beach Soccer', 'Beach football')
ON CONFLICT DO NOTHING;

-- Données initiales pour les compétitions
INSERT INTO competitions (name, sport_id, level, description) VALUES
  ('Championnat', 1, 'championship', 'Compétition régulière de championnat'),
  ('Coupe Nationale', 1, 'cup', 'Compétition à élimination directe'),
  ('Match Amical', 1, 'friendly', 'Rencontre amicale entre équipes')
ON CONFLICT DO NOTHING;