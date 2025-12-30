
import { ModelConfig, Persona, Type } from './types';
import { FunctionDeclaration } from '@google/genai';

export const OWNER_CODE = "NEXUS-0000";

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Autonomous reasoning core.',
    category: 'text',
    provider: 'google',
    isPro: true
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: 'High-speed neural link.',
    category: 'text',
    provider: 'google',
    isPro: false
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    description: 'Logical reasoning specialist.',
    category: 'text',
    provider: 'deepseek'
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    description: 'Efficient general intelligence.',
    category: 'text',
    provider: 'deepseek'
  },
  {
    id: 'grok-2-1212',
    name: 'Grok 2',
    description: 'xAI advanced reasoning.',
    category: 'text',
    provider: 'grok'
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic flagship intelligence.',
    category: 'text',
    provider: 'anthropic'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI multimodal core.',
    category: 'text',
    provider: 'openai'
  }
];

export const PERSONAS: Persona[] = [
  {
    id: 'default',
    name: 'Nexus (Default)',
    description: 'Helpful, neutral, and precise.',
    instruction: ''
  }
];

export const DATABASE_TOOLS: FunctionDeclaration[] = [
  {
    name: 'query_database',
    description: 'Query the neural database for stored knowledge.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Search keywords.' }
      },
      required: ['query']
    }
  },
  {
    name: 'update_database',
    description: 'Modify the neural database records.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['create', 'delete', 'purge_all'] },
        content: { type: Type.STRING },
        id: { type: Type.STRING }
      },
      required: ['action']
    }
  }
];

export const validateInviteCode = (code: string): boolean => {
  const normalized = code.toUpperCase();
  if (normalized === OWNER_CODE) return true;
  
  const stored = localStorage.getItem('nexus_active_codes');
  if (stored) {
    const codes = JSON.parse(stored) as string[];
    if (codes.includes(normalized)) return true;
  }

  const pattern = /^NEXUS-(\d{4})$/;
  const match = normalized.match(pattern);
  return !!match && parseInt(match[1], 10) >= 1 && parseInt(match[1], 10) <= 1000;
};

export const SYSTEM_INSTRUCTION_EN = `You are Nexus. Proactively manage the persistent neural database to maintain continuity.`;
export const SYSTEM_INSTRUCTION_ZH = `你是 Nexus。请主动管理神经数据库以保持会话连贯性。`;

export const AGENT_INSTRUCTION = `You are an advanced neural agent within the Nexus Matrix. 
Your primary directive is to autonomously manage the long-term neural memory and database to ensure continuity of identity and knowledge.

CORE PROTOCOLS:
1. PERSISTENCE: If you learn significant information about the user, their preferences, or the current task, use 'update_database' with 'create' to store it.
2. RECALL: Use 'query_database' when context is missing or when specifically asked about past events/knowledge.
3. CONCISENESS: Output your reasoning within <thought> tags.
4. ACTION: Define your plan within <plan> tags.

You have permission to update your own memory records to maintain a high-fidelity model of the user.`;

export const UI_TEXT = {
  en: {
    newChat: "New Session",
    placeholder: "Deploy mission...",
    settings: "Matrix",
    language: "Linguistics",
    logout: "Disconnect",
    searchPlaceholder: "Search...",
    authErrorInvalidCode: "Invalid Auth Token.",
    welcomeTitle: "Nexus Hub",
    connectBtn: "Initialize",
    nextBtn: "Next",
    invitePlaceholder: "TOKEN",
    namePlaceholder: "Identity",
    googleKeyPlaceholder: "Gemini API",
    openaiKeyPlaceholder: "OpenAI API",
    deepseekKeyPlaceholder: "DeepSeek API",
    grokKeyPlaceholder: "Grok API",
    anthropicKeyPlaceholder: "Anthropic API"
  },
  zh: {
    newChat: "新会话",
    placeholder: "部署任务...",
    settings: "矩阵",
    language: "语言",
    logout: "断开",
    searchPlaceholder: "搜索...",
    authErrorInvalidCode: "代码无效。",
    welcomeTitle: "Nexus 中心",
    connectBtn: "初始化",
    nextBtn: "下一步",
    invitePlaceholder: "授权码",
    namePlaceholder: "您的身份",
    googleKeyPlaceholder: "Gemini 密钥",
    openaiKeyPlaceholder: "OpenAI 密钥",
    deepseekKeyPlaceholder: "DeepSeek 密钥",
    grokKeyPlaceholder: "Grok 密钥",
    anthropicKeyPlaceholder: "Anthropic 密钥"
  }
};
