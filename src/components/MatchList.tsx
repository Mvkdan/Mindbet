import React from 'react';
import { MatchCard } from './MatchCard';
import type { Match } from '../types';

interface MatchListProps {
  matches: Match[];
  onMatchClick: (match: Match) => void;
}

export function MatchList({ matches, onMatchClick }: MatchListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {matches.map((match) => (
        <MatchCard 
          key={match.fixture.id} 
          match={match} 
          onViewDetails={onMatchClick}
        />
      ))}
    </div>
  );
}