import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  User, Flag, Trophy, Shirt, Search, Filter, Download,
  Plus, Edit, Trash2, FileText, Calendar, Star, Users,
  ChevronLeft, ChevronRight, Loader2, Database, SortAsc,
  SortDesc, Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PlayerImportService } from '../services/playerImport';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingState } from '../components/LoadingState';
import type { Player, Team, League } from '../types';

interface PlayersPageProps {
  isAdmin?: boolean;
}

export const PlayersPage: React.FC<PlayersPageProps> = ({ isAdmin = false }) => {
  // États pour les données
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // États pour les filtres et le tri
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedNationality, setSelectedNationality] = useState<string>('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // États pour l'importation
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({
    total: 0,
    current: 0,
    success: 0,
    failed: 0
  });

  // États pour le formulaire
  const [showForm, setShowForm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    firstname: '',
    lastname: '',
    nationality: '',
    birthdate: '',
    height: '',
    weight: '',
    position: '',
    team_id: '',
    league_id: ''
  });

  // Positions disponibles
  const positions = [
    { value: 'G', label: 'Gardien' },
    { value: 'D', label: 'Défenseur' },
    { value: 'M', label: 'Milieu' },
    { value: 'A', label: 'Attaquant' }
  ];

  // Chargement initial des données
  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, sortField, sortOrder]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Construire la requête de base
      let query = supabase
        .from('players')
        .select(`
          *,
          team:teams(*),
          league:leagues(*)
        `)
        .order(sortField, { ascending: sortOrder === 'asc' });

      // Appliquer les filtres
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,firstname.ilike.%${searchTerm}%,lastname.ilike.%${searchTerm}%`);
      }
      if (selectedLeague) {
        query = query.eq('league_id', selectedLeague);
      }
      if (selectedTeam) {
        query = query.eq('team_id', selectedTeam);
      }
      if (selectedPosition) {
        query = query.eq('position', selectedPosition);
      }
      if (selectedNationality) {
        query = query.eq('nationality', selectedNationality);
      }

      // Pagination
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize - 1;
      query = query.range(start, end);

      const { data: playersData, error: playersError, count } = await query;

      if (playersError) throw playersError;

      // Charger les équipes et les ligues pour les filtres
      const [teamsResponse, leaguesResponse] = await Promise.all([
        supabase.from('teams').select('*').order('name'),
        supabase.from('leagues').select('*').order('name')
      ]);

      if (teamsResponse.error) throw teamsResponse.error;
      if (leaguesResponse.error) throw leaguesResponse.error;

      setPlayers(playersData || []);
      setTeams(teamsResponse.data || []);
      setLeagues(leaguesResponse.data || []);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir lancer l\'importation des joueurs ? Cette opération peut prendre plusieurs minutes.')) {
      return;
    }

    setImporting(true);
    try {
      const importService = new PlayerImportService({
        onProgress: (progress) => {
          setImportProgress(progress);
        }
      });

      await importService.importPlayers();
      await fetchData();
    } catch (error) {
      setError('Erreur lors de l\'importation : ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(name),
          league:leagues(name)
        `);

      if (error) throw error;

      if (format === 'csv') {
        // Convertir en CSV
        const headers = ['ID', 'Nom', 'Prénom', 'Équipe', 'Ligue', 'Position', 'Nationalité', 'Date de naissance'];
        const csvContent = [
          headers.join(','),
          ...data.map(player => [
            player.id,
            player.name,
            player.firstname,
            player.team?.name,
            player.league?.name,
            player.position,
            player.nationality,
            player.birthdate
          ].join(','))
        ].join('\n');

        // Télécharger le fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `players_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
      } else {
        // Télécharger en JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `players_export_${format(new Date(), 'yyyy-MM-dd')}.json`;
        link.click();
      }
    } catch (error) {
      setError('Erreur lors de l\'export : ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('players')
        .upsert({
          id: selectedPlayer?.id,
          ...formData
        })
        .select()
        .single();

      if (error) throw error;

      setShowForm(false);
      setSelectedPlayer(null);
      setFormData({
        name: '',
        firstname: '',
        lastname: '',
        nationality: '',
        birthdate: '',
        height: '',
        weight: '',
        position: '',
        team_id: '',
        league_id: ''
      });
      await fetchData();
    } catch (error) {
      setError('Erreur lors de la sauvegarde : ' + error.message);
    }
  };

  const handleDelete = async (playerId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce joueur ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;

      await fetchData();
    } catch (error) {
      setError('Erreur lors de la suppression : ' + error.message);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-500" />
          <span>Gestion des joueurs</span>
        </h1>
        <div className="flex items-center space-x-4">
          {isAdmin && (
            <>
              <Button
                onClick={handleImport}
                disabled={importing}
                variant="outline"
                className="flex items-center space-x-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importation en cours...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Importer les joueurs</span>
                  </>
                )}
              </Button>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleExport('csv')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV</span>
                </Button>
                <Button
                  onClick={() => handleExport('json')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>JSON</span>
                </Button>
              </div>
              <Button
                onClick={() => {
                  setShowForm(true);
                  setSelectedPlayer(null);
                }}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un joueur</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Barre de progression de l'importation */}
      {importing && (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Importation des joueurs</span>
                </div>
                <Badge variant="secondary">
                  {Math.round((importProgress.current / Math.max(importProgress.total, 1)) * 100)}%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(importProgress.current / Math.max(importProgress.total, 1)) * 100}%`
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">{importProgress.current}</span> joueurs traités
                </div>
                <div>
                  <span className="font-medium text-green-600">{importProgress.success}</span> succès
                </div>
                <div>
                  <span className="font-medium text-red-600">{importProgress.failed}</span> échecs
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                type="text"
                placeholder="Rechercher un joueur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              icon={<Trophy className="w-4 h-4" />}
            >
              <option value="">Toutes les compétitions</option>
              {leagues.map(league => (
                <option key={league.id} value={league.id}>{league.name}</option>
              ))}
            </Select>
            <Select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              icon={<Shirt className="w-4 h-4" />}
            >
              <option value="">Toutes les équipes</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </Select>
            <Select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              icon={<User className="w-4 h-4" />}
            >
              <option value="">Toutes les positions</option>
              {positions.map(pos => (
                <option key={pos.value} value={pos.value}>{pos.label}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des joueurs */}
      {loading ? (
        <LoadingState message="Chargement des joueurs..." />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Une erreur est survenue</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      ) : players.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun joueur trouvé</h3>
              <p className="text-gray-500">Modifiez vos critères de recherche ou importez des joueurs.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joueur
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Équipe
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nationalité
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Âge
                  </th>
                  {isAdmin && (
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {players.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {player.photo ? (
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{player.name}</div>
                          <div className="text-sm text-gray-500">
                            {player.firstname} {player.lastname}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {player.team?.logo && (
                          <img
                            src={player.team.logo}
                            alt={player.team?.name}
                            className="w-6 h-6 object-contain mr-2"
                          />
                        )}
                        <span className="text-sm text-gray-900">{player.team?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {positions.find(pos => pos.value === player.position)?.label || player.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Flag className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">{player.nationality}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.birthdate ? (
                        format(new Date(player.birthdate), 'dd/MM/yyyy')
                      ) : (
                        '-'
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedPlayer(player);
                            setFormData({
                              name: player.name,
                              firstname: player.firstname || '',
                              lastname: player.lastname || '',
                              nationality: player.nationality || '',
                              birthdate: player.birthdate || '',
                              height: player.height || '',
                              weight: player.weight || '',
                              position: player.position || '',
                              team_id: player.team_id?.toString() || '',
                              league_id: player.league_id?.toString() || ''
                            });
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(player.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                variant="outline"
              >
                Précédent
              </Button>
              <Button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
              >
                Suivant
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{' '}
                  à{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, players.length)}
                  </span>{' '}
                  sur{' '}
                  <span className="font-medium">{players.length}</span> joueurs
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Select
                  value={pageSize.toString()}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="w-20"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="rounded-l-md"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <ChevronLeft className="w-4 h-4 -ml-2" />
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {currentPage} sur {totalPages}
                  </div>
                  <Button
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="rounded-r-md"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <ChevronRight className="w-4 h-4 -ml-2" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout/modification */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedPlayer ? 'Modifier le joueur' : 'Ajouter un joueur'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Prénom
                  </label>
                  <Input
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom
                  </label>
                  <Input
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nationalité
                  </label>
                  <Input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date de naissance
                  </label>
                  <Input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Taille (cm)
                  </label>
                  <Input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Poids (kg)
                  </label>
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Position
                  </label>
                  <Select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="mt-1"
                  >
                    <option value="">Sélectionner une position</option>
                    {positions.map(pos => (
                      <option key={pos.value} value={pos.value}>{pos.label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Équipe
                  </label>
                  <Select
                    value={formData.team_id}
                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                    className="mt-1"
                  >
                    <option value="">Sélectionner une équipe</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {selectedPlayer ? 'Enregistrer' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayersPage;