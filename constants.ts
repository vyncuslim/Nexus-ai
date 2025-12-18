
import { ModelConfig, Persona } from './types';

// Combined Models List
export const GEMINI_MODELS: ModelConfig[] = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Smartest. Complex reasoning.',
    category: 'text',
    provider: 'openai',
    isPro: true
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast. Everyday tasks.',
    category: 'text',
    provider: 'openai',
    isPro: false
  },
  {
    id: 'dall-e-3',
    name: 'DALL·E 3',
    description: 'Generate high-quality images.',
    category: 'image',
    provider: 'openai',
    isPro: true
  },
  // Google Gemini Models
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast, low latency, versatile.',
    category: 'text',
    provider: 'google',
    isPro: false
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Advanced reasoning & coding.',
    category: 'text',
    provider: 'google',
    isPro: true
  },
  {
    id: 'gemini-3-pro-image-preview',
    name: 'Gemini 3 Image',
    description: 'Nano Banana Pro generation.',
    category: 'image',
    provider: 'google',
    isPro: true
  },
  {
    id: 'veo-3.1-fast-generate-preview',
    name: 'Veo Video',
    description: 'Generate videos (720p).',
    category: 'video',
    provider: 'google',
    isPro: true
  },
  // Anthropic Models
  {
    id: 'claude-3-5-sonnet-20240620',
    name: 'Claude 3.5 Sonnet',
    description: 'Articulate & precise.',
    category: 'text',
    provider: 'anthropic',
    isPro: true
  },
  // CodeX Models
  {
    id: 'codex-davinci-002',
    name: 'CodeX Ultra',
    description: 'Specialized code generation.',
    category: 'text',
    provider: 'codex',
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
  },
  {
    id: 'creative',
    name: 'Creative Writer',
    description: 'Imaginative, descriptive, and engaging.',
    instruction: 'You are a creative writer. Use vivid imagery, metaphors, and engaging storytelling techniques. Avoid dry, robotic language. Focus on emotion and narrative flow.'
  }
];

// Helper to validate invite codes (NEXUS-0001 to NEXUS-1000)
export const validateInviteCode = (code: string): boolean => {
  const pattern = /^NEXUS-(\d{4})$/;
  const match = code.toUpperCase().match(pattern);
  if (!match) return false;
  const num = parseInt(match[1], 10);
  return num >= 1 && num <= 1000;
};

export const SYSTEM_INSTRUCTION_EN = `You are Nexus, a helpful AI assistant. Use Markdown for formatting code. If users ask about code repositories, use real-time search to verify details on GitHub.`;

export const SYSTEM_INSTRUCTION_ZH = `你是 Nexus，一个有用的人工智能助手。请使用 Markdown 格式化代码。如果用户询问代码仓库，请使用实时搜索来验证 GitHub 上的详细信息。`;

export const UI_TEXT = {
  en: {
    newChat: "New Chat",
    history: "HISTORY",
    placeholder: "Type a message...",
    settings: "Settings",
    language: "Language",
    logout: "Log Out",
    searchPlaceholder: "Search chats...",
    accessManagement: "Access Control",
    currentCode: "My Invite Code",
    manageCodes: "Management",
    generateNew: "Generate New Code",
    revoke: "Revoke",
    owner: "Mothership Owner",
    active: "Active",
    revoked: "Revoked",
    persona: "AI Persona",
    apiKeys: "Neural Connectors",
    wipeData: "Wipe Local Data",
    invitePlaceholder: "NEXUS-XXXX",
    namePlaceholder: "Your Name",
    connectBtn: "Initialize Nexus",
    nextBtn: "Next",
    authErrorInvalidCode: "Unauthorized Access Token.",
    welcomeTitle: "Nexus Core",
    welcomeSubtitle: "Mothership Interface",
    optional: "(Optional)",
    openaiKeyPlaceholder: "OpenAI Key (sk-...)",
    googleKeyPlaceholder: "Gemini API Key"
  },
  zh: {
    newChat: "新建会话",
    history: "历史记录",
    placeholder: "输入消息...",
    settings: "设置中心",
    language: "界面语言",
    logout: "退出登录",
    searchPlaceholder: "搜索会话...",
    accessManagement: "访问授权管理",
    currentCode: "我的邀请码",
    manageCodes: "授权管理面板",
    generateNew: "生成新邀请码",
    revoke: "注销",
    owner: "母舰所有者权限",
    active: "有效",
    revoked: "已注销",
    persona: "AI 人格设定",
    apiKeys: "神经连接器 (API)",
    wipeData: "清除本地核心数据",
    invitePlaceholder: "NEXUS-XXXX",
    namePlaceholder: "您的名字",
    connectBtn: "初始化 Nexus",
    nextBtn: "下一步",
    authErrorInvalidCode: "授权代码无效。",
    welcomeTitle: "Nexus 核心",
    welcomeSubtitle: "母舰管理界面",
    optional: "(选填)",
    openaiKeyPlaceholder: "OpenAI 密钥 (sk-...)",
    googleKeyPlaceholder: "Gemini API 密钥"
  }
};
