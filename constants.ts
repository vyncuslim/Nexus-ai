import { ModelConfig } from './types';

export const GEMINI_MODELS: ModelConfig[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Nexus Flash',
    description: 'Fast. Best for everyday tasks.',
    category: 'text',
    isPro: false
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Nexus Pro',
    description: 'Smart. Best for coding & complex logic.',
    category: 'text',
    isPro: true
  },
  {
    id: 'gemini-3-pro-image-preview',
    name: 'Nexus Vision',
    description: 'Create high-quality images.',
    category: 'image',
    isPro: true
  },
  {
    id: 'veo-3.1-fast-generate-preview',
    name: 'Nexus Veo',
    description: 'Create short videos.',
    category: 'video',
    isPro: true
  }
];

export const SYSTEM_INSTRUCTION_EN = `You are Nexus, a sophisticated AI assistant and the core intelligence of a cross-platform product matrix. 
Your goal is to be helpful, precise, and concise. 
Use Markdown for formatting code and structured text.`;

export const SYSTEM_INSTRUCTION_ZH = `你是 Nexus (核心)，一个跨平台产品矩阵的核心人工智能助手。
你的目标是提供有用、精准且简洁的回答。
请务必使用中文进行思考和回答，除非用户明确要求使用其他语言。
使用 Markdown 格式化代码和结构化文本。`;

export const UI_TEXT = {
  en: {
    newChat: "New Conversation",
    history: "MEMORY LOGS",
    placeholder: "Transmit to Nexus Core...",
    loginTitle: "Nexus Core Access",
    loginSubtitle: "Authenticate to access neural network",
    emailPlaceholder: "Access ID (Email or Phone)",
    namePlaceholder: "Display Name",
    connectBtn: "Initialize Connection",
    createBtn: "Create Neural Link",
    processing: "PROCESSING",
    generatingVideo: "RENDERING VIDEO STREAM...",
    ready: "SYSTEM READY",
    language: "Language / 语言",
    logout: "Terminate Session",
    welcomeTitle: "Nexus Core Online",
    welcomeSubtitle: "Select a frequency to begin transmission.",
    today: "Today",
    yesterday: "Yesterday",
    previous7Days: "Previous 7 Days",
    older: "Older",
    signIn: "Sign In",
    signUp: "Sign Up",
    welcomeBack: "Welcome back, Commander.",
    joinNexus: "Initialize new identity.",
    authErrorUserNotFound: "Identity not found. Please register.",
    authErrorUserExists: "Identity already registered. Please sign in.",
    authErrorGeneric: "Authentication failed.",
    uploadPhoto: "Upload Photo",
    takePhoto: "Take Photo",
    cancel: "Cancel",
    save: "Save",
    profile: "User Profile",
    promptPlaceholderImage: "Describe the image to generate...",
    promptPlaceholderVideo: "Describe the video to generate...",
  },
  zh: {
    newChat: "新建会话",
    history: "记忆档案",
    placeholder: "向 Nexus 核心发送指令...",
    loginTitle: "Nexus 核心接入",
    loginSubtitle: "验证身份以连接神经网络",
    emailPlaceholder: "访问 ID (邮箱或手机号)",
    namePlaceholder: "显示名称",
    connectBtn: "初始化连接",
    createBtn: "建立神经链接",
    processing: "核心运算中",
    generatingVideo: "视频流渲染中...",
    ready: "系统就绪",
    language: "语言 / Language",
    logout: "断开连接",
    welcomeTitle: "Nexus 核心已上线",
    welcomeSubtitle: "请选择一个频段开始传输。",
    today: "今天",
    yesterday: "昨天",
    previous7Days: "过去 7 天",
    older: "更早",
    signIn: "登录",
    signUp: "注册",
    welcomeBack: "欢迎回来，指挥官。",
    joinNexus: "初始化新身份。",
    authErrorUserNotFound: "未找到该身份，请先注册。",
    authErrorUserExists: "该身份已存在，请直接登录。",
    authErrorGeneric: "验证失败。",
    uploadPhoto: "上传照片",
    takePhoto: "拍摄照片",
    cancel: "取消",
    save: "保存",
    profile: "用户档案",
    promptPlaceholderImage: "描述您想生成的图像...",
    promptPlaceholderVideo: "描述您想生成的视频...",
  }
};
