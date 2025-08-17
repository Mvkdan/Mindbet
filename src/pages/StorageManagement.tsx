import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StorageNavigator } from '../components/storage/StorageNavigator';
import { DataPreview } from '../components/storage/DataPreview';
import { ImportDialog } from '../components/storage/ImportDialog';
import { HistoricalDataImporter } from '../components/storage/HistoricalDataImporter';
import { DataValidation } from '../components/storage/DataValidation';
import { LoadingState } from '../components/LoadingState';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Database, AlertCircle, Import, RefreshCw } from 'lucide-react';

export const StorageManagement: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [hasTables, setHasTables] = useState<boolean | null>(null);

  useEffect(() => {
    checkDatabaseState();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData();
      fetchTableMetadata();
    }
  }, [selectedTable]);

  const checkDatabaseState = async () => {
    setLoading(true);
    try {
      // Vérifier s'il y a des tables avec des données
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_database_structure');

      if (tablesError) throw tablesError;

      const hasData = tables && tables.some(table => table.row_count > 0);
      setHasTables(hasData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async () => {
    if (!selectedTable) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(selectedTable)
        .select('*')
        .limit(100);

      if (error) throw error;
      setTableData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableMetadata = async () => {
    if (!selectedTable) return;

    try {
      // Récupérer les informations sur les colonnes
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: selectedTable });

      if (columnsError) throw columnsError;

      // Récupérer les statistiques de la table
      const { data: stats, error: statsError } = await supabase
        .rpc('get_table_stats', { table_name: selectedTable });

      if (statsError) throw statsError;

      setMetadata({
        name: selectedTable,
        columns,
        ...stats[0]
      });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    if (!selectedTable) return;

    try {
      const { data, error } = await supabase
        .from(selectedTable)
        .select('*');

      if (error) throw error;

      if (format === 'csv') {
        // Convertir en CSV
        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(','),
          ...data.map(row =>
            headers.map(header => JSON.stringify(row[header])).join(',')
          )
        ].join('\n');

        // Télécharger
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${selectedTable}_export.csv`;
        link.click();
      } else {
        // Télécharger en JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json'
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${selectedTable}_export.json`;
        link.click();
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleImport = async (file: File) => {
    if (!selectedTable) return;

    try {
      let data;

      if (file.type === 'text/csv') {
        // Parser le CSV
        const text = await file.text();
        const rows = text.split('\n');
        const headers = rows[0].split(',');
        data = rows.slice(1).map(row => {
          const values = row.split(',');
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
          }, {});
        });
      } else if (file.type === 'application/json') {
        // Parser le JSON
        const text = await file.text();
        data = JSON.parse(text);
      } else {
        throw new Error('Format de fichier non supporté');
      }

      // Insérer les données
      const { error } = await supabase
        .from(selectedTable)
        .upsert(data);

      if (error) throw error;

      // Rafraîchir les données
      await fetchTableData();
      await checkDatabaseState();
    } catch (error) {
      throw new Error(`Erreur lors de l'importation : ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingState message="Vérification de la base de données..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Une erreur est survenue
              </h2>
              <p className="text-gray-500">{error}</p>
              <Button
                onClick={checkDatabaseState}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Réessayer</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasTables === false) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Database className="w-12 h-12 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900">
                Base de données vide
              </h2>
              <p className="text-gray-500">
                La base de données ne contient aucune donnée. Vous pouvez importer des données ou attendre la prochaine synchronisation.
              </p>
              <div className="flex space-x-4">
                <Button
                  onClick={() => setShowImport(true)}
                  className="flex items-center space-x-2"
                >
                  <Import className="w-4 h-4" />
                  <span>Importer des données</span>
                </Button>
                <Button
                  onClick={checkDatabaseState}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Actualiser</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Navigation */}
      <div className="w-64 border-r">
        <StorageNavigator onSelectTable={setSelectedTable} />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HistoricalDataImporter />
          <DataValidation />
        </div>

        {loading ? (
          <LoadingState message="Chargement des données..." />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Une erreur est survenue</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        ) : selectedTable && metadata ? (
          <DataPreview
            tableName={selectedTable}
            data={tableData}
            metadata={metadata}
            loading={loading}
            error={error}
            onRefresh={fetchTableData}
            onExport={handleExport}
          />
        ) : (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Sélectionnez une table
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Choisissez une table dans l'arborescence pour voir son contenu
            </p>
          </div>
        )}
      </div>

      {/* Dialog d'importation */}
      {showImport && selectedTable && (
        <ImportDialog
          tableName={selectedTable}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
};