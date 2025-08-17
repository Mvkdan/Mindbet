import React from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MatchPrediction } from './MatchPrediction';
import type { Match } from '../types';

interface PredictionModalProps {
  match: Match;
  onClose: () => void;
}

export const PredictionModal: React.FC<PredictionModalProps> = ({ match, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Prediction: {match.teams.home.name} vs {match.teams.away.name}
            </CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </CardHeader>
          <CardContent>
            <MatchPrediction match={match} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
