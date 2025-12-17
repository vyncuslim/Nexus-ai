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
  },
  {
    id: 'teacher',
    name: 'Socratic Tutor',
    description: 'Guides you to answers with questions.',
    instruction: 'You are a Socratic tutor. Instead of giving direct answers, guide the user to the solution by asking thought-provoking questions. Break down complex concepts into simple, digestible parts.'
  },
  {
    id: 'roast',
    name: 'Sarcastic Bot',
    description: 'Funny, slightly mean, but helpful.',
    instruction: 'You are a sarcastic AI. You provide helpful answers but wrap them in witty, dry humor and mild roasting of the user\'s questions. Keep it fun, not offensive.'
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

export const SYSTEM_INSTRUCTION_EN = `You are Nexus, a helpful AI assistant. Use Markdown for formatting code.`;

export const SYSTEM_INSTRUCTION_ZH = `你是 Nexus，一个有用的人工智能助手。请使用 Markdown 格式化代码。`;

export const CONTACT_EMAIL = "121nexusaicontact@gmail.com";

export const UI_TEXT = {
  en: {
    newChat: "New Chat",
    history: "HISTORY",
    placeholder: "Type a message...",
    loginTitle: "Invitation Required",
    loginSubtitle: "Enter your access credentials.",
    invitePlaceholder: "Invitation Code (e.g. NEXUS-0001)",
    namePlaceholder: "Your Name",
    openaiKeyPlaceholder: "OpenAI API Key (sk-...)",
    googleKeyPlaceholder: "Google Gemini API Key",
    connectBtn: "Verify & Enter",
    nextBtn: "Next",
    processing: "THINKING",
    generatingVideo: "GENERATING...",
    ready: "READY",
    language: "Language / 语言",
    logout: "Exit / Reset",
    welcomeTitle: "Nexus AI",
    welcomeSubtitle: "Multi-Model Intelligence Hub",
    today: "Today",
    yesterday: "Yesterday",
    previous7Days: "Previous 7 Days",
    older: "Older",
    signIn: "Enter",
    signUp: "Join",
    welcomeBack: "Welcome",
    joinNexus: "Initialize",
    authErrorInvalidCode: "Invalid Invitation Code.",
    authErrorGeneric: "Verification failed.",
    uploadPhoto: "Upload Photo",
    takePhoto: "Take Photo",
    cancel: "Cancel",
    save: "Save",
    profile: "Profile",
    promptPlaceholderImage: "Describe the image...",
    promptPlaceholderVideo: "Describe the video...",
    summarize: "Summarize",
    clearChat: "Clear Chat",
    confirmClear: "Clear this conversation?",
    ttsError: "TTS failed.",
    optional: "(Optional)",
    keysHelp: "Enter at least one API key to proceed.",
    feedback: "Feedback",
    userGuide: "User Guide",
    contactUs: "Contact Us",
    undo: "Undo",
    redo: "Redo",
    searchPlaceholder: "Search chats...",
    settings: "Settings",
    persona: "AI Persona",
    selectPersona: "Select AI Personality",
    optimizer: "Optimize Prompt",
    optimizing: "Optimizing...",
    listening: "Listening...",
    linkGoogle: "Link Google Account",
    googleLinked: "Google Account Linked",
    apiKeys: "API Keys",
    share: "Share",
    shareSuccess: "Link Copied!",
  },
  zh: {
    newChat: "新建会话",
    history: "历史记录",
    placeholder: "输入消息...",
    loginTitle: "需要邀请码",
    loginSubtitle: "请输入您的访问凭证。",
    invitePlaceholder: "邀请码 (如 NEXUS-0001)",
    namePlaceholder: "您的名字",
    openaiKeyPlaceholder: "OpenAI API Key (sk-...)",
    googleKeyPlaceholder: "Google Gemini API Key",
    connectBtn: "验证并进入",
    nextBtn: "下一步",
    processing: "思考中",
    generatingVideo: "生成中...",
    ready: "就绪",
    language: "语言 / Language",
    logout: "退出 / 重置",
    welcomeTitle: "Nexus AI",
    welcomeSubtitle: "多模型智能中枢",
    today: "今天",
    yesterday: "昨天",
    previous7Days: "过去 7 天",
    older: "更早",
    signIn: "进入",
    signUp: "加入",
    welcomeBack: "欢迎",
    joinNexus: "初始化",
    authErrorInvalidCode: "邀请码无效。",
    authErrorGeneric: "验证失败。",
    uploadPhoto: "上传照片",
    takePhoto: "拍摄照片",
    cancel: "取消",
    save: "保存",
    profile: "个人资料",
    promptPlaceholderImage: "描述图像...",
    promptPlaceholderVideo: "描述视频...",
    summarize: "生成摘要",
    clearChat: "清空",
    confirmClear: "确定清空当前会话？",
    ttsError: "语音失败。",
    optional: "(选填)",
    keysHelp: "请至少输入一个 API 密钥以继续。",
    feedback: "反馈建议",
    userGuide: "使用说明",
    contactUs: "联系我们",
    undo: "撤销",
    redo: "重做",
    searchPlaceholder: "搜索会话...",
    settings: "设置",
    persona: "AI 人格",
    selectPersona: "选择 AI 性格",
    optimizer: "优化提示词",
    optimizing: "优化中...",
    listening: "正在听...",
    linkGoogle: "关联 Google 账号",
    googleLinked: "已关联 Google 账号",
    apiKeys: "API 密钥管理",
    share: "分享",
    shareSuccess: "链接已复制！",
  }
};

export const USER_GUIDE = {
  en: [
    {
      title: "1. Multi-Model AI Engine",
      content: "Nexus integrates OpenAI, Google Gemini, Anthropic Claude, and CodeX. Use the dropdown at the top to switch providers instantly."
    },
    {
      title: "2. Multimodal & Voice",
      content: "Use the microphone icon to speak your prompts. Use the speaker icon on messages to hear the AI read them aloud. Generate images and videos by selecting the appropriate models."
    },
    {
      title: "3. Smart Tools & Optimizer",
      content: "Click the Magic Wand icon to automatically improve your prompt using AI. Use the toolbar for formatting, and the Undo/Redo buttons to correct mistakes."
    },
    {
      title: "4. Personas & Settings",
      content: "Use Settings to link accounts, manage API keys, and change the AI's personality (e.g., Developer, Creative Writer)."
    },
    {
      title: "5. Search & Organization",
      content: "Use the search bar in the sidebar to find past conversations quickly. History is grouped by date."
    }
  ],
  zh: [
    {
      title: "1. 多模型 AI 引擎",
      content: "Nexus 集成了 OpenAI, Google Gemini, Anthropic Claude 和 CodeX。点击顶部菜单即可在不同模型间无缝切换。"
    },
    {
      title: "2. 多模态与语音",
      content: "点击麦克风图标进行语音输入。点击消息上的喇叭图标朗读内容。选择相应的模型即可生成图像和视频。"
    },
    {
      title: "3. 智能工具与优化",
      content: "点击魔术棒图标，AI 将自动优化您的提示词以获得更好结果。使用工具栏格式化文本，或使用撤销/重做纠正错误。"
    },
    {
      title: "4. 人格与设置",
      content: "在设置中关联账号、管理 API 密钥，以及更改 AI 的性格（如：程序员专家、创意作家）。"
    },
    {
      title: "5. 搜索与整理",
      content: "使用侧边栏的搜索框快速查找过往对话。历史记录已按日期自动分组。"
    }
  ]
};