import React from 'react';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface AutoRefreshIndicatorProps {
  isRefreshing: boolean;
  lastUpdate: Date | null;
  onManualRefresh: () => void;
}

export const AutoRefreshIndicator: React.FC<AutoRefreshIndicatorProps> = ({
  isRefreshing,
  lastUpdate,
  onManualRefresh
}) => {
  return (
    <div className="flex items-center space-x-4 text-sm">
      <button
        onClick={onManualRefresh}
        disabled={isRefreshing}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
          isRefreshing
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>{isRefreshing ? 'Actualisation...' : 'Actualiser'}</span>
      </button>

      {lastUpdate && (
        <span className="text-gray-500">
          Dernière mise à jour : {format(lastUpdate, 'HH:mm:ss')}
        </span>
      )}
    </div>
  );
};