import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  TrendingUp,
  Users,
  Trophy,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { LoadingState } from '../components/LoadingState';
import { TeamStatistics, League, Team } from '../types';
import { supabaseWithRetry } from '../lib/supabase';
import { api } from '../lib/api';

interface StatisticsFilters {
  league: string;
  team: string;
  dateRange: 'week' | 'month' | 'season';
}

export function Statistics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<TeamStatistics[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filters, setFilters] = useState<StatisticsFilters>({
    league: '',
    team: '',
    dateRange: 'season'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (filters.league) {
      fetchTeams(filters.league);
    }
  }, [filters.league]);

  useEffect(() => {
    if (filters.team) {
      fetchStatistics();
    }
  }, [filters.team, filters.dateRange]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const leagues = await supabaseWithRetry.query<League[]>(() =>
        supabase.from('leagues').select('*').order('name')
      );
      setLeagues(leagues);
    } catch (error) {
      setError('Erreur lors du chargement des ligues');
      console.error('Error fetching leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async (leagueId: string) => {
    try {
      setLoading(true);
      const teams = await supabaseWithRetry.query<Team[]>(() =>
        supabase
          .from('teams')
          .select('*')
          .eq('league_id', leagueId)
          .order('name')
      );
      setTeams(teams);
    } catch (error) {
      setError('Erreur lors du chargement des équipes');
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const currentSeason = new Date().getFullYear();
      const stats = await api.teams.getStatistics(
        parseInt(filters.team),
        parseInt(filters.league),
        currentSeason
      );
      setStatistics([stats]);
    } catch (error) {
      setError('Erreur lors du chargement des statistiques');
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatistics();
    setRefreshing(false);
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!statistics.length) return;

    const data = statistics.map(stat => ({
      team: stat.team.name,
      league: stat.league.name,
      matches_played: stat.fixtures.played.total,
      wins: stat.fixtures.wins.total,
      draws: stat.fixtures.draws.total,
      losses: stat.fixtures.loses.total,
      goals_for: stat.goals.for.total.total,
      goals_against: stat.goals.against.total.total,
      clean_sheets: stat.clean_sheets.total,
      failed_to_score: stat.failed_to_score.total
    }));

    if (format === 'csv') {
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map(row => headers.map(header => row[header]).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `statistics_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `statistics_${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
    }
  };

  if (loading) {
    return <LoadingState message="Chargement des statistiques..." />;
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
          <Button
            onClick={fetchInitialData}
            variant="outline"
            className="mt-4"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold flex items-center">
            <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
            Statistiques
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>JSON</span>
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              value={filters.league}
              onChange={(e) => setFilters({ ...filters, league: e.target.value })}
              icon={<Trophy className="w-4 h-4" />}
            >
              <option value="">Toutes les compétitions</option>
              {leagues.map(league => (
                <option key={league.id} value={league.id}>{league.name}</option>
              ))}
            </Select>
            <Select
              value={filters.team}
              onChange={(e) => setFilters({ ...filters, team: e.target.value })}
              icon={<Users className="w-4 h-4" />}
              disabled={!filters.league}
            >
              <option value="">Toutes les équipes</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </Select>
            <Select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as 'week' | 'month' | 'season' })}
              icon={<Calendar className="w-4 h-4" />}
            >
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
              <option value="season">Saison entière</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      {statistics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Matchs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Joués</span>
                  <span className="font-medium">{statistics[0].fixtures.played.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Victoires</span>
                  <span className="font-medium text-green-600">{statistics[0].fixtures.wins.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nuls</span>
                  <span className="font-medium text-yellow-600">{statistics[0].fixtures.draws.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Défaites</span>
                  <span className="font-medium text-red-600">{statistics[0].fixtures.loses.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Buts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Marqués</span>
                  <span className="font-medium text-green-600">{statistics[0].goals.for.total.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Encaissés</span>
                  <span className="font-medium text-red-600">{statistics[0].goals.against.total.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Différence</span>
                  <span className={`font-medium ${
                    statistics[0].goals.for.total.total - statistics[0].goals.against.total.total > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {statistics[0].goals.for.total.total - statistics[0].goals.against.total.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Moyenne par match</span>
                  <span className="font-medium">
                    {(statistics[0].goals.for.total.total / statistics[0].fixtures.played.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clean Sheets & Failed to Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Clean sheets</span>
                  <span className="font-medium text-green-600">{statistics[0].clean_sheets.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sans marquer</span>
                  <span className="font-medium text-red-600">{statistics[0].failed_to_score.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">% Clean sheets</span>
                  <span className="font-medium">
                    {((statistics[0].clean_sheets.total / statistics[0].fixtures.played.total) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">% Sans marquer</span>
                  <span className="font-medium">
                    {((statistics[0].failed_to_score.total / statistics[0].fixtures.played.total) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune statistique disponible
              </h3>
              <p className="text-gray-500">
                Sélectionnez une équipe pour voir ses statistiques
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}