import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, DollarSign } from 'lucide-react';
import { getOdds } from '../api';
import { logger } from '../lib/logger';
import { LoadingState } from './LoadingState';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import type { Match, Odds as OddsType } from '../types';

export default function Odds() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<(Match & { odds?: OddsType[] })[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchOdds = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOdds();
      if (Array.isArray(data)) {
        const validMatches = data.filter(match => 
          match && 
          match.fixture && 
          match.teams?.home && 
          match.teams?.away
        );
        setMatches(validMatches);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      logger.error('Odds', 'Error fetching odds:', error);
      setError('Impossible de charger les cotes. Veuillez réessayer plus tard.');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const {
    isRefreshing,
    lastUpdate,
    error: refreshError,
    enabled,
    refresh,
    setEnabled
  } = useAutoRefresh({
    interval: 300000, // 5 minutes
    enabled: true,
    onRefresh: async () => {
      logger.info('Odds', 'Auto-refresh triggered');
      await fetchOdds();
    },
    onError: (error) => {
      setError('Erreur lors de l\'actualisation des cotes');
      logger.error('Odds', 'Auto-refresh error', error);
    }
  });

  useEffect(() => {
    fetchOdds();
  }, []);

  if (loading) {
    return <LoadingState message="Chargement des cotes..." />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Une erreur est survenue</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Aucune cote disponible pour le moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cotes en direct</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setEnabled(!enabled)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              enabled
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {enabled ? 'Actualisation auto activée' : 'Actualisation auto désactivée'}
          </button>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {matches.map((match) => {
          if (!match?.teams?.home || !match?.teams?.away) return null;
          
          return (
            <div key={match.fixture.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {match.league?.logo && (
                    <img
                      src={match.league.logo}
                      alt={match.league.name}
                      className="w-6 h-6 object-contain"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-600">
                    {match.league?.name}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {format(new Date(match.fixture.date), 'EEEE d MMMM - HH:mm', {
                    locale: fr,
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {match.teams.home.logo && (
                    <img
                      src={match.teams.home.logo}
                      alt={match.teams.home.name}
                      className="w-8 h-8 object-contain"
                    />
                  )}
                  <span className="font-medium">{match.teams.home.name}</span>
                </div>
                <span className="text-sm">vs</span>
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{match.teams.away.name}</span>
                  {match.teams.away.logo && (
                    <img
                      src={match.teams.away.logo}
                      alt={match.teams.away.name}
                      className="w-8 h-8 object-contain"
                    />
                  )}
                </div>
              </div>

              {match.odds && match.odds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {match.odds.map((bookmaker) => (
                    <div
                      key={bookmaker.id}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {bookmaker.name}
                        </span>
                        <DollarSign className="w-4 h-4 text-green-500" />
                      </div>
                      {bookmaker.bets?.[0]?.values && (
                        <div className="grid grid-cols-3 gap-2">
                          {bookmaker.bets[0].values.map((value) => (
                            <div
                              key={value.value}
                              className="bg-white rounded border border-gray-200 p-2 text-center"
                            >
                              <div className="text-xs text-gray-500 mb-1">
                                {value.value}
                              </div>
                              <div className="font-bold text-green-600">
                                {value.odd}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Aucune cote disponible pour ce match
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lastUpdate && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Dernière mise à jour : {format(lastUpdate, 'HH:mm:ss')}
        </p>
      )}
    </div>
  );
}

export { Odds }