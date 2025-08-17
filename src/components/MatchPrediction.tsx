import React, { useState, useEffect } from 'react';
import { getTeamStatistics } from '../api';
import { calculatePrediction } from '../lib/prediction';
import { getHeadToHeadHistory } from '../storage/services/historical';
import { Loader2, TrendingUp, Percent, Trophy, Scale } from 'lucide-react';
import type { Match } from '../types';
import type { PredictionResult } from '../lib/prediction';

interface MatchPredictionProps {
  match: Match;
}

export const MatchPrediction: React.FC<MatchPredictionProps> = ({ match }) => {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrediction() {
      if (!match?.teams?.home?.id || !match?.teams?.away?.id || !match?.league?.id || !match?.league?.season) {
        setError('Match data is incomplete for prediction.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const homeStatsPromise = getTeamStatistics(match.teams.home.id, match.league.id, match.league.season);
        const awayStatsPromise = getTeamStatistics(match.teams.away.id, match.league.id, match.league.season);
        const h2hPromise = getHeadToHeadHistory(match.teams.home.name, match.teams.away.name);

        const [homeStats, awayStats, h2hMatches] = await Promise.all([
          homeStatsPromise,
          awayStatsPromise,
          h2hPromise,
        ]);

        if (!homeStats || !awayStats) {
          throw new Error('Could not fetch team statistics.');
        }

        const result = calculatePrediction(homeStats, awayStats, h2hMatches);
        setPrediction(result);
      } catch (err) {
        console.error('Error fetching prediction:', err);
        setError('Failed to generate prediction. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchPrediction();
  }, [match]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  if (!prediction || !match?.teams?.home || !match?.teams?.away) {
    return (
      <div className="p-4 bg-gray-50 text-gray-700 rounded-lg">
        <p>Unable to generate prediction at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-blue-500" />
        Match Prediction
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Percent className="w-5 h-5 text-green-500" />
              Win Probability
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>{match.teams.home.name}</span>
                <span className="font-bold">{prediction.winProbability.home}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{match.teams.away.name}</span>
                <span className="font-bold">{prediction.winProbability.away}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Draw</span>
                <span className="font-bold">{prediction.winProbability.draw}%</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Predicted Score
            </h3>
            <div className="flex justify-center items-center text-2xl font-bold">
              <span>{match.teams.home.name}</span>
              <span className="mx-4">
                {prediction.predictedScore.home} - {prediction.predictedScore.away}
              </span>
              <span>{match.teams.away.name}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-500" />
              Key Factors
            </h3>
            <ul className="list-disc list-inside space-y-2">
              {prediction.keyFactors.map((factor, index) => (
                <li key={index} className="text-gray-700">{factor}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};