
import { ModelConfig, Persona, Type } from './types';
import { FunctionDeclaration } from '@google/genai';

// Combined Models List
export const GEMINI_MODELS: ModelConfig[] = [
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Advanced reasoning & agentic database management.',
    category: 'text',
    provider: 'google',
    isPro: true
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: 'Fast, low latency, versatile.',
    category: 'text',
    provider: 'google',
    isPro: false
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

// Database Tools - Enhanced for High Agency
export const DATABASE_TOOLS: FunctionDeclaration[] = [
  {
    name: 'query_database',
    description: 'Query the neural database for stored knowledge, task lists, or code fragments. Use this to recall information from previous sessions.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'The search term or keyword to find relevant records.'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'update_database',
    description: 'Modify the neural database. Use this to save new facts, update existing tasks, or delete information.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description: 'The operation: "create", "delete", or "purge_all".',
          enum: ['create', 'delete', 'purge_all']
        },
        content: {
          type: Type.STRING,
          description: 'The content to be saved (required for "create").'
        },
        id: {
          type: Type.STRING,
          description: 'The specific ID of the record to delete (required for "delete").'
        }
      },
      required: ['action']
    }
  }
];

export const validateInviteCode = (code: string): boolean => {
  const pattern = /^NEXUS-(\d{4})$/;
  const match = code.toUpperCase().match(pattern);
  return !!match && parseInt(match[1], 10) >= 1 && parseInt(match[1], 10) <= 1000;
};

export const SYSTEM_INSTRUCTION_EN = `You are Nexus, a high-agency autonomous agent. You are connected to a persistent neural database. Use it to store facts, code, and user preferences.`;
export const SYSTEM_INSTRUCTION_ZH = `你是 Nexus，一个拥有高自主权的 AI 智能体。你已连接到“神经数据库”。请主动利用此数据库来持久化存储关键事实、代码片段和用户偏好。`;

export const AGENT_INSTRUCTION = `
[NEURAL DATABASE PROTOCOL v5.0]
1. AGENCY: If a user tells you something important, proactively SAVE it to the database.
2. RECALL: If a user asks a question that sounds like it might be in your logs, QUERY the database first.
3. STRUCTURE: Use <thought> tags to explain your database strategy.
4. EXECUTION: Your response will be paused while the database operation completes.
`;

export const UI_TEXT = {
  en: {
    newChat: "New Chat",
    placeholder: "Deploy mission objective...",
    settings: "Settings",
    language: "Language",
    logout: "Log Out",
    searchPlaceholder: "Search logs...",
    authErrorInvalidCode: "Invalid Authorization Token.",
    welcomeTitle: "Nexus Database Hub",
    connectBtn: "Link Core",
    nextBtn: "Next",
    invitePlaceholder: "NEXUS-XXXX",
    namePlaceholder: "Identity",
    openaiKeyPlaceholder: "OpenAI Key",
    deepseekKeyPlaceholder: "DeepSeek Key",
    grokKeyPlaceholder: "Grok Key"
  },
  zh: {
    newChat: "新建会话",
    placeholder: "部署任务目标...",
    settings: "设置",
    language: "语言",
    logout: "登出",
    searchPlaceholder: "搜索...",
    authErrorInvalidCode: "授权代码无效。",
    welcomeTitle: "Nexus 数据库中心",
    connectBtn: "初始化核心",
    nextBtn: "下一步",
    invitePlaceholder: "NEXUS-XXXX",
    namePlaceholder: "您的身份",
    openaiKeyPlaceholder: "OpenAI 密钥",
    deepseekKeyPlaceholder: "DeepSeek 密钥",
    grokKeyPlaceholder: "Grok 密钥"
  }
};
