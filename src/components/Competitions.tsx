import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Trophy,
  Search,
  Globe,
  Calendar,
  Users,
  Flag,
  ChevronDown,
  Loader2,
  Table
} from 'lucide-react';
import {
  getLeagues,
  getSeasons,
  getLeagueStandings,
  getTeams,
  getMatches
} from '../api';
import type { League, Season, Match, Team } from '../types';

export const Competitions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'standings' | 'teams' | 'matches'>('overview');

  // Get unique countries from leagues
  const countries = Array.from(new Set(leagues.map(league => league.country))).sort();

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [leaguesData, seasonsData] = await Promise.all([
          getLeagues(),
          getSeasons()
        ]);

        const validLeagues = leaguesData.filter(league => 
          league && league.id && league.name && league.country
        );
        
        setLeagues(validLeagues);
        setSeasons(seasonsData);

        const currentSeason = seasonsData.find(season => season.current);
        if (currentSeason) {
          setSelectedSeason(currentSeason.year);
        }
      } catch (error) {
        console.error('Error fetching competitions data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchLeagueData = async () => {
      if (!selectedLeague || !selectedSeason) return;

      setLoading(true);
      try {
        const [standingsData, teamsData, matchesData] = await Promise.all([
          getLeagueStandings(selectedLeague.id, selectedSeason),
          getTeams(selectedLeague.id, selectedSeason),
          getMatches(format(new Date(), 'yyyy-MM-dd'))
        ]);

        setStandings(standingsData);
        setTeams(teamsData);
        setMatches(matchesData.filter(match => match.league.id === selectedLeague.id));
      } catch (error) {
        console.error('Error fetching league data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, [selectedLeague, selectedSeason]);

  const filteredLeagues = leagues.filter(league => {
    const matchesSearch = league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         league.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = !countryFilter || league.country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une compétition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex space-x-4">
            <div className="relative">
              <select
                value={countryFilter || ''}
                onChange={(e) => setCountryFilter(e.target.value || null)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les pays</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            {selectedLeague && (
              <select
                value={selectedSeason || ''}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {seasons.map(season => (
                  <option key={season.year} value={season.year}>
                    {season.year}{season.current ? ' (En cours)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* League Grid */}
      {!selectedLeague ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLeagues.map(league => (
            <button
              key={league.id}
              onClick={() => setSelectedLeague(league)}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-start space-x-4">
                <img
                  src={league.logo}
                  alt={league.name}
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <h3 className="font-medium text-gray-900">{league.name}</h3>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Flag className="w-4 h-4 mr-1" />
                    {league.country}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* League Header */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedLeague.logo}
                  alt={selectedLeague.name}
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedLeague.name}</h2>
                  <div className="flex items-center mt-1 text-gray-500">
                    <Flag className="w-5 h-5 mr-2" />
                    {selectedLeague.country}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeague(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Retour aux compétitions
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mt-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Aperçu
              </button>
              <button
                onClick={() => setActiveTab('standings')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'standings'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Classement
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'teams'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Équipes
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'matches'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Matchs
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm">
              {activeTab === 'overview' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Équipes</h3>
                      <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Matchs joués</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {matches.filter(m => m.fixture.status.short === 'FT').length}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Matchs à venir</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {matches.filter(m => m.fixture.status.short === 'NS').length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'standings' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Équipe</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MJ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">G</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BP</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BC</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {standings[0]?.map((standing: any) => (
                        <tr key={standing.team.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {standing.rank}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={standing.team.logo}
                                alt={standing.team.name}
                                className="w-6 h-6 object-contain mr-2"
                              />
                              <span className="text-sm font-medium text-gray-900">
                                {standing.team.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {standing.all.played}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {standing.all.win}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {standing.all.draw}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {standing.all.lose}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {standing.all.goals.for}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {standing.all.goals.against}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {standing.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'teams' && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {teams.map(team => (
                    <div key={team.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-10 h-10 object-contain"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{team.name}</h3>
                          <p className="text-sm text-gray-500">Fondé en {team.founded}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'matches' && (
                <div className="p-6 space-y-4">
                  {matches.length > 0 ? (
                    matches.map(match => (
                      <div
                        key={match.fixture.id}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500">
                              {format(new Date(match.fixture.date), 'dd/MM/yyyy HH:mm')}
                            </div>
                            <div className="flex items-center space-x-3">
                              <img
                                src={match.teams.home.logo}
                                alt={match.teams.home.name}
                                className="w-6 h-6 object-contain"
                              />
                              <span className="font-medium">{match.teams.home.name}</span>
                            </div>
                            <div className="font-bold">
                              {match.goals.home ?? '-'} - {match.goals.away ?? '-'}
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="font-medium">{match.teams.away.name}</span>
                              <img
                                src={match.teams.away.logo}
                                alt={match.teams.away.name}
                                className="w-6 h-6 object-contain"
                              />
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {match.fixture.venue.name}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Aucun match disponible
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};