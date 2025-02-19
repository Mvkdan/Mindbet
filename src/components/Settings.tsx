import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { importHistoricalData } from '../services/dataImport';

export const Settings: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({
    step: '',
    total: 0,
    current: 0,
    completed: {
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
    }
  });
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir lancer l\'importation des données ? Cette opération peut prendre plusieurs minutes.')) {
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();
      await importHistoricalData(
        (progress) => {
          setImportProgress(progress);
        },
        currentYear
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-3 mb-6">
        <SettingsIcon className="w-6 h-6 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
      </div>

      {/* Paramètres d'affichage */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Préférences d'affichage</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Actualisation automatique</label>
                <p className="text-sm text-gray-500">Les matchs en direct seront actualisés toutes les 30 secondes</p>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-green-600 font-medium">Activé</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Format de l'heure</label>
                <p className="text-sm text-gray-500">Format d'affichage des heures de match</p>
              </div>
              <select className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="24">24h</option>
                <option value="12">12h</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Fuseau horaire</label>
                <p className="text-sm text-gray-500">Les heures seront affichées dans ce fuseau</p>
              </div>
              <select className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="local">Heure locale</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Importation des données */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Database className="w-5 h-5 text-blue-500 mr-2" />
                Importation des données
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Importer les données depuis l'API Football
              </p>
            </div>
            <Button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center space-x-2"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importation en cours...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Lancer l'importation</span>
                </>
              )}
            </Button>
          </div>

          {importing && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{importProgress.step}</span>
                <span className="font-medium">
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(importProgress.current / Math.max(importProgress.total, 1)) * 100}%`
                  }}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">{importProgress.completed.leagues}</span> ligues
                </div>
                <div>
                  <span className="font-medium">{importProgress.completed.teams}</span> équipes
                </div>
                <div>
                  <span className="font-medium">{importProgress.completed.players}</span> joueurs
                </div>
                <div>
                  <span className="font-medium">{importProgress.completed.matches}</span> matchs
                </div>
                <div>
                  <span className="font-medium">{importProgress.completed.statistics}</span> statistiques
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              <p className="font-medium">Une erreur est survenue</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};