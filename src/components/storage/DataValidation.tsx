import React, { useState, useEffect } from 'react';
import { getStagedLeagues, validateLeague } from '../../storage/services/historical';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, CheckCircle, ShieldQuestion } from 'lucide-react';

interface StagedLeague {
  id: number;
  name: string;
  season: string;
  created_at: string;
}

export const DataValidation: React.FC = () => {
  const [stagedLeagues, setStagedLeagues] = useState<StagedLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState<number | null>(null);

  const fetchLeagues = async () => {
    setLoading(true);
    try {
      const leagues = await getStagedLeagues();
      setStagedLeagues(leagues);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeagues();
  }, []);

  const handleValidate = async (leagueId: number) => {
    setValidatingId(leagueId);
    try {
      await validateLeague(leagueId);
      // Refresh the list after validation
      await fetchLeagues();
    } catch (error) {
      console.error(error);
      // Handle error state in UI if needed
    } finally {
      setValidatingId(null);
    }
  };

  if (loading) {
    return <Loader2 className="animate-spin" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ShieldQuestion />
          <span>Data Validation</span>
        </CardTitle>
        <CardDescription>
          Review and approve imported data before it appears in the match history.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stagedLeagues.length === 0 ? (
          <p className="text-gray-500">No data is currently awaiting validation.</p>
        ) : (
          stagedLeagues.map(league => (
            <div key={league.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">{league.name}</p>
                <p className="text-sm text-gray-500">Season: {league.season} | Imported on: {new Date(league.created_at).toLocaleDateString()}</p>
              </div>
              <Button
                onClick={() => handleValidate(league.id)}
                disabled={validatingId === league.id}
                size="sm"
              >
                {validatingId === league.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span className="ml-2">Validate</span>
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
