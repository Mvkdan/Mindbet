create or replace function public.validate_historical_league(league_id_to_validate bigint)
returns void as $$
begin
  -- Update the league status
  update public.historical_leagues
  set status = 'validated'
  where id = league_id_to_validate;

  -- Update the status of all associated matches
  update public.historical_matches
  set status = 'validated'
  where historical_league_id = league_id_to_validate;
end;
$$ language plpgsql;
