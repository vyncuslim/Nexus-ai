import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import AuthScreen from './components/AuthScreen';
import { SendIcon, MenuIcon, ChevronDownIcon, BoldIcon, ItalicIcon, CodeIcon, ImageIcon, VideoIcon, LinkIcon, UndoIcon, RedoIcon, SparklesIcon, BroomIcon, GoogleIcon, OpenAIIcon, CodeBlockIcon, MicIcon, MagicWandIcon, StopIcon } from './components/Icon';
import { GEMINI_MODELS, SYSTEM_INSTRUCTION_EN, SYSTEM_INSTRUCTION_ZH, UI_TEXT, PERSONAS } from './constants';
import { ChatMessage, Role, ModelConfig, ChatSession, User, Language, WorkspaceType } from './types';
import { streamGeminiResponse, generateImage, generateVideo } from './services/geminiService';
import { useHistory } from './hooks/useHistory';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from "@google/genai";

function App() {
  // --- Persistent State Keys ---
  const STORAGE_KEY_USER = 'nexus_user_v2';
  const STORAGE_KEY_OPENAI_KEY = 'nexus_openai_key';
  const STORAGE_KEY_GOOGLE_KEY = 'nexus_google_key';
  const STORAGE_KEY_INVITE_CODE = 'nexus_invite_code';
  const STORAGE_KEY_SESSIONS_PREFIX = 'nexus_sessions_';
  const STORAGE_KEY_PREFS = 'nexus_preferences';

  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [openaiKey, setOpenaiKey] = useState<string | null>(null);
  const [googleKey, setGoogleKey] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Workspace & Persona
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceType>('personal');
  const [currentPersonaId, setCurrentPersonaId] = useState<string>('default');

  // Undo/Redo History for Sessions
  const sessionsControl = useHistory<ChatSession[]>([]);
  const sessions = sessionsControl.state;
  const setSessions = sessionsControl.set;

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Undo/Redo History for Input
  const inputControl = useHistory<string>("");
  const inputValue = inputControl.state;
  const setInputValue = inputControl.set;

  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(GEMINI_MODELS[0]);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Media Config State
  const [imageSize, setImageSize] = useState("1K");
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- Load Initial State ---
  useEffect(() => {
    // Load Language & Preferences
    const prefs = localStorage.getItem(STORAGE_KEY_PREFS);
    if (prefs) {
      try {
        const p = JSON.parse(prefs);
        if (p.language) setLanguage(p.language);
        if (p.personaId) setCurrentPersonaId(p.personaId);
      } catch (e) { console.error(e); }
    }

    // Load Auth
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    const storedOpenAI = localStorage.getItem(STORAGE_KEY_OPENAI_KEY);
    const storedGoogle = localStorage.getItem(STORAGE_KEY_GOOGLE_KEY);
    const storedInvite = localStorage.getItem(STORAGE_KEY_INVITE_CODE);

    if (storedUser && storedInvite && (storedOpenAI || storedGoogle)) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        if (storedOpenAI) setOpenaiKey(storedOpenAI);
        if (storedGoogle) setGoogleKey(storedGoogle);
        // Load sessions will be called in the next effect when user is set
      } catch (e) { console.error(e); }
    }
  }, []);

  // Reload sessions when User or Workspace changes
  useEffect(() => {
    if (user) {
      loadSessions(user.id, currentWorkspace);
    }
  }, [user, currentWorkspace]);

  // Protect against closing tab while generating
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLoading) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLoading]);

  // Keyboard Shortcuts (Global)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Alt+N for New Chat
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNewSession();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [user, sessions, currentWorkspace]); 

  // --- Session Management Helpers ---
  const loadSessions = (userId: string, workspace: WorkspaceType) => {
    // Separate storage key for workspace
    const key = `${STORAGE_KEY_SESSIONS_PREFIX}${workspace}_${userId}`;
    const storedSessions = localStorage.getItem(key);
    
    if (storedSessions) {
      try {
        const s: ChatSession[] = JSON.parse(storedSessions);
        s.sort((a, b) => b.updatedAt - a.updatedAt);
        setSessions(s, true); // skip history for initial load
        if (s.length > 0) {
          setCurrentSessionId(s[0].id);
        } else {
          setCurrentSessionId(null);
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
        setSessions([], true);
      }
    } else {
      setSessions([], true);
      setCurrentSessionId(null);
    }
  };

  const saveSessionsToStorage = (updatedSessions: ChatSession[], userId: string, workspace: WorkspaceType) => {
    try {
      const key = `${STORAGE_KEY_SESSIONS_PREFIX}${workspace}_${userId}`;
      localStorage.setItem(key, JSON.stringify(updatedSessions));
    } catch (e) {
      console.error("Storage limit reached", e);
    }
  };

  const createNewSession = () => {
    if (!user) return;
    const newSession: ChatSession = {
      id: uuidv4(),
      userId: user.id,
      title: "",
      messages: [],
      updatedAt: Date.now()
    };
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    setSidebarOpen(false); 
    saveSessionsToStorage(updatedSessions, user.id, currentWorkspace);
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!user) return;
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    saveSessionsToStorage(updatedSessions, user.id, currentWorkspace);
    
    if (currentSessionId === sessionId) {
      setCurrentSessionId(updatedSessions.length > 0 ? updatedSessions[0].id : null);
    }
  };

  const clearCurrentChat = () => {
    if (!user || !currentSessionId) return;
    
    const updatedSessions = sessions.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: [], updatedAt: Date.now() };
      }
      return s;
    });

    setSessions(updatedSessions);
    saveSessionsToStorage(updatedSessions, user.id, currentWorkspace);
    setShowClearConfirm(false);
  };

  // --- Authentication Logic ---
  const handleAuthSuccess = (inviteCode: string, name: string, keys: { openai?: string, google?: string }) => {
    // Generate simple User object
    const u: User = {
      id: btoa(inviteCode + name), // Simple ID
      name: name,
      email: inviteCode // Storing code as email for display
    };

    setUser(u);
    if (keys.openai) {
      setOpenaiKey(keys.openai);
      localStorage.setItem(STORAGE_KEY_OPENAI_KEY, keys.openai);
    }
    if (keys.google) {
      setGoogleKey(keys.google);
      localStorage.setItem(STORAGE_KEY_GOOGLE_KEY, keys.google);
    }
    
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(u));
    localStorage.setItem(STORAGE_KEY_INVITE_CODE, inviteCode);
  };

  const updateUserAvatar = (avatarBase64: string) => {
    if (!user) return;
    const updatedUser = { ...user, avatar: avatarBase64 };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    setOpenaiKey(null);
    setGoogleKey(null);
    setSessions([], true);
    setCurrentSessionId(null);
    
    // Clear all auth data
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_OPENAI_KEY);
    localStorage.removeItem(STORAGE_KEY_GOOGLE_KEY);
    localStorage.removeItem(STORAGE_KEY_INVITE_CODE);
    
    setSidebarOpen(false);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    const prefs = localStorage.getItem(STORAGE_KEY_PREFS) ? JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS)!) : {};
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({ ...prefs, language: newLang }));
  };

  const updatePersona = (id: string) => {
    setCurrentPersonaId(id);
    const prefs = localStorage.getItem(STORAGE_KEY_PREFS) ? JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS)!) : {};
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({ ...prefs, personaId: id }));
  }

  // --- Voice Input Logic ---
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue((prev) => prev ? prev + " " + transcript : transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  };

  // --- Prompt Optimization Logic ---
  const handleOptimizePrompt = async () => {
    if (!inputValue.trim() || isOptimizing || !googleKey) return;
    
    setIsOptimizing(true);
    try {
       const ai = new GoogleGenAI({ apiKey: googleKey });
       const prompt = language === 'zh' 
          ? `请重写并优化以下提示词，使其在 AI 生成内容时更加有效和详细。直接返回优化后的提示词，不要包含其他解释：\n\n${inputValue}`
          : `Rewrite and optimize the following prompt to be more effective and detailed for AI generation. Return ONLY the optimized prompt with no explanation:\n\n${inputValue}`;
       
       const response = await ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: prompt
       });
       
       const optimized = response.text;
       if (optimized) {
         setInputValue(optimized.trim());
       }
    } catch (e) {
      console.error("Optimization failed", e);
    } finally {
      setIsOptimizing(false);
    }
  };


  // --- Chat & Generation Logic ---
  const getCurrentMessages = () => {
    const session = sessions.find(s => s.id === currentSessionId);
    return session ? session.messages : [];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // Markdown Selection Helper
  const wrapSelection = (prefix: string, suffix: string, defaultText: string = "text") => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = inputValue;
    
    const hasSelection = start !== end;
    const selected = hasSelection ? text.substring(start, end) : defaultText;
    
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    const newText = `${before}${prefix}${selected}${suffix}${after}`;
    setInputValue(newText);
    textareaRef.current.focus();
    
    setTimeout(() => {
        if(!textareaRef.current) return;
        if (hasSelection) {
            textareaRef.current.setSelectionRange(start, start + prefix.length + selected.length + suffix.length);
        } else {
            const cursor = start + prefix.length + selected.length;
            textareaRef.current.setSelectionRange(cursor, cursor);
        }
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const getActiveKey = (provider: 'openai' | 'google') => {
    return provider === 'openai' ? openaiKey : googleKey;
  };

  const handleSummarize = async () => {
    if (!currentSessionId || isLoading || !user) return;
    const key = getActiveKey('openai') || getActiveKey('google'); // Use whatever key is available
    if (!key) return; // Prompt user?

    const msgs = getCurrentMessages();
    if (msgs.length === 0) return;

    setIsLoading(true);
    const summaryPrompt = language === 'zh' 
      ? "请简洁总结以下对话：" 
      : "Please summarize the following conversation concisely:";
    
    const context = msgs.map(m => `${m.role}: ${m.text}`).join('\n');
    const fullPrompt = `${summaryPrompt}\n\n${context}`;

    const targetSessionId = currentSessionId;
    const modelMsgId = uuidv4();
    
    // Placeholder
    const initialModelMsg: ChatMessage = {
      id: modelMsgId,
      role: Role.MODEL,
      text: "", 
      timestamp: Date.now()
    };

    const updatedSessions = sessions.map(s => {
      if (s.id === targetSessionId) {
        return { ...s, messages: [...s.messages, initialModelMsg] };
      }
      return s;
    });
    setSessions(updatedSessions);

    try {
      // Use basic flash or gpt-3.5 for summary
      const model = openaiKey 
        ? GEMINI_MODELS.find(m => m.id === 'gpt-3.5-turbo')!
        : GEMINI_MODELS.find(m => m.id === 'gemini-2.5-flash')!;
        
      await streamGeminiResponse(
        model,
        [],
        fullPrompt,
        language === 'zh' ? SYSTEM_INSTRUCTION_ZH : SYSTEM_INSTRUCTION_EN,
        (text) => {
             setSessions((prev) => {
               const news = [...prev];
               const s = news.find(sess => sess.id === targetSessionId);
               const m = s?.messages.find(msg => msg.id === modelMsgId);
               if (m) m.text = text;
               return news;
            }, true);
        },
        getActiveKey(model.provider)!
      );
      
      const finalSessions = sessions.map(s => {
          if (s.id === targetSessionId) {
            const sCurrent = sessions.find(sess => sess.id === targetSessionId); // get latest
            const msg = sCurrent?.messages.find(m => m.id === modelMsgId);
            const ms = s.messages.map(m => m.id === modelMsgId ? { ...m, text: msg ? msg.text : "" } : m);
            return { ...s, messages: ms, updatedAt: Date.now() };
          }
          return s;
      });
      setSessions(finalSessions);
      saveSessionsToStorage(finalSessions, user.id, currentWorkspace);

    } catch (e) {
      console.error(e);
       const revertedSessions = sessions.map(s => {
        if (s.id === targetSessionId) {
          return { ...s, messages: s.messages.filter(m => m.id !== modelMsgId) };
        }
        return s;
      });
      setSessions(revertedSessions);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !user) return;
    
    const apiKey = getActiveKey(selectedModel.provider);
    if (!apiKey) {
      alert(`Missing API Key for ${selectedModel.provider}. Please log out and enter the key.`);
      return;
    }

    const currentUserId = user.id;
    let targetSessionId = currentSessionId;
    let targetSession = sessions.find(s => s.id === targetSessionId);
    let updatedSessions = [...sessions];

    if (!targetSession) {
      const newSession: ChatSession = {
        id: uuidv4(),
        userId: currentUserId,
        title: inputValue.trim().slice(0, 30), 
        messages: [],
        updatedAt: Date.now()
      };
      targetSessionId = newSession.id;
      targetSession = newSession;
      updatedSessions = [newSession, ...sessions];
      setCurrentSessionId(targetSessionId);
    }

    const userText = inputValue.trim();
    setInputValue(""); 
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: Role.USER,
      text: userText,
      timestamp: Date.now()
    };

    targetSession.messages.push(userMsg);
    targetSession.updatedAt = Date.now();
    
    updatedSessions = updatedSessions.filter(s => s.id !== targetSessionId);
    updatedSessions.unshift(targetSession);
    setSessions([...updatedSessions]);
    saveSessionsToStorage(updatedSessions, currentUserId, currentWorkspace);
    
    setIsLoading(true);

    try {
      if (selectedModel.category === 'image') {
        const imageUrl = await generateImage(selectedModel, userText, imageSize, apiKey);
        const modelMsg: ChatMessage = {
          id: uuidv4(),
          role: Role.MODEL,
          text: language === 'zh' ? `图像生成完毕。` : `Image generated successfully.`,
          attachment: { type: 'image', url: imageUrl },
          timestamp: Date.now()
        };
        targetSession.messages.push(modelMsg);

      } else if (selectedModel.category === 'video') {
        const videoUrl = await generateVideo(selectedModel, userText, videoAspectRatio, apiKey);
        const modelMsg: ChatMessage = {
            id: uuidv4(),
            role: Role.MODEL,
            text: language === 'zh' ? `视频生成完毕。` : `Video generated successfully.`,
            attachment: { type: 'video', url: videoUrl },
            timestamp: Date.now()
        };
        targetSession.messages.push(modelMsg);

      } else {
        const modelMsgId = uuidv4();
        const initialModelMsg: ChatMessage = {
          id: modelMsgId,
          role: Role.MODEL,
          text: "", 
          timestamp: Date.now()
        };
        targetSession.messages.push(initialModelMsg);
        setSessions([...updatedSessions]);
        
        // Construct System Instruction based on Persona
        const baseInstruction = language === 'zh' ? SYSTEM_INSTRUCTION_ZH : SYSTEM_INSTRUCTION_EN;
        const persona = PERSONAS.find(p => p.id === currentPersonaId);
        const personaInstruction = persona ? `\n\n${persona.instruction}` : "";
        const finalSystemInstruction = baseInstruction + personaInstruction;

        const finalResponseText = await streamGeminiResponse(
          selectedModel,
          targetSession.messages.slice(0, -1),
          userText,
          finalSystemInstruction,
          (currentFullText) => {
            setSessions((prev) => {
               const news = [...prev];
               const s = news.find(sess => sess.id === targetSessionId);
               const m = s?.messages.find(msg => msg.id === modelMsgId);
               if (m) m.text = currentFullText;
               return news;
            }, true);
          },
          apiKey
        );
        const finalMsg = targetSession.messages.find(m => m.id === modelMsgId);
        if (finalMsg) finalMsg.text = finalResponseText;
      }
      
      saveSessionsToStorage(updatedSessions, currentUserId, currentWorkspace);

    } catch (error: any) {
      console.error("Generation failed", error);
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: Role.MODEL,
        text: language === 'zh' ? `错误：${error.message}` : `Error: ${error.message}`,
        isError: true,
        timestamp: Date.now()
      };
      targetSession.messages.push(errorMsg);
      setSessions([...updatedSessions]);
      saveSessionsToStorage(updatedSessions, currentUserId, currentWorkspace);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, sessions, currentSessionId, selectedModel, user, openaiKey, googleKey, language, imageSize, videoAspectRatio, setSessions, setInputValue, currentWorkspace, currentPersonaId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.shiftKey) {
        if (e.ctrlKey) {
           setInputValue(prev => prev + "\n");
        }
        return; 
      }
      e.preventDefault();
      handleSendMessage();
    }
  };

  const t = UI_TEXT[language];

  if (!user || (!openaiKey && !googleKey)) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} language={language} />;
  }

  const activeMessages = getCurrentMessages();
  
  // Prepare active context for MessageBubble
  const activeKey = getActiveKey(selectedModel.provider);
  const apiContext = activeKey ? { apiKey: activeKey, provider: selectedModel.provider } : undefined;

  return (
    <div className="flex h-screen bg-nexus-900 text-slate-200 font-sans overflow-hidden">
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-nexus-800 border border-nexus-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">{t.clearChat}?</h3>
            <p className="text-sm text-gray-400 mb-6">{t.confirmClear}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-nexus-700 transition-colors"
              >
                {t.cancel}
              </button>
              <button 
                onClick={clearCurrentChat}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                {t.clearChat}
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar 
        isOpen={sidebarOpen} 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={createNewSession}
        onSelectSession={(id) => { setCurrentSessionId(id); setSidebarOpen(false); }}
        onDeleteSession={deleteSession}
        user={user}
        onUpdateUserAvatar={updateUserAvatar}
        onLogout={handleLogout}
        language={language}
        onToggleLanguage={toggleLanguage}
        onUndo={sessionsControl.undo}
        onRedo={sessionsControl.redo}
        canUndo={sessionsControl.canUndo}
        canRedo={sessionsControl.canRedo}
        currentWorkspace={currentWorkspace}
        onSwitchWorkspace={setCurrentWorkspace}
        currentPersonaId={currentPersonaId}
        onUpdatePersona={updatePersona}
      />

      <main className="flex-1 flex flex-col relative w-full h-full transition-all">
        
        <header className="h-16 border-b border-nexus-700 flex items-center justify-between px-4 bg-nexus-900/80 backdrop-blur-md z-20 sticky top-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-nexus-800 rounded-lg transition-colors"
            >
              <MenuIcon />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setModelMenuOpen(!modelMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-nexus-800 rounded-lg transition-colors text-sm font-medium"
              >
                {selectedModel.provider === 'openai' ? <OpenAIIcon /> : <GoogleIcon />}
                <span className={selectedModel.isPro ? "text-purple-400" : "text-emerald-400"}>
                  {selectedModel.name}
                </span>
                <ChevronDownIcon />
              </button>

              {modelMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-nexus-800 border border-nexus-700 rounded-xl shadow-2xl p-2 z-50">
                  {GEMINI_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model);
                        setModelMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm mb-1 transition-colors ${selectedModel.id === model.id ? 'bg-nexus-700' : 'hover:bg-nexus-700/50'}`}
                    >
                      <div className="flex items-center gap-2">
                         {model.provider === 'openai' ? <OpenAIIcon /> : <GoogleIcon />}
                        <span className={`font-semibold ${model.isPro ? 'text-purple-400' : 'text-emerald-400'}`}>
                           {model.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {model.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {currentSessionId && activeMessages.length > 0 && !isLoading && (
              <div className="flex items-center gap-1 border-r border-nexus-700 pr-4 mr-1">
                 <button 
                   onClick={handleSummarize}
                   className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-nexus-800 rounded-lg transition-colors"
                   title={t.summarize}
                 >
                   <SparklesIcon />
                 </button>
                 <button 
                   onClick={() => setShowClearConfirm(true)}
                   className="p-2 text-gray-400 hover:text-red-400 hover:bg-nexus-800 rounded-lg transition-colors"
                   title={t.clearChat}
                 >
                   <BroomIcon />
                 </button>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1 bg-nexus-800 rounded-full border border-nexus-700">
              {isLoading ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-500 tracking-wider">
                    {t.processing}
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-mono text-emerald-500 tracking-wider">{t.ready}</span>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 custom-scrollbar scroll-smooth">
          <div className="max-w-3xl mx-auto min-h-full flex flex-col">
            {activeMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40 select-none">
                <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-2xl animate-pulse-slow"></div>
                <h1 className="text-3xl font-bold mb-2 text-white">{t.welcomeTitle}</h1>
                <p className="text-emerald-400 text-center">{t.welcomeSubtitle}</p>
                {/* Active Persona Badge */}
                {currentPersonaId !== 'default' && (
                  <div className="mt-4 px-3 py-1 bg-nexus-800 rounded-full border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                    Using Persona: {PERSONAS.find(p => p.id === currentPersonaId)?.name}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {activeMessages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} apiContext={apiContext} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-nexus-900 border-t border-nexus-700">
          <div className="max-w-3xl mx-auto relative group">
            
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1">
                <button onClick={() => wrapSelection('**', '**', 'bold text')} className="p-1.5 text-gray-400 hover:text-white hover:bg-nexus-800 rounded transition-colors" title="Bold"><BoldIcon /></button>
                <button onClick={() => wrapSelection('_', '_', 'italic text')} className="p-1.5 text-gray-400 hover:text-white hover:bg-nexus-800 rounded transition-colors" title="Italic"><ItalicIcon /></button>
                <button onClick={() => wrapSelection('`', '`', 'code')} className="p-1.5 text-gray-400 hover:text-white hover:bg-nexus-800 rounded transition-colors" title="Inline Code"><CodeIcon /></button>
                <button onClick={() => wrapSelection('```\n', '\n```', 'code block')} className="p-1.5 text-gray-400 hover:text-white hover:bg-nexus-800 rounded transition-colors" title="Insert Code Block"><CodeBlockIcon /></button>
                <button onClick={() => wrapSelection('[', '](url)', 'link text')} className="p-1.5 text-gray-400 hover:text-white hover:bg-nexus-800 rounded transition-colors" title="Link"><LinkIcon /></button>
                <div className="w-px h-4 bg-nexus-700 mx-2"></div>
                
                {/* Prompt Optimizer */}
                <button 
                  onClick={handleOptimizePrompt}
                  disabled={!inputValue || isOptimizing}
                  className={`p-1.5 rounded transition-colors ${isOptimizing ? 'text-emerald-400 animate-pulse' : 'text-gray-400 hover:text-emerald-400 hover:bg-nexus-800'}`}
                  title={t.optimizer}
                >
                  <MagicWandIcon />
                </button>

                <div className="w-px h-4 bg-nexus-700 mx-2"></div>
                <button onClick={inputControl.undo} disabled={!inputControl.canUndo} className={`p-1.5 rounded transition-colors ${inputControl.canUndo ? 'text-gray-400 hover:text-white hover:bg-nexus-800' : 'text-gray-700 cursor-not-allowed'}`} title="Undo"><UndoIcon /></button>
                <button onClick={inputControl.redo} disabled={!inputControl.canRedo} className={`p-1.5 rounded transition-colors ${inputControl.canRedo ? 'text-gray-400 hover:text-white hover:bg-nexus-800' : 'text-gray-700 cursor-not-allowed'}`} title="Redo"><RedoIcon /></button>
              </div>
            </div>

            <div className="relative rounded-2xl bg-nexus-800/80 backdrop-blur-sm border border-nexus-700 shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 focus-within:shadow-lg focus-within:bg-nexus-800">
                <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? t.listening : t.placeholder}
                className="w-full bg-transparent text-white placeholder-gray-500 rounded-2xl pl-5 pr-14 py-4 focus:outline-none resize-none overflow-hidden text-base font-sans"
                />
                
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                   {/* Voice Input */}
                   <button
                    onClick={toggleListening}
                    className={`
                      p-2.5 rounded-xl transition-all duration-300 transform
                      ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:bg-nexus-700 hover:text-white'}
                    `}
                    title="Voice Input"
                   >
                     {isListening ? <StopIcon /> : <MicIcon />}
                   </button>

                    <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className={`
                        p-2.5 rounded-xl transition-all duration-300 transform
                        ${inputValue.trim() && !isLoading 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover:scale-105' 
                        : 'bg-nexus-700/50 text-gray-500 cursor-not-allowed'}
                    `}
                    >
                    <SendIcon />
                    </button>
                </div>
            </div>
            {isOptimizing && <div className="text-xs text-emerald-400 mt-1 ml-2 font-mono animate-pulse">{t.optimizing}</div>}
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;