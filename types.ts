export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  isError?: boolean;
  timestamp: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  isPro?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export type Language = 'en' | 'zh';

export interface User {
  id: string;
  email: string;
  name: string;
}