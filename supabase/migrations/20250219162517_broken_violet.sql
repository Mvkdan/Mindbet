-- Fonction pour récupérer les informations détaillées sur une table
CREATE OR REPLACE FUNCTION get_table_info(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean,
  is_primary boolean,
  is_foreign boolean,
  foreign_table text,
  foreign_column text,
  description text,
  row_count bigint,
  total_size text,
  last_vacuum timestamptz,
  last_analyze timestamptz
) SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH column_info AS (
    SELECT
      c.column_name,
      c.data_type,
      c.is_nullable = 'YES' as is_nullable,
      COALESCE(pk.is_primary, false) as is_primary,
      COALESCE(fk.is_foreign, false) as is_foreign,
      fk.foreign_table,
      fk.foreign_column,
      col_description(format('%I.%I', c.table_schema, c.table_name)::regclass::oid, c.ordinal_position) as description
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
        ccu.table_name as foreign_table,
        ccu.column_name as foreign_column
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
  ),
  table_stats AS (
    SELECT
      reltuples::bigint as row_count,
      pg_size_pretty(pg_total_relation_size(table_name::regclass)) as total_size,
      last_vacuum,
      last_analyze
    FROM pg_stat_user_tables
    WHERE relname = table_name
  )
  SELECT
    ci.*,
    ts.row_count,
    ts.total_size,
    ts.last_vacuum,
    ts.last_analyze
  FROM column_info ci
  CROSS JOIN table_stats ts;
END;
$$;

-- Fonction pour récupérer la structure complète de la base de données
CREATE OR REPLACE FUNCTION get_database_structure()
RETURNS TABLE (
  schema_name text,
  table_name text,
  table_type text,
  row_count bigint,
  total_size text,
  column_count integer,
  has_primary_key boolean,
  foreign_key_count integer,
  last_updated timestamptz
) SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH table_columns AS (
    SELECT 
      table_schema,
      table_name,
      count(*) as column_count,
      bool_or(is_pk) as has_primary_key,
      count(CASE WHEN is_fk THEN 1 END) as foreign_key_count
    FROM (
      SELECT
        c.table_schema,
        c.table_name,
        c.column_name,
        EXISTS (
          SELECT 1
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_name = c.table_name
            AND kcu.column_name = c.column_name
        ) as is_pk,
        EXISTS (
          SELECT 1
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = c.table_name
            AND kcu.column_name = c.column_name
        ) as is_fk
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
    ) cols
    GROUP BY table_schema, table_name
  )
  SELECT
    t.table_schema::text as schema_name,
    t.table_name::text,
    t.table_type::text,
    COALESCE(s.n_live_tup, 0)::bigint as row_count,
    pg_size_pretty(pg_total_relation_size(format('%I.%I', t.table_schema, t.table_name)::regclass))::text as total_size,
    tc.column_count,
    tc.has_primary_key,
    tc.foreign_key_count,
    greatest(s.last_vacuum, s.last_autovacuum, s.last_analyze, s.last_autoanalyze) as last_updated
  FROM information_schema.tables t
  JOIN table_columns tc
    ON t.table_schema = tc.table_schema
    AND t.table_name = tc.table_name
  LEFT JOIN pg_stat_user_tables s
    ON t.table_name = s.relname
  WHERE t.table_schema = 'public'
  ORDER BY t.table_name;
END;
$$;

-- Fonction pour récupérer un aperçu des données d'une table
CREATE OR REPLACE FUNCTION get_table_preview(
  table_name text,
  limit_rows integer DEFAULT 100,
  offset_rows integer DEFAULT 0
)
RETURNS TABLE (
  data jsonb,
  total_count bigint
) SECURITY DEFINER
LANGUAGE plpgsql AS $$
DECLARE
  query text;
  count_query text;
  result jsonb;
  total bigint;
BEGIN
  -- Get total count
  count_query := format('SELECT count(*) FROM %I', table_name);
  EXECUTE count_query INTO total;

  -- Get data
  query := format(
    'SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM %I LIMIT %s OFFSET %s) AS t',
    table_name,
    limit_rows,
    offset_rows
  );
  
  EXECUTE query INTO result;

  RETURN QUERY SELECT
    COALESCE(result, '[]'::jsonb),
    total;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_table_info(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_database_structure() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_preview(text, integer, integer) TO authenticated;