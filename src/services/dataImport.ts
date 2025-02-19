import { supabase } from '../lib/supabase';
import {
  getLeagues,
  getSeasons,
  getMatches,
  getTeams,
  getTeamStatistics,
  getPlayers,
  getPlayerStatistics,
  getFixtureStatistics,
  getFixtureEvents,
  getFixtureLineups,
  getOdds,
  getLeagueStandings,
} from '../api';
import type { League, Season, Match, Team } from '../types';

export type ImportProgress = {
  step: string;
  total: number;
  current: number;
  completed: {
    leagues: number;
    seasons: number;
    matches: number;
    teams: number;
    players: number;
    statistics: number;
    events: number;
    lineups: number;
    standings: number;
    odds: number;
  };
  error?: string;
};

type ImportCallback = (progress: ImportProgress) => void;

// Validation functions
const isValidLeague = (league: any): league is League => {
  return (
    league &&
    typeof league.id === 'number' &&
    typeof league.name === 'string' &&
    league.id > 0 &&
    league.name.length > 0
  );
};

const isValidTeam = (team: any): team is Team => {
  return (
    team &&
    typeof team.id === 'number' &&
    typeof team.name === 'string' &&
    team.id > 0 &&
    team.name.length > 0
  );
};

const isValidMatch = (match: any): match is Match => {
  return (
    match &&
    match.fixture &&
    typeof match.fixture.id === 'number' &&
    match.fixture.id > 0 &&
    match.teams?.home &&
    match.teams?.away &&
    typeof match.teams.home.id === 'number' &&
    typeof match.teams.away.id === 'number'
  );
};

const logImportStep = (step: string, data: any, error?: any) => {
  console.group(`Import Step: ${step}`);
  if (error) {
    console.error('Error:', error);
    console.error('Error Details:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
  }
  console.log('Data:', data);
  console.groupEnd();
};

export async function importHistoricalData(onProgress: ImportCallback, selectedSeason: number) {
  console.log('Starting import for season:', selectedSeason);
  
  const completed = {
    leagues: 0,
    seasons: 0,
    matches: 0,
    teams: 0,
    players: 0,
    statistics: 0,
    events: 0,
    lineups: 0,
    standings: 0,
    odds: 0
  };

  try {
    // 1. Create or update the selected season
    console.log('Step 1: Creating season record');
    onProgress({
      step: 'seasons',
      total: 1,
      current: 0,
      completed
    });

    const seasonData = {
      id: selectedSeason,
      year: selectedSeason,
      start_date: `${selectedSeason}-07-01`,
      end_date: `${selectedSeason + 1}-06-30`,
      is_current: selectedSeason === new Date().getFullYear()
    };

    console.log('Season data to insert:', seasonData);

    const { data: insertedSeason, error: seasonError } = await supabase
      .from('seasons')
      .upsert(seasonData)
      .select()
      .single();

    if (seasonError) {
      logImportStep('seasons', seasonData, seasonError);
      throw new Error(`Failed to create season: ${seasonError.message}`);
    }

    console.log('Season created successfully:', insertedSeason);
    completed.seasons = 1;
    
    onProgress({
      step: 'seasons',
      total: 1,
      current: 1,
      completed
    });

    // 2. Import Leagues
    console.log('Step 2: Importing leagues');
    onProgress({
      step: 'leagues',
      total: 0,
      current: 0,
      completed
    });

    const leagues = await getLeagues();
    console.log('Fetched leagues:', leagues.length);
    const validLeagues = leagues.filter(isValidLeague);
    console.log('Valid leagues:', validLeagues.length);

    onProgress({
      step: 'leagues',
      total: validLeagues.length,
      current: 0,
      completed
    });

    for (let i = 0; i < validLeagues.length; i++) {
      const league = validLeagues[i];
      try {
        console.log(`Importing league ${i + 1}/${validLeagues.length}:`, league.name);
        
        const leagueData = {
          id: league.id,
          name: league.name,
          country: league.country || null,
          type: league.type || null,
          logo: league.logo || null
        };

        const { data: insertedLeague, error: leagueError } = await supabase
          .from('leagues')
          .upsert(leagueData)
          .select()
          .single();

        if (leagueError) {
          logImportStep('leagues', leagueData, leagueError);
          console.error(`Error importing league ${league.id}:`, leagueError);
        } else {
          console.log('League imported successfully:', insertedLeague);
          completed.leagues++;
        }
        
        onProgress({
          step: 'leagues',
          total: validLeagues.length,
          current: i + 1,
          completed
        });

        // For each league, import all related data for the selected season
        try {
          // 3. Import Teams
          console.log(`Importing teams for league ${league.name}`);
          const teams = await getTeams(league.id, selectedSeason);
          console.log(`Fetched ${teams.length} teams for league ${league.name}`);
          const validTeams = teams.filter(isValidTeam);
          console.log(`Valid teams: ${validTeams.length}`);

          for (const team of validTeams) {
            console.log(`Importing team: ${team.name}`);
            const teamData = {
              id: team.id,
              name: team.name,
              country: team.country || null,
              founded: team.founded || null,
              logo: team.logo || null
            };

            const { data: insertedTeam, error: teamError } = await supabase
              .from('teams')
              .upsert(teamData)
              .select()
              .single();

            if (teamError) {
              logImportStep('teams', teamData, teamError);
              console.error(`Error importing team ${team.id}:`, teamError);
            } else {
              console.log('Team imported successfully:', insertedTeam);
              completed.teams++;
            }

            // 4. Import Team Statistics
            const teamStats = await getTeamStatistics(team.id, league.id, selectedSeason);
            if (teamStats) {
              const { error: statsError } = await supabase
                .from('team_statistics')
                .upsert({
                  team_id: team.id,
                  league_id: league.id,
                  season_id: selectedSeason,
                  data: teamStats
                });

              if (!statsError) {
                completed.statistics++;
              }
            }

            // 5. Import Players
            const players = await getPlayers(team.id, selectedSeason);
            const validPlayers = players.filter(player => player && player.id && player.name);

            for (const player of validPlayers) {
              const { error: playerError } = await supabase
                .from('players')
                .upsert({
                  id: player.id,
                  name: player.name,
                  nationality: player.nationality || null,
                  photo: player.photo || null
                });

              if (!playerError) {
                completed.players++;
              }

              // 6. Import Player Statistics
              const playerStats = await getPlayerStatistics(player.id, selectedSeason);
              if (playerStats) {
                const { error: playerStatsError } = await supabase
                  .from('player_statistics')
                  .upsert({
                    player_id: player.id,
                    season_id: selectedSeason,
                    data: playerStats
                  });

                if (!playerStatsError) {
                  completed.statistics++;
                }
              }
            }
          }

          // 7. Import Matches
          const matches = await getMatches(selectedSeason.toString());
          const validMatches = matches.filter(isValidMatch);

          for (const match of validMatches) {
            const { error: matchError } = await supabase
              .from('matches')
              .upsert({
                id: match.fixture.id,
                league_id: league.id,
                season_id: selectedSeason,
                home_team_id: match.teams.home.id,
                away_team_id: match.teams.away.id,
                match_date: match.fixture.date,
                status: match.fixture.status.short || null,
                status_elapsed: match.fixture.status.elapsed || null,
                venue_name: match.fixture.venue?.name || null,
                referee: match.fixture.referee || null,
                home_score: match.goals?.home || null,
                away_score: match.goals?.away || null,
                home_halftime_score: match.score?.halftime?.home || null,
                away_halftime_score: match.score?.halftime?.away || null,
                home_fulltime_score: match.score?.fulltime?.home || null,
                away_fulltime_score: match.score?.fulltime?.away || null,
                home_extratime_score: match.score?.extratime?.home || null,
                away_extratime_score: match.score?.extratime?.away || null,
                home_penalty_score: match.score?.penalty?.home || null,
                away_penalty_score: match.score?.penalty?.away || null
              });

            if (!matchError) {
              completed.matches++;

              // 8. Import Match Events
              const events = await getFixtureEvents(match.fixture.id);
              for (const event of events) {
                if (event && event.team?.id && event.type) {
                  const { error: eventError } = await supabase
                    .from('match_events')
                    .upsert({
                      match_id: match.fixture.id,
                      team_id: event.team.id,
                      player_name: event.player?.name || null,
                      assist_name: event.assist?.name || null,
                      event_type: event.type,
                      event_detail: event.detail || null,
                      elapsed: event.time?.elapsed || null,
                      extra_elapsed: event.time?.extra || null
                    });

                  if (!eventError) {
                    completed.events++;
                  }
                }
              }

              // 9. Import Match Statistics
              const statistics = await getFixtureStatistics(match.fixture.id);
              for (const stat of statistics) {
                if (stat && stat.team?.id) {
                  for (const item of stat.statistics) {
                    if (item && item.type) {
                      const { error: statError } = await supabase
                        .from('match_statistics')
                        .upsert({
                          match_id: match.fixture.id,
                          team_id: stat.team.id,
                          stat_type: item.type,
                          stat_value: item.value?.toString() || null
                        });

                      if (!statError) {
                        completed.statistics++;
                      }
                    }
                  }
                }
              }

              // 10. Import Match Lineups
              const lineups = await getFixtureLineups(match.fixture.id);
              for (const lineup of lineups) {
                if (lineup && lineup.team?.id) {
                  for (const player of [...(lineup.startXI || []), ...(lineup.substitutes || [])]) {
                    if (player && player.player) {
                      const { error: lineupError } = await supabase
                        .from('match_lineups')
                        .upsert({
                          match_id: match.fixture.id,
                          team_id: lineup.team.id,
                          player_name: player.player.name,
                          player_number: player.player.number || null,
                          player_position: player.player.pos || null,
                          is_starter: lineup.startXI?.includes(player) || false,
                          grid_position: player.player.grid || null
                        });

                      if (!lineupError) {
                        completed.lineups++;
                      }
                    }
                  }
                }
              }
            }
          }

          // 11. Import League Standings
          const standings = await getLeagueStandings(league.id, selectedSeason);
          if (standings && standings.length > 0) {
            const { error: standingsError } = await supabase
              .from('league_standings')
              .upsert({
                league_id: league.id,
                season_id: selectedSeason,
                data: standings
              });

            if (!standingsError) {
              completed.standings++;
            }
          }

          // 12. Import Odds
          const odds = await getOdds();
          for (const odd of odds) {
            if (odd && odd.fixture?.id && odd.odds) {
              const { error: oddsError } = await supabase
                .from('match_odds')
                .upsert({
                  match_id: odd.fixture.id,
                  data: odd.odds
                });

              if (!oddsError) {
                completed.odds++;
              }
            }
          }
        } catch (error) {
          console.error('Error importing league data:', error);
          logImportStep('league_data', { leagueId: league.id }, error);
        }
      } catch (error) {
        console.error('Error importing league:', error);
        logImportStep('league', { league }, error);
      }
    }

    console.log('Import completed successfully');
    console.log('Final statistics:', completed);
    return { success: true, completed };
  } catch (error) {
    console.error('Error importing historical data:', error);
    logImportStep('global', { selectedSeason }, error);
    return { 
      success: false, 
      error,
      completed
    };
  }
}