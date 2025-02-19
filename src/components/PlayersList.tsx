import React from 'react';
import { format } from 'date-fns';
import { User, Flag, Trophy, Shirt } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { LoadingState } from './LoadingState';
import type { Player } from '../types';

interface PlayersListProps {
  players: Player[];
  loading: boolean;
  searchTerm: string;
  selectedLeague: string;
  selectedCountry: string;
}

export const PlayersList: React.FC<PlayersListProps> = ({
  players,
  loading,
  searchTerm,
  selectedLeague,
  selectedCountry
}) => {
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = !selectedLeague || player.league?.id.toString() === selectedLeague;
    const matchesCountry = !selectedCountry || player.league?.country === selectedCountry;
    
    return matchesSearch && matchesLeague && matchesCountry;
  });

  if (loading) {
    return <LoadingState message="Chargement des joueurs..." />;
  }

  if (filteredPlayers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun joueur ne correspond à vos critères</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredPlayers.map(player => (
        <Card key={player.id}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              {player.photo ? (
                <img
                  src={player.photo}
                  alt={player.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg">{player.name}</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Flag className="w-4 h-4 mr-2" />
                    {player.nationality}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Trophy className="w-4 h-4 mr-2" />
                    {player.league?.name}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Shirt className="w-4 h-4 mr-2" />
                    {player.team?.name}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}