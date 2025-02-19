export type MessageType = 'user' | 'bot' | 'error';
export type ChatEngine = 'gemini' | 'local';

export interface Message {
  id: number;
  content: string;
  type: MessageType;
  timestamp: Date;
}