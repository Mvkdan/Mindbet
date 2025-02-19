import React from 'react';
import { X } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import type { ChatEngine } from './types';

interface ChatSettingsProps {
  engine: ChatEngine;
  onEngineChange: (engine: ChatEngine) => void;
  onClose: () => void;
}

export const ChatSettings: React.FC<ChatSettingsProps> = ({
  engine,
  onEngineChange,
  onClose
}) => {
  return (
    <Card className="absolute bottom-full right-0 mb-2 w-72 p-4 bg-white shadow-lg rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Paramètres</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="w-8 h-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moteur de conversation
          </label>
          <select
            value={engine}
            onChange={(e) => onEngineChange(e.target.value as ChatEngine)}
            className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="gemini">Google Gemini</option>
            <option value="local">Système local</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Choisissez le moteur de traitement des conversations
          </p>
        </div>
      </div>
    </Card>
  );
};