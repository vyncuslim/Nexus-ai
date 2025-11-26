import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import AuthScreen from './components/AuthScreen';
import { SendIcon, MenuIcon, ChevronDownIcon, ActivityIcon, BoldIcon, ItalicIcon, CodeIcon, ImageIcon, VideoIcon, LinkIcon } from './components/Icon';
import { GEMINI_MODELS, SYSTEM_INSTRUCTION_EN, SYSTEM_INSTRUCTION_ZH, UI_TEXT } from './constants';
import { ChatMessage, Role, ModelConfig, ChatSession, User, Language, Attachment } from './types';
import { streamGeminiResponse, generateImage, generateVideo } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';

function App() {
  // --- Persistent State Keys ---
  const STORAGE_KEY_USER = 'nexus_auth_user';
  const STORAGE_KEY_USERS_DB = 'nexus_users_db';
  const STORAGE_KEY_SESSIONS_PREFIX = 'nexus_sessions_';
  const STORAGE_KEY_PREFS = 'nexus_preferences';

  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(GEMINI_MODELS[0]);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  
  // Media Config State
  const [imageSize, setImageSize] = useState("1K");
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Load Initial State ---
  useEffect(() => {
    // Load Language
    const prefs = localStorage.getItem(STORAGE_KEY_PREFS);
    if (prefs) {
      try {
        const p = JSON.parse(prefs);
        if (p.language) setLanguage(p.language);
      } catch (e) { console.error(e); }
    }

    // Load User
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        loadSessions(u.id);
      } catch (e) { console.error(e); }
    }
  }, []);

  // Protect against closing tab while generating
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLoading) {
        e.preventDefault();
        e.returnValue = ''; // Standard for Chrome
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
  }, [user, sessions]); // Deps needed for createNewSession context

  // --- Session Management Helpers ---
  const loadSessions = (userId: string) => {
    const storedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS_PREFIX + userId);
    if (storedSessions) {
      try {
        const s: ChatSession[] = JSON.parse(storedSessions);
        // Sort by updated at desc
        s.sort((a, b) => b.updatedAt - a.updatedAt);
        setSessions(s);
        // If sessions exist, open the most recent
        if (s.length > 0) {
          setCurrentSessionId(s[0].id);
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
        setSessions([]);
      }
    } else {
      setSessions([]);
    }
  };

  const saveSessionsToStorage = (updatedSessions: ChatSession[], userId: string) => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS_PREFIX + userId, JSON.stringify(updatedSessions));
    } catch (e) {
      console.error("Storage limit reached or error saving sessions", e);
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
    setSidebarOpen(false); // Close sidebar on mobile
    saveSessionsToStorage(updatedSessions, user.id);
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selection
    if (!user) return;
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    saveSessionsToStorage(updatedSessions, user.id);
    
    if (currentSessionId === sessionId) {
      setCurrentSessionId(updatedSessions.length > 0 ? updatedSessions[0].id : null);
    }
  };

  // --- Authentication & User Logic ---
  const handleAuth = (email: string, isLoginMode: boolean, name?: string): string | null => {
    let usersDb: Record<string, User> = {};
    try {
      const usersDbStr = localStorage.getItem(STORAGE_KEY_USERS_DB);
      if (usersDbStr) usersDb = JSON.parse(usersDbStr);
    } catch (e) {
      console.error("Error loading user DB", e);
    }
    
    const userId = btoa(email.toLowerCase().trim()); // Simple ID generation
    
    if (isLoginMode) {
      if (usersDb[userId]) {
        const finalUser = usersDb[userId];
        setUser(finalUser);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(finalUser));
        loadSessions(finalUser.id);
        return null;
      } else {
        return language === 'zh' ? UI_TEXT.zh.authErrorUserNotFound : UI_TEXT.en.authErrorUserNotFound;
      }
    } else {
      if (usersDb[userId]) {
        return language === 'zh' ? UI_TEXT.zh.authErrorUserExists : UI_TEXT.en.authErrorUserExists;
      } else {
        if (!name) return "Name required";
        const finalUser = { id: userId, email, name };
        usersDb[userId] = finalUser;
        
        try {
          localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(usersDb));
        } catch (e) { console.error("Error saving user DB", e); }

        setUser(finalUser);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(finalUser));
        loadSessions(finalUser.id);
        return null;
      }
    }
  };

  const updateUserAvatar = (avatarBase64: string) => {
    if (!user) return;
    const updatedUser = { ...user, avatar: avatarBase64 };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    
    // Update DB
    try {
      const usersDbStr = localStorage.getItem(STORAGE_KEY_USERS_DB);
      if (usersDbStr) {
        const usersDb = JSON.parse(usersDbStr);
        usersDb[user.id] = updatedUser;
        localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(usersDb));
      }
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    setUser(null);
    setSessions([]);
    setCurrentSessionId(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    setSidebarOpen(false);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({ language: newLang }));
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

  const insertMarkdown = (syntax: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = inputValue;
    const selected = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    const newText = `${before}${syntax}${selected}${syntax}${after}`;
    setInputValue(newText);
    textareaRef.current.focus();
    
    // Reset cursor position inside tags
    const newCursorPos = start + syntax.length + selected.length + syntax.length;
    setTimeout(() => {
        if(textareaRef.current) textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertLink = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = inputValue;
    const selected = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);

    const linkText = selected || 'text';
    const newText = `${before}[${linkText}](url)${after}`;
    setInputValue(newText);
    textareaRef.current.focus();
    
    // Highlight "url" part
    const urlStart = start + 1 + linkText.length + 2;
    const urlEnd = urlStart + 3;
    setTimeout(() => {
         if(textareaRef.current) textareaRef.current.setSelectionRange(urlStart, urlEnd);
    }, 0);
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !user) return;
    
    const currentUserId = user.id;
    const currentUserName = user.name;
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

    // 1. User Message
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: Role.USER,
      text: userText,
      timestamp: Date.now()
    };

    targetSession.messages.push(userMsg);
    targetSession.updatedAt = Date.now();
    
    // Sort and Save
    updatedSessions = updatedSessions.filter(s => s.id !== targetSessionId);
    updatedSessions.unshift(targetSession);
    setSessions([...updatedSessions]);
    saveSessionsToStorage(updatedSessions, currentUserId);
    
    setIsLoading(true);

    // 2. Determine Action based on Model Category
    try {
      if (selectedModel.category === 'image') {
        // --- Image Generation ---
        const imageUrl = await generateImage(userText, imageSize);
        const modelMsg: ChatMessage = {
          id: uuidv4(),
          role: Role.MODEL,
          text: language === 'zh' ? `图像生成完毕 (${imageSize})。` : `Image generated successfully (${imageSize}).`,
          attachment: { type: 'image', url: imageUrl },
          timestamp: Date.now()
        };
        targetSession.messages.push(modelMsg);

      } else if (selectedModel.category === 'video') {
        // --- Video Generation ---
        const videoUrl = await generateVideo(userText, videoAspectRatio);
        const modelMsg: ChatMessage = {
          id: uuidv4(),
          role: Role.MODEL,
          text: language === 'zh' ? `视频生成完毕 (${videoAspectRatio})。` : `Video generated successfully (${videoAspectRatio}).`,
          attachment: { type: 'video', url: videoUrl },
          timestamp: Date.now()
        };
        targetSession.messages.push(modelMsg);

      } else {
        // --- Standard Text Chat ---
        const modelMsgId = uuidv4();
        const initialModelMsg: ChatMessage = {
          id: modelMsgId,
          role: Role.MODEL,
          text: "", 
          timestamp: Date.now()
        };
        targetSession.messages.push(initialModelMsg);
        setSessions([...updatedSessions]); // Render placeholder
        
        const systemInstructionWithMemory = language === 'zh'
          ? `${SYSTEM_INSTRUCTION_ZH}\n\n当前用户名称: ${currentUserName}。`
          : `${SYSTEM_INSTRUCTION_EN}\n\nCurrent User Name: ${currentUserName}.`;

        const finalResponseText = await streamGeminiResponse(
          selectedModel.id,
          targetSession.messages.slice(0, -1),
          userText,
          systemInstructionWithMemory,
          (currentFullText) => {
            setSessions(prev => {
               const news = [...prev];
               const s = news.find(sess => sess.id === targetSessionId);
               const m = s?.messages.find(msg => msg.id === modelMsgId);
               if (m) m.text = currentFullText;
               return news;
            });
          }
        );
        // Ensure final state matches
        const finalMsg = targetSession.messages.find(m => m.id === modelMsgId);
        if (finalMsg) finalMsg.text = finalResponseText;
      }
      
      // Success Save
      saveSessionsToStorage(updatedSessions, currentUserId);

    } catch (error: any) {
      console.error("Generation failed", error);
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: Role.MODEL,
        text: language === 'zh' ? `错误：${error.message || "请求失败"}` : `Error: ${error.message || "Request failed"}`,
        isError: true,
        timestamp: Date.now()
      };
      targetSession.messages.push(errorMsg);
      setSessions([...updatedSessions]);
      saveSessionsToStorage(updatedSessions, currentUserId);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, sessions, currentSessionId, selectedModel, user, language, imageSize, videoAspectRatio]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.shiftKey) {
        // Allow new line (default behavior for Shift+Enter, manual for Ctrl+Enter)
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

  if (!user) {
    return <AuthScreen onAuth={handleAuth} language={language} />;
  }

  const activeMessages = getCurrentMessages();

  // Helper text for input based on model
  let inputPlaceholder = t.placeholder;
  if (selectedModel.category === 'image') inputPlaceholder = t.promptPlaceholderImage;
  if (selectedModel.category === 'video') inputPlaceholder = t.promptPlaceholderVideo;

  return (
    <div className="flex h-screen bg-nexus-900 text-slate-200 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
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
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full h-full transition-all">
        
        {/* Header */}
        <header className="h-16 border-b border-nexus-700 flex items-center justify-between px-4 bg-nexus-900/80 backdrop-blur-md z-20 sticky top-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-nexus-800 rounded-lg transition-colors"
            >
              <MenuIcon />
            </button>
            
            {/* Model Selector */}
            <div className="relative">
              <button 
                onClick={() => setModelMenuOpen(!modelMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-nexus-800 rounded-lg transition-colors text-sm font-medium"
              >
                {selectedModel.category === 'image' && <ImageIcon />}
                {selectedModel.category === 'video' && <VideoIcon />}
                <span className={selectedModel.isPro ? "text-purple-400" : "text-nexus-accent"}>
                  {selectedModel.name}
                </span>
                <ChevronDownIcon />
              </button>

              {modelMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-nexus-800 border border-nexus-700 rounded-xl shadow-2xl p-2 z-50 max-h-[80vh] overflow-y-auto">
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
                        {model.category === 'image' && <ImageIcon />}
                        {model.category === 'video' && <VideoIcon />}
                        <span className={`font-semibold ${model.isPro ? 'text-purple-400' : 'text-nexus-accent'}`}>
                           {model.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1 leading-relaxed">
                        {model.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 bg-nexus-800 rounded-full border border-nexus-700">
             {isLoading ? (
               <>
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                 </span>
                 <span className="text-[10px] font-mono text-amber-500 tracking-wider">
                   {selectedModel.category === 'video' ? t.generatingVideo : t.processing}
                 </span>
               </>
             ) : (
               <>
                 <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                 <span className="text-[10px] font-mono text-emerald-500 tracking-wider">{t.ready}</span>
               </>
             )}
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 custom-scrollbar scroll-smooth">
          <div className="max-w-3xl mx-auto min-h-full flex flex-col">
            
            {activeMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40 select-none">
                <div className="w-20 h-20 bg-gradient-to-tr from-nexus-accent to-purple-600 rounded-2xl mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-pulse-slow"></div>
                <h1 className="text-3xl font-bold mb-2 text-white">{t.welcomeTitle}</h1>
                <p className="text-nexus-accent text-center">{t.welcomeSubtitle}</p>
                <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
                   <div className="bg-nexus-800 p-3 rounded text-xs text-gray-400 text-center">Alt + N <br/> New Chat</div>
                   <div className="bg-nexus-800 p-3 rounded text-xs text-gray-400 text-center">Ctrl + Enter <br/> New Line</div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {activeMessages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-nexus-900 border-t border-nexus-700">
          <div className="max-w-3xl mx-auto relative">
            
            {/* Toolbar (Markdown + Media Config) */}
            <div className="flex items-center justify-between mb-2 px-1">
              
              {/* Left: Markdown Tools */}
              <div className="flex items-center gap-1">
                <button onClick={() => insertMarkdown('**')} className="p-1.5 text-gray-400 hover:text-white hover:bg-nexus-800 rounded transition-colors" title="Bold"><BoldIcon /></button>
                <button onClick={() => insertMarkdown('_')} className="p-1.5 text-gray-400 hover:text-white hover:bg-nexus-800 rounded transition-colors" title="Italic"><ItalicIcon /></button>
                <button onClick={() => insertMarkdown('`')} className="p-1.5 text-gray-400 hover:text-white hover:bg-nexus-800 rounded transition-colors" title="Code"><CodeIcon /></button>
                <button onClick={insertLink} className="p-1.5 text-gray-400 hover:text-white hover:bg-nexus-800 rounded transition-colors" title="Link"><LinkIcon /></button>
              </div>

              {/* Right: Model Specific Options */}
              {selectedModel.category === 'image' && (
                <div className="flex items-center gap-1 bg-nexus-800 rounded-lg p-0.5 border border-nexus-700">
                   {["1K", "2K", "4K"].map(size => (
                      <button
                        key={size}
                        onClick={() => setImageSize(size)}
                        className={`text-[10px] px-2 py-1 rounded-md transition-all ${imageSize === size ? 'bg-nexus-700 text-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        {size}
                      </button>
                   ))}
                </div>
              )}

              {selectedModel.category === 'video' && (
                <div className="flex items-center gap-1 bg-nexus-800 rounded-lg p-0.5 border border-nexus-700">
                   {["16:9", "9:16"].map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setVideoAspectRatio(ratio)}
                        className={`text-[10px] px-2 py-1 rounded-md transition-all ${videoAspectRatio === ratio ? 'bg-nexus-700 text-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        {ratio}
                      </button>
                   ))}
                </div>
              )}

            </div>

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
              className="w-full bg-nexus-800 text-white placeholder-gray-500 border border-nexus-700 rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:border-nexus-accent focus:ring-1 focus:ring-nexus-accent resize-none overflow-hidden transition-all shadow-sm text-base font-sans"
            />
            
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className={`
                absolute right-2 bottom-2 p-2.5 rounded-xl transition-all duration-200
                ${inputValue.trim() && !isLoading 
                  ? 'bg-nexus-accent text-white hover:bg-nexus-accentHover shadow-lg' 
                  : 'bg-nexus-700 text-gray-500 cursor-not-allowed'}
              `}
            >
              <SendIcon />
            </button>
          </div>
          <div className="text-center mt-2 flex justify-center items-center gap-2">
            <ActivityIcon />
            <span className="text-[10px] text-gray-600 font-mono">
              Nexus Core v2.1 • {selectedModel.name}
            </span>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;