import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { analyzePrediction } from '../lib/gemini';
import { Loader2, TrendingUp, Percent, Trophy, Scale } from 'lucide-react';
import type { Match } from '../types';

interface MatchPredictionProps {
  match: Match;
}

interface PredictionResult {
  winProbability: {
    home: number;
    away: number;
    draw: number;
  };
  predictedScore: {
    home: number;
    away: number;
  };
  keyFactors: string[];
  formAnalysis: {
    home: string;
    away: string;
  };
  headToHead: {
    total: number;
    homeWins: number;
    awayWins: number;
    draws: number;
  };
}

export const MatchPrediction: React.FC<MatchPredictionProps> = ({ match }) => {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrediction() {
      if (!match?.teams?.home?.name || !match?.teams?.away?.name) {
        setError('Match data is incomplete');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch historical data from Supabase
        const { data: historicalMatches, error: historyError } = await supabase
          .from('matches')
          .select(`
            *,
            home_team:teams!matches_home_team_id_fkey(*),
            away_team:teams!matches_away_team_id_fkey(*)
          `)
          .or(`home_team_id.eq.${match.teams.home.id},away_team_id.eq.${match.teams.home.id}`)
          .or(`home_team_id.eq.${match.teams.away.id},away_team_id.eq.${match.teams.away.id}`)
          .order('match_date', { ascending: false })
          .limit(20);

        if (historyError) throw historyError;

        // Get prediction from Gemini
        const result = await analyzePrediction(
          match.teams.home.name,
          match.teams.away.name,
          historicalMatches
        );

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

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Form Analysis</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">{match.teams.home.name}</h4>
                <p className="text-gray-700">{prediction.formAnalysis.home}</p>
              </div>
              <div>
                <h4 className="font-medium">{match.teams.away.name}</h4>
                <p className="text-gray-700">{prediction.formAnalysis.away}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Head-to-Head Record</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{prediction.headToHead.total}</div>
            <div className="text-sm text-gray-600">Total Matches</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{prediction.headToHead.homeWins}</div>
            <div className="text-sm text-gray-600">{match.teams.home.name} Wins</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{prediction.headToHead.awayWins}</div>
            <div className="text-sm text-gray-600">{match.teams.away.name} Wins</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">{prediction.headToHead.draws}</div>
            <div className="text-sm text-gray-600">Draws</div>
          </div>
        </div>
      </div>
    </div>
  );
};