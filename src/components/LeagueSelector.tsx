import React from 'react';
import { League } from '../types';

interface LeagueSelectorProps {
  leagues: League[];
  selectedLeague?: number;
  onSelect: (leagueId: number) => void;
}

export const LeagueSelector: React.FC<LeagueSelectorProps> = ({
  leagues,
  selectedLeague,
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {leagues.filter(league => league?.id).map((league) => (
        <button
          key={`league-${league.id}`}
          onClick={() => onSelect(league.id)}
          className={`flex flex-col items-center p-4 rounded-lg transition-all ${
            selectedLeague === league.id
              ? 'bg-blue-100 border-2 border-blue-500'
              : 'bg-white border-2 border-transparent hover:border-gray-200'
          }`}
        >
          <img
            src={league.logo}
            alt={league.name}
            className="w-12 h-12 object-contain mb-2"
          />
          <span className="text-sm font-medium text-center">{league.name}</span>
        </button>
      ))}
    </div>
  );
};