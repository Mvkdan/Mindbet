-- Modifier la table players pour ajouter les nouveaux champs
ALTER TABLE players ADD COLUMN IF NOT EXISTS firstname text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS lastname text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS birthdate date;
ALTER TABLE players ADD COLUMN IF NOT EXISTS height text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS weight text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_season integer;

-- Créer la table pour suivre l'état des imports
CREATE TABLE IF NOT EXISTS import_state (
  id bigserial PRIMARY KEY,
  type text NOT NULL,
  last_batch integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Index pour la recherche rapide par type
CREATE INDEX idx_import_state_type ON import_state(type);

-- Enable RLS
ALTER TABLE import_state ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated access to import_state"
  ON import_state
  TO authenticated
  USING (true)
  WITH CHECK (true);