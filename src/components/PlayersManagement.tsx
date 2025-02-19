import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  User, Flag, Trophy, Shirt, Search, Filter, Download,
  Plus, Edit, Trash2, FileText, Calendar, Star, Users,
  ChevronLeft, ChevronRight, Loader2, Database
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PlayerImportService } from '../services/playerImport';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LoadingState } from './LoadingState';
import type { Player, Team, League } from '../types';

interface PlayersManagementProps {
  isAdmin?: boolean;
}

export const PlayersManagement: React.FC<PlayersManagementProps> = ({ isAdmin = false }) => {
  // ... (garder le code existant jusqu'à la déclaration des états)

  // Ajouter ces nouveaux états pour l'importation
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    total: number;
    current: number;
    success: number;
    failed: number;
  }>({
    total: 0,
    current: 0,
    success: 0,
    failed: 0
  });

  // ... (garder le code existant des fonctions fetchData, handleSubmit, etc.)

  // Ajouter cette nouvelle fonction pour gérer l'importation
  const handleImport = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir lancer l\'importation des joueurs ? Cette opération peut prendre plusieurs minutes.')) {
      return;
    }

    setImporting(true);
    try {
      const importService = new PlayerImportService({
        onProgress: (progress) => {
          setImportProgress({
            total: progress.total,
            current: progress.current,
            success: progress.success,
            failed: progress.failed
          });
        }
      });

      await importService.importPlayers();
      await fetchData(); // Rafraîchir la liste après l'import
    } catch (error) {
      console.error('Error importing players:', error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des joueurs</h1>
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
                  setIsEditing(false);
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

      {/* Afficher la progression de l'importation si elle est en cours */}
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

      {/* Garder le reste du code existant... */}
    </div>
  );
};