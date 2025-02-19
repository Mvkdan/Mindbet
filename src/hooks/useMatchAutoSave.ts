import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Match } from '../types';
import { logger } from '../lib/logger';

export function useMatchAutoSave(matches: Match[]) {
  useEffect(() => {
    const saveFinishedMatch = async (match: Match) => {
      try {
        // Vérifier si le match existe déjà
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('id', match.fixture.id)
          .single();

        if (existingMatch) {
          logger.info('MatchAutoSave', `Match ${match.fixture.id} already exists`);
          return;
        }

        // Insérer le match
        const { error: matchError } = await supabase
          .from('matches')
          .insert({
            id: match.fixture.id,
            league_id: match.league.id,
            season_id: new Date().getFullYear(),
            home_team_id: match.teams.home.id,
            away_team_id: match.teams.away.id,
            match_date: match.fixture.date,
            status: match.fixture.status.short,
            status_elapsed: match.fixture.status.elapsed,
            venue_name: match.fixture.venue.name,
            referee: match.fixture.referee,
            home_score: match.goals.home,
            away_score: match.goals.away,
            home_halftime_score: match.score.halftime.home,
            away_halftime_score: match.score.halftime.away,
            home_fulltime_score: match.score.fulltime.home,
            away_fulltime_score: match.score.fulltime.away,
            home_extratime_score: match.score.extratime?.home,
            away_extratime_score: match.score.extratime?.away,
            home_penalty_score: match.score.penalty?.home,
            away_penalty_score: match.score.penalty?.away
          });

        if (matchError) throw matchError;

        logger.info('MatchAutoSave', `Match ${match.fixture.id} saved successfully`);

        // Sauvegarder les statistiques du match
        const { error: statsError } = await supabase
          .from('match_statistics')
          .insert(
            match.statistics?.map(stat => ({
              match_id: match.fixture.id,
              team_id: stat.team.id,
              stat_type: stat.type,
              stat_value: stat.value?.toString()
            })) || []
          );

        if (statsError) {
          logger.error('MatchAutoSave', 'Error saving match statistics', statsError);
        }

        // Sauvegarder les événements du match
        const { error: eventsError } = await supabase
          .from('match_events')
          .insert(
            match.events?.map(event => ({
              match_id: match.fixture.id,
              team_id: event.team.id,
              player_name: event.player?.name,
              assist_name: event.assist?.name,
              event_type: event.type,
              event_detail: event.detail,
              elapsed: event.time.elapsed,
              extra_elapsed: event.time.extra
            })) || []
          );

        if (eventsError) {
          logger.error('MatchAutoSave', 'Error saving match events', eventsError);
        }

        // Sauvegarder les compositions
        const { error: lineupsError } = await supabase
          .from('match_lineups')
          .insert(
            match.lineups?.flatMap(lineup => [
              ...lineup.startXI.map(player => ({
                match_id: match.fixture.id,
                team_id: lineup.team.id,
                player_name: player.player.name,
                player_number: player.player.number,
                player_position: player.player.pos,
                is_starter: true,
                grid_position: player.player.grid
              })),
              ...lineup.substitutes.map(player => ({
                match_id: match.fixture.id,
                team_id: lineup.team.id,
                player_name: player.player.name,
                player_number: player.player.number,
                player_position: player.player.pos,
                is_starter: false,
                grid_position: null
              }))
            ]) || []
          );

        if (lineupsError) {
          logger.error('MatchAutoSave', 'Error saving match lineups', lineupsError);
        }

      } catch (error) {
        logger.error('MatchAutoSave', `Error saving match ${match.fixture.id}`, error);
      }
    };

    // Vérifier les matchs qui viennent de se terminer
    matches.forEach(match => {
      if (match.fixture.status.short === 'FT') {
        saveFinishedMatch(match);
      }
    });
  }, [matches]);
}