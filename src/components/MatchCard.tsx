import React from 'react';
import { format } from 'date-fns';
import { MapPin, Info, Sparkles } from 'lucide-react';
import type { Match } from '../types';

interface MatchCardProps {
  match: Match;
  onViewDetails: (match: Match) => void;
  onPredictClick: (match: Match) => void;
}

export function MatchCard({ match, onViewDetails, onPredictClick }: MatchCardProps) {
  const isLive = match.fixture.status.short === 'LIVE';
  const isFinished = match.fixture.status.short === 'FT';

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
      {/* En-tête */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={match.league.logo}
              alt={match.league.name}
              className="w-6 h-6 object-contain"
            />
            <span className="text-sm font-medium text-gray-600">
              {match.league.name}
            </span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
            isLive ? 'bg-red-100 text-red-800' :
            isFinished ? 'bg-gray-100 text-gray-800' :
            'bg-green-100 text-green-800'
          }`}>
            {isLive ? `${match.fixture.status.elapsed}'` :
             isFinished ? 'Terminé' :
             format(new Date(match.fixture.date), 'HH:mm')}
          </div>
        </div>
      </div>

      {/* Score et équipes */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            <img
              src={match.teams.home.logo}
              alt={match.teams.home.name}
              className="w-8 h-8 object-contain"
            />
            <span className="font-medium">{match.teams.home.name}</span>
          </div>
          <div className="px-4 py-2 bg-gray-50 rounded-lg">
            <span className="text-2xl font-bold">
              {match.goals.home ?? '-'}
            </span>
            <span className="text-2xl font-bold mx-2">-</span>
            <span className="text-2xl font-bold">
              {match.goals.away ?? '-'}
            </span>
          </div>
          <div className="flex items-center space-x-3 flex-1 justify-end">
            <span className="font-medium">{match.teams.away.name}</span>
            <img
              src={match.teams.away.logo}
              alt={match.teams.away.name}
              className="w-8 h-8 object-contain"
            />
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4" />
              <span>{match.fixture.venue.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPredictClick(match)}
                className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Prédire</span>
              </button>
              <button
                onClick={() => onViewDetails(match)}
                className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Info className="w-4 h-4" />
                <span>Détails</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}