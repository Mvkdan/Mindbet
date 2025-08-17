import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { History, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getHistoricalMatches } from '../storage/services/historical';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LoadingState } from '../components/LoadingState';

// Define the type for a historical match from the DB
interface HistoricalMatch {
  id: number;
  match_date: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
}

export function MatchHistory() {
  const [matches, setMatches] = useState<HistoricalMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError(null);
      try {
        const { matches: fetchedMatches, count } = await getHistoricalMatches(page, pageSize);
        setMatches(fetchedMatches);
        setTotalPages(Math.ceil(count / pageSize));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [page]);

  if (loading) {
    return <LoadingState message="Chargement de l'historique des matchs..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 text-red-700 rounded-lg">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-semibold">Erreur de chargement</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <History className="w-8 h-8 text-gray-600" />
        <h1 className="text-3xl font-bold">Historique des Matchs</h1>
      </div>

      {matches.length === 0 ? (
        <p>Aucun match historique trouvé. Veuillez en importer depuis la page de Stockage.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => (
              <Card key={match.id}>
                <CardHeader>
                  <CardTitle className="text-sm text-gray-500">
                    {format(new Date(match.match_date), 'd MMMM yyyy', { locale: fr })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="font-semibold">{match.home_team_name}</span>
                  <span className="text-xl font-bold">{match.home_score} - {match.away_score}</span>
                  <span className="font-semibold">{match.away_team_name}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-center space-x-4 mt-6">
            <Button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
            <span>Page {page} sur {totalPages}</span>
            <Button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}