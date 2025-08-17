import React, { useState } from 'react';
import { Activity, RefreshCw, Search, Filter } from 'lucide-react';
import { useLiveMatches } from '../hooks/useLiveMatches';
import { useMatchAutoSave } from '../hooks/useMatchAutoSave';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { MatchCard } from '../components/MatchCard';
import { PredictionModal } from '../components/PredictionModal';
import type { Match } from '../types';

export function LiveMatches() {
  const { data: matches = [], isLoading, error, refresh } = useLiveMatches();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedMatchForPrediction, setSelectedMatchForPrediction] = useState<Match | null>(null);

  // Activer la sauvegarde automatique des matchs terminés
  useMatchAutoSave(matches);

  // Get unique leagues
  const leagues = Array.from(new Set(matches.map(match => match.league.name))).sort();

  // Filter matches
  const filteredMatches = matches.filter(match => {
    const matchesSearch = 
      match.teams.home.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.teams.away.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.league.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLeague = !selectedLeague || match.league.name === selectedLeague;
    
    return matchesSearch && matchesLeague;
  });

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <div className="text-red-700">
            <p className="font-medium">Une erreur est survenue</p>
            <p className="mt-1 text-sm">{error.message}</p>
            <Button
              onClick={() => refresh()}
              variant="outline"
              className="mt-4"
            >
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold flex items-center">
            <Activity className="w-6 h-6 text-red-500 mr-2" />
            Matchs en direct
          </h1>
          {!isLoading && (
            <Badge variant="secondary" className="text-sm">
              {filteredMatches.length} match{filteredMatches.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <Button
          onClick={() => refresh()}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualiser</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Rechercher une équipe, une compétition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                icon={<Filter className="w-4 h-4" />}
              >
                <option value="">Toutes les compétitions</option>
                {leagues.map(league => (
                  <option key={league} value={league}>
                    {league}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.fixture.id}
              match={match}
              onViewDetails={(m) => console.log('View details for', m.fixture.id)}
              onPredictClick={(m) => setSelectedMatchForPrediction(m)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-gray-500">
                {searchTerm || selectedLeague
                  ? 'Aucun match ne correspond à vos critères'
                  : 'Aucun match en direct pour le moment'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedMatchForPrediction && (
        <PredictionModal
          match={selectedMatchForPrediction}
          onClose={() => setSelectedMatchForPrediction(null)}
        />
      )}
    </div>
  );
}