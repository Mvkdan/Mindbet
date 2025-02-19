import React from 'react';
import { Season } from '../types';

interface SeasonSelectorProps {
  seasons: Season[];
  selectedSeason?: number;
  onSelect: (season: number) => void;
}

export const SeasonSelector: React.FC<SeasonSelectorProps> = ({
  seasons,
  selectedSeason,
  onSelect,
}) => {
  return (
    <div className="flex space-x-2 overflow-x-auto pb-2">
      {seasons.filter(season => season?.year).map((season) => (
        <button
          key={`season-${season.year}`}
          onClick={() => onSelect(season.year)}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            selectedSeason === season.year
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          } ${season.current ? 'font-bold' : ''}`}
        >
          {season.year}
          {season.current && ' (Current)'}
        </button>
      ))}
    </div>
  );
};