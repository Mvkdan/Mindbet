import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Minimize2, Maximize2, Send, Bot, Settings } from 'lucide-react';
import { analyzePrediction } from '../../lib/gemini';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ChatMessage } from './ChatMessage';
import { ChatSettings } from './ChatSettings';
import type { Message, ChatEngine } from './types';

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [engine, setEngine] = useState<ChatEngine>('gemini');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      content: input,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response: string;

      if (engine === 'gemini') {
        const result = await analyzePrediction(input, messages);
        response = result.response;
      } else {
        // Système de raisonnement local simple
        response = "Je suis désolé, le système de raisonnement local n'est pas encore implémenté.";
      }

      const botMessage: Message = {
        id: Date.now(),
        content: response,
        type: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now(),
        content: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
        type: 'error',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full shadow-lg"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-96 ${isMinimized ? 'h-14' : 'h-[600px]'} bg-white shadow-xl rounded-lg flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-500" />
          <span className="font-medium">Assistant Football</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(prev => !prev)}
            className="w-8 h-8 p-0"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(prev => !prev)}
            className="w-8 h-8 p-0"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 resize-none rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Settings */}
          {showSettings && (
            <ChatSettings
              engine={engine}
              onEngineChange={setEngine}
              onClose={() => setShowSettings(false)}
            />
          )}
        </>
      )}
    </Card>
  );
};