import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bot, User, AlertTriangle } from 'lucide-react';
import type { Message } from './types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.type === 'bot';
  const isError = message.type === 'error';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex space-x-2 max-w-[80%] ${isError ? 'bg-red-50' : isBot ? 'bg-gray-100' : 'bg-blue-50'} rounded-lg p-3`}>
        <div className="flex-shrink-0">
          {isBot ? (
            <Bot className="w-6 h-6 text-blue-500" />
          ) : isError ? (
            <AlertTriangle className="w-6 h-6 text-red-500" />
          ) : (
            <User className="w-6 h-6 text-gray-500" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <p className={`text-sm ${isError ? 'text-red-700' : 'text-gray-900'}`}>
            {message.content}
          </p>
          <p className="text-xs text-gray-500">
            {format(message.timestamp, 'HH:mm', { locale: fr })}
          </p>
        </div>
      </div>
    </div>
  );
};