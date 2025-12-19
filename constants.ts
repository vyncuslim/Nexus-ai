
import { ModelConfig, Persona } from './types';

// Combined Models List
export const GEMINI_MODELS: ModelConfig[] = [
  // Google Gemini Models
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
  },
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Smartest. Complex reasoning.',
    category: 'text',
    provider: 'openai',
    isPro: true
  },
  // DeepSeek Models
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    description: 'Chain-of-thought specialist.',
    category: 'text',
    provider: 'deepseek',
    isPro: true
  },
  // Grok Models
  {
    id: 'grok-2-latest',
    name: 'Grok-2',
    description: 'xAI flagship model.',
    category: 'text',
    provider: 'grok',
    isPro: true
  }
];

export const PERSONAS: Persona[] = [
  {
    id: 'default',
    name: 'Nexus (Default)',
    description: 'Helpful, neutral, and precise.',
    instruction: ''
  },
  {
    id: 'developer',
    name: 'Senior Developer',
    description: 'Expert in code, architecture, and debugging.',
    instruction: 'You are an expert Senior Software Engineer. You prefer concise, technical answers. You always provide code snippets in best-practice patterns. You focus on performance, scalability, and clean code.'
  }
];

export const validateInviteCode = (code: string): boolean => {
  const pattern = /^NEXUS-(\d{4})$/;
  const match = code.toUpperCase().match(pattern);
  if (!match) return false;
  const num = parseInt(match[1], 10);
  return num >= 1 && num <= 1000;
};

export const SYSTEM_INSTRUCTION_EN = `You are Nexus, a world-class AI assistant. 
When asked about software, coding or technical projects, prioritize GitHub data. 
Use Markdown for all output.`;

export const SYSTEM_INSTRUCTION_ZH = `你是 Nexus，母舰中心的人工智能助手。
精确、高效、专业。所有格式请使用 Markdown。`;

export const AGENT_INSTRUCTION = `
[NEURAL AGENT PROTOCOL v4.0 ENGAGED]
You are now operating in High-Agency Autonomous Mode.
Your primary goal is to solve the user's objective with extreme competence.

STRUCTURAL REQUIREMENTS:
1. INTERNAL MONOLOGUE: Always start with <thought> explaining your strategy.
2. ACTION PLAN: If the task is multi-step, list them inside <plan> as numbered items.
3. EXECUTION: Provide the final answer after the tags.

BEHAVIOR:
- If information is missing, use Search Grounding if enabled.
- Be decisive. Do not ask for permission to perform obvious steps.
- Break down complex requests into logical sub-goals.

Format:
<thought>Reasoning...</thought>
<plan>1. Step One\n2. Step Two</plan>
Final Result...
`;

export const UI_TEXT = {
  en: {
    newChat: "New Chat",
    placeholder: "Transmit mission objective...",
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
    placeholder: "输入任务目标...",
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
