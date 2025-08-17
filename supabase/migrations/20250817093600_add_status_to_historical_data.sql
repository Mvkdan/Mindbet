-- Add status to historical_leagues
ALTER TABLE public.historical_leagues
ADD COLUMN status text NOT NULL DEFAULT 'staging';

-- Add status to historical_matches
ALTER TABLE public.historical_matches
ADD COLUMN status text NOT NULL DEFAULT 'staging';

-- Add unique constraint to prevent duplicate imports
ALTER TABLE public.historical_leagues
ADD CONSTRAINT historical_leagues_season_source_file_key UNIQUE (season, source_file);

-- Add comments for new columns
COMMENT ON COLUMN public.historical_leagues.status IS 'The validation status of the imported league (e.g., staging, validated, rejected)';
COMMENT ON COLUMN public.historical_matches.status IS 'The validation status of the imported match, inherited from the league';
