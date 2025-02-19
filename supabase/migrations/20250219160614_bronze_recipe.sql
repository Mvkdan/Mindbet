/*
  # Fonctions de gestion du stockage

  1. Nouvelles fonctions
    - get_table_columns : Récupère les informations sur les colonnes d'une table
    - get_table_stats : Récupère les statistiques d'une table

  2. Sécurité
    - Accès restreint aux utilisateurs authentifiés
    - Fonctions en SECURITY DEFINER pour un accès contrôlé
*/

-- Fonction pour récupérer les informations sur les colonnes d'une table
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE (
  name text,
  type text,
  nullable boolean,
  is_primary boolean,
  is_foreign boolean,
  references_table text,
  references_column text
) SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.column_name::text,
    c.data_type::text,
    c.is_nullable = 'YES',
    COALESCE(pk.is_primary, false),
    COALESCE(fk.is_foreign, false),
    fk.foreign_table_name,
    fk.foreign_column_name
  FROM information_schema.columns c
  LEFT JOIN (
    SELECT
      kcu.column_name,
      true as is_primary
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_name = table_name
  ) pk ON c.column_name = pk.column_name
  LEFT JOIN (
    SELECT
      kcu.column_name,
      true as is_foreign,
      ccu.table_name as foreign_table_name,
      ccu.column_name as foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = table_name
  ) fk ON c.column_name = fk.column_name
  WHERE c.table_name = table_name
  ORDER BY c.ordinal_position;
END;
$$;

-- Fonction pour récupérer les statistiques d'une table
CREATE OR REPLACE FUNCTION get_table_stats(table_name text)
RETURNS TABLE (
  row_count bigint,
  size text,
  last_updated timestamptz
) SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT reltuples::bigint FROM pg_class WHERE relname = table_name),
    pg_size_pretty(pg_total_relation_size(table_name::regclass)),
    COALESCE(
      (SELECT max(updated_at) FROM (SELECT updated_at FROM public.table_name LIMIT 1) t),
      now()
    );
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_stats(text) TO authenticated;

-- Créer une table pour les métadonnées des tables
CREATE TABLE table_metadata (
  id bigserial PRIMARY KEY,
  table_name text NOT NULL,
  table_type text NOT NULL,
  description text,
  size text NOT NULL,
  row_count bigint NOT NULL,
  last_maintenance timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS sur la table
ALTER TABLE table_metadata ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour la table
CREATE POLICY "Allow authenticated access to table_metadata"
  ON table_metadata
  TO authenticated
  USING (true)
  WITH CHECK (true);