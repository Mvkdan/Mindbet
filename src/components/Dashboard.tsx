import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Activity, Calendar, Loader2, Users, Filter, Search, Globe } from 'lucide-react';
import { useLiveMatches } from '../hooks/useLiveMatches';
import { useDataLoader } from '../hooks/useDataLoader';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { MatchList } from './MatchList';
import { MatchDetails } from './MatchDetails';
import { PlayersList } from './PlayersList';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { Match, League, Player } from '../types';

export function Dashboard() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'players'>('matches');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const {
    data: liveMatches,
    isLoading: liveLoading,
    error: liveError,
    refresh: refreshLive,
    lastUpdate: liveLastUpdate
  } = useLiveMatches();

  const {
    data: todayMatches,
    isLoading: todayLoading,
    error: todayError,
    refresh: refreshToday,
    lastUpdate: todayLastUpdate
  } = useDataLoader({
    initialData: [],
    loadData: () => api.matches.getByDate(format(new Date(), 'yyyy-MM-dd')),
    refreshInterval: 300000, // Rafraîchir toutes les 5 minutes
  });

  // Récupérer les ligues
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const { data: leaguesData, error } = await supabase
          .from('leagues')
          .select('*')
          .order('name');

        if (error) throw error;
        setLeagues(leaguesData);
      } catch (error) {
        console.error('Error fetching leagues:', error);
      }
    };

    fetchLeagues();
  }, []);

  // Récupérer les joueurs
  useEffect(() => {
    const fetchPlayers = async () => {
      if (activeTab !== 'players') return;

      setLoadingPlayers(true);
      try {
        const { data: playersData, error } = await supabase
          .from('players')
          .select(`
            *,
            teams (
              id,
              name,
              logo
            ),
            leagues (
              id,
              name,
              country
            )
          `)
          .order('name');

        if (error) throw error;
        setPlayers(playersData);
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setLoadingPlayers(false);
      }
    };

    fetchPlayers();
  }, [activeTab]);

  // Filtrer les matchs
  const filteredMatches = (matches: Match[]) => {
    return matches.filter(match => {
      const matchesSearch = 
        match.teams.home.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.teams.away.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.league.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLeague = !selectedLeague || match.league.id.toString() === selectedLeague;
      const matchesCountry = !selectedCountry || match.league.country === selectedCountry;
      
      return matchesSearch && matchesLeague && matchesCountry;
    });
  };

  // Obtenir les pays uniques des ligues
  const countries = Array.from(new Set(leagues.map(league => league.country))).sort();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('matches')}
          className={`pb-4 px-2 font-medium ${
            activeTab === 'matches'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-5 h-5 inline-block mr-2" />
          Matchs
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`pb-4 px-2 font-medium ${
            activeTab === 'players'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-5 h-5 inline-block mr-2" />
          Joueurs
        </button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={activeTab === 'matches' ? "Rechercher une équipe, une compétition..." : "Rechercher un joueur..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                icon={<Globe className="w-4 h-4" />}
              >
                <option value="">Tous les pays</option>
                {countries.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-full md:w-64">
              <Select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                icon={<Filter className="w-4 h-4" />}
              >
                <option value="">Toutes les compétitions</option>
                {leagues
                  .filter(league => !selectedCountry || league.country === selectedCountry)
                  .map(league => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeTab === 'matches' ? (
        <>
          {/* Matchs en direct */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold flex items-center">
                  <Activity className="w-6 h-6 text-red-500 mr-2" />
                  Matchs en direct
                </h2>
                {liveMatches.length > 0 && (
                  <Badge variant="secondary" className="text-sm">
                    {filteredMatches(liveMatches).length} match{filteredMatches(liveMatches).length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <Button
                onClick={refreshLive}
                disabled={liveLoading}
                variant="outline"
                className="flex items-center space-x-2"
              >
                {liveLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Actualisation...</span>
                  </>
                ) : (
                  <>
                    Dernière mise à jour : {liveLastUpdate ? format(liveLastUpdate, 'HH:mm:ss') : '--:--:--'}
                  </>
                )}
              </Button>
            </div>

            {liveError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="font-medium">Une erreur est survenue</p>
                <p className="mt-1 text-sm">{liveError}</p>
              </div>
            ) : filteredMatches(liveMatches).length > 0 ? (
              <MatchList 
                matches={filteredMatches(liveMatches)} 
                onMatchClick={(match) => setSelectedMatch(match)}
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">Aucun match en direct</p>
              </div>
            )}
          </section>

          {/* Matchs du jour */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold flex items-center">
                  <Calendar className="w-6 h-6 text-blue-500 mr-2" />
                  Matchs du jour
                </h2>
                {todayMatches.length > 0 && (
                  <Badge variant="secondary" className="text-sm">
                    {filteredMatches(todayMatches).length} match{filteredMatches(todayMatches).length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <Button
                onClick={refreshToday}
                disabled={todayLoading}
                variant="outline"
                className="flex items-center space-x-2"
              >
                {todayLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Actualisation...</span>
                  </>
                ) : (
                  <>
                    Dernière mise à jour : {todayLastUpdate ? format(todayLastUpdate, 'HH:mm:ss') : '--:--:--'}
                  </>
                )}
              </Button>
            </div>

            {todayError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="font-medium">Une erreur est survenue</p>
                <p className="mt-1 text-sm">{todayError}</p>
              </div>
            ) : filteredMatches(todayMatches).length > 0 ? (
              <MatchList 
                matches={filteredMatches(todayMatches)}
                onMatchClick={(match) => setSelectedMatch(match)}
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">Aucun match prévu aujourd'hui</p>
              </div>
            )}
          </section>
        </>
      ) : (
        <PlayersList 
          players={players}
          loading={loadingPlayers}
          searchTerm={searchTerm}
          selectedLeague={selectedLeague}
          selectedCountry={selectedCountry}
        />
      )}

      {/* Modal de détails du match */}
      {selectedMatch && (
        <MatchDetails
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}