import { ModelConfig } from './types';

// Combined Models List
export const GEMINI_MODELS: ModelConfig[] = [
  // OpenAI Models
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast. Everyday tasks.',
    category: 'text',
    provider: 'openai',
    isPro: false
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Smartest. Complex reasoning.',
    category: 'text',
    provider: 'openai',
    isPro: true
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
    contactUs: "Contact Us"
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
    contactUs: "联系我们"
  }
};

export const USER_GUIDE = {
  en: [
    {
      title: "1. Dual AI Engine",
      content: "Nexus integrates both OpenAI (GPT-3.5, GPT-4o, DALL-E 3) and Google Gemini (Flash, Pro, Veo). Use the dropdown at the top to switch providers instantly."
    },
    {
      title: "2. Media Generation",
      content: "Select 'DALL-E 3' or 'Gemini 3 Image' to generate images. Select 'Veo Video' to generate short videos. Describe what you want to see in the chat box."
    },
    {
      title: "3. Smart Tools",
      content: "Use the toolbar above the input to format text (Bold, Italic, Code). Use the 'Undo/Redo' buttons to correct your input history."
    },
    {
      title: "4. Audio & Speech",
      content: "Click the 'Speaker' icon on any AI message to read it aloud using high-quality Text-to-Speech."
    },
    {
      title: "5. Shortcuts",
      content: "Alt + N: New Chat | Enter: Send | Shift + Enter: New Line."
    }
  ],
  zh: [
    {
      title: "1. 双核 AI 引擎",
      content: "Nexus 集成了 OpenAI (GPT-3.5, GPT-4o, DALL-E 3) 和 Google Gemini (Flash, Pro, Veo)。点击顶部菜单即可在不同模型间无缝切换。"
    },
    {
      title: "2. 媒体生成",
      content: "选择 'DALL-E 3' 或 'Gemini 3 Image' 生成图像。选择 'Veo Video' 生成短视频。只需在输入框描述您想看到的画面。"
    },
    {
      title: "3. 智能工具栏",
      content: "使用输入框上方的工具栏格式化文本（加粗、斜体、代码块）。使用 '撤销/重做' 按钮管理您的输入历史。"
    },
    {
      title: "4. 语音朗读",
      content: "点击 AI 回复气泡上的 '喇叭' 图标，即可使用高质量语音朗读内容。"
    },
    {
      title: "5. 快捷键",
      content: "Alt + N: 新建会话 | Enter: 发送 | Shift + Enter: 换行"
    }
  ]
};