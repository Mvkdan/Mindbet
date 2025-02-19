import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ImportDialogProps {
  tableName: string;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  tableName,
  onClose,
  onImport
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Vérifier le type de fichier
    const validTypes = [
      'text/csv',
      'application/json',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(file.type)) {
      setError('Type de fichier non supporté. Utilisez CSV, JSON ou XLSX.');
      return;
    }

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Le fichier est trop volumineux (max 10MB)');
      return;
    }

    setFile(file);
    setError(null);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    
    try {
      // Simuler une progression
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 90) {
            clearInterval(interval);
            return p;
          }
          return p + 10;
        });
      }, 500);

      await onImport(file);
      setProgress(100);
      
      // Fermer après 1 seconde
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      setError(error.message);
      setProgress(0);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            Importer des données - {tableName}
          </CardTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              dragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv,.json,.xlsx"
              onChange={handleFileSelect}
            />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Glissez-déposez un fichier ici ou
              <button
                type="button"
                className="text-blue-500 hover:text-blue-600 ml-1"
              >
                parcourez
              </button>
            </p>
            <p className="text-xs text-gray-500">
              Formats supportés : CSV, JSON, XLSX (max 10MB)
            </p>
          </div>

          {/* Fichier sélectionné */}
          {file && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {file.type.split('/')[1].toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-sm text-gray-500">
                    ({Math.round(file.size / 1024)} KB)
                  </span>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Barre de progression */}
          {importing && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Importation en cours...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={importing}
            >
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex items-center space-x-2"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importation...</span>
                </>
              ) : progress === 100 ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Terminé</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Importer</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};