export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export enum Modality {
  AUDIO = 'AUDIO',
  TEXT = 'TEXT'
}

export interface Attachment {
  type: 'image' | 'video';
  url: string;
  mimeType?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  searchEntryPoint?: {
    renderedContent: string;
  };
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  attachment?: Attachment;
  groundingMetadata?: GroundingMetadata;
  isError?: boolean;
  timestamp: number;
}

export type ModelCategory = 'text' | 'image' | 'video';
export type AIProvider = 'openai' | 'google' | 'anthropic' | 'codex';

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  category: ModelCategory;
  provider: AIProvider;
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
  avatar?: string; // Base64 string
  isGoogleLinked?: boolean;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  instruction: string;
}