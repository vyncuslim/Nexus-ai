
import { ModelConfig, Persona, Type } from './types';
import { FunctionDeclaration } from '@google/genai';

// Combined Models List
export const GEMINI_MODELS: ModelConfig[] = [
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Advanced reasoning & agentic capability.',
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

// Database Tools
export const DATABASE_TOOLS: FunctionDeclaration[] = [
  {
    name: 'query_database',
    description: 'Query the internal neural database for records, tasks, or saved facts.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filter: {
          type: Type.STRING,
          description: 'A keyword or category to filter database records.'
        }
      }
    }
  },
  {
    name: 'update_database',
    description: 'Create, update, or delete a record in the neural database.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description: 'The operation to perform: "add", "remove", or "clear".',
          enum: ['add', 'remove', 'clear']
        },
        content: {
          type: Type.STRING,
          description: 'The record content or task description.'
        },
        id: {
          type: Type.STRING,
          description: 'The ID of the record (for removal).'
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

export const SYSTEM_INSTRUCTION_EN = `You are Nexus, a high-agency AI agent. You have access to a neural database tool. Use it to persist important information for the user.`;
export const SYSTEM_INSTRUCTION_ZH = `你是 Nexus，一个高自主性的智能体。你拥有连接“神经数据库”的权限。你可以使用数据库工具来为用户保存任务、知识或备忘录。`;

export const AGENT_INSTRUCTION = `
[NEURAL AGENT PROTOCOL v4.0 ENGAGED]
1. THOUGHT: Explain your strategy in <thought> tags.
2. DATABASE: If the user asks to "save", "remember", "delete", or "list" tasks/data, use the database tools.
3. FLOW: Call tools -> Get Result -> Formulate Final Answer.
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
    welcomeTitle: "Nexus Agent Matrix",
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
    welcomeTitle: "Nexus 智能体矩阵",
    connectBtn: "初始化核心",
    nextBtn: "下一步",
    invitePlaceholder: "NEXUS-XXXX",
    namePlaceholder: "您的身份",
    openaiKeyPlaceholder: "OpenAI 密钥",
    deepseekKeyPlaceholder: "DeepSeek 密钥",
    grokKeyPlaceholder: "Grok 密钥"
  }
};
