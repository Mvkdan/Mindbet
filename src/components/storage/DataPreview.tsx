import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Info,
  Download,
  Loader2,
  Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
  isForeign: boolean;
  references?: {
    table: string;
    column: string;
  };
}

interface TableMetadata {
  name: string;
  columns: Column[];
  rowCount: number;
  size: string;
  lastUpdated: Date;
}

interface DataPreviewProps {
  tableName: string;
  data: any[];
  metadata: TableMetadata;
  loading: boolean;
  error?: string;
  onRefresh: () => void;
  onExport: (format: 'csv' | 'json') => void;
}

export const DataPreview: React.FC<DataPreviewProps> = ({
  tableName,
  data,
  metadata,
  loading,
  error,
  onRefresh,
  onExport
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredData = data.filter(row => {
    if (!filterColumn || !filterValue) return true;
    const value = row[filterColumn];
    return value?.toString().toLowerCase().includes(filterValue.toLowerCase());
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    if (aVal === bVal) return 0;
    const result = aVal > bVal ? 1 : -1;
    return sortDirection === 'asc' ? result : -result;
  });

  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(sortedData.length / pageSize);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Table className="w-5 h-5 text-blue-500" />
            <div>
              <CardTitle className="text-lg">{tableName}</CardTitle>
              <p className="text-sm text-gray-500">
                {metadata.rowCount.toLocaleString()} enregistrements
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => onExport('csv')}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => onExport('json')}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>JSON</span>
            </Button>
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUpDown className="w-4 h-4" />
              )}
              <span>Actualiser</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        {/* Filtres */}
        <div className="mb-4 flex space-x-4">
          <Select
            value={filterColumn}
            onChange={(e) => setFilterColumn(e.target.value)}
            className="w-48"
          >
            <option value="">Filtrer par colonne...</option>
            {metadata.columns.map(column => (
              <option key={column.name} value={column.name}>
                {column.name}
              </option>
            ))}
          </Select>
          <Input
            type="text"
            placeholder="Valeur du filtre..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="w-64"
          />
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {metadata.columns.map(column => (
                  <th
                    key={column.name}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(column.name)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.name}</span>
                      {column.isPrimary && (
                        <Badge variant="secondary" className="text-xs">
                          PK
                        </Badge>
                      )}
                      {column.isForeign && (
                        <Badge variant="secondary" className="text-xs">
                          FK
                        </Badge>
                      )}
                      {sortColumn === column.name && (
                        <ArrowUpDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {metadata.columns.map(column => (
                    <td key={column.name} className="px-6 py-4 whitespace-nowrap text-sm">
                      {row[column.name]?.toString() || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Select
              value={pageSize.toString()}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-20"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
            <span className="text-sm text-gray-500">
              lignes par page
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} sur {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Métadonnées */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div>
              <Info className="w-4 h-4 inline-block mr-1" />
              Taille : {metadata.size}
            </div>
            <div>
              <Clock className="w-4 h-4 inline-block mr-1" />
              Dernière mise à jour : {format(metadata.lastUpdated, 'dd/MM/yyyy HH:mm')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};