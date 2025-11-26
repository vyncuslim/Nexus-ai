import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import AuthScreen from './components/AuthScreen';
import { SendIcon, MenuIcon, ChevronDownIcon, ActivityIcon } from './components/Icon';
import { GEMINI_MODELS, SYSTEM_INSTRUCTION_EN, SYSTEM_INSTRUCTION_ZH, UI_TEXT } from './constants';
import { ChatMessage, Role, ModelConfig, ChatSession, User, Language } from './types';
import { streamGeminiResponse } from './services/geminiService';
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
    setSidebarOpen(false); // Close sidebar on mobile when creating new chat
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

  // Strict Authentication Logic
  const handleAuth = (email: string, isLoginMode: boolean, name?: string): string | null => {
    let usersDb: Record<string, User> = {};
    try {
      const usersDbStr = localStorage.getItem(STORAGE_KEY_USERS_DB);
      if (usersDbStr) usersDb = JSON.parse(usersDbStr);
    } catch (e) {
      console.error("Error loading user DB", e);
    }
    
    const userId = btoa(email.toLowerCase().trim()); // Simple ID generation
    const t = UI_TEXT[language];

    if (isLoginMode) {
      // Login Mode: STRICT CHECK
      if (usersDb[userId]) {
        // Success
        const finalUser = usersDb[userId];
        setUser(finalUser);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(finalUser));
        loadSessions(finalUser.id);
        return null; // No error
      } else {
        // Error: User not found
        return language === 'zh' ? UI_TEXT.zh.authErrorUserNotFound : UI_TEXT.en.authErrorUserNotFound;
      }
    } else {
      // Register Mode: STRICT CHECK
      if (usersDb[userId]) {
        // Error: User already exists
        return language === 'zh' ? UI_TEXT.zh.authErrorUserExists : UI_TEXT.en.authErrorUserExists;
      } else {
        // Success: Create User
        if (!name) return "Name required"; // Should be caught by form, but safe check
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

  // --- UI Helpers ---
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

  // --- Message Handling ---
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    let targetSessionId = currentSessionId;
    let targetSession = sessions.find(s => s.id === targetSessionId);

    // If no session exists, create one implicitly
    let updatedSessions = [...sessions];
    if (!targetSession) {
      const newSession: ChatSession = {
        id: uuidv4(),
        userId: user.id,
        title: inputValue.trim().slice(0, 30) + "...", 
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

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: Role.USER,
      text: userText,
      timestamp: Date.now()
    };

    targetSession.messages.push(userMsg);
    // Update Title if it's the first message
    if (targetSession.messages.length === 1) {
        targetSession.title = userText.slice(0, 30);
    }
    targetSession.updatedAt = Date.now();
    
    // Move to top of list
    updatedSessions = updatedSessions.filter(s => s.id !== targetSessionId);
    updatedSessions.unshift(targetSession);
    
    setSessions([...updatedSessions]);
    // Save immediate user state
    saveSessionsToStorage(updatedSessions, user.id);
    
    setIsLoading(true);

    // 2. Add Model Placeholder
    const modelMsgId = uuidv4();
    const initialModelMsg: ChatMessage = {
      id: modelMsgId,
      role: Role.MODEL,
      text: "", 
      timestamp: Date.now()
    };

    targetSession.messages.push(initialModelMsg);
    setSessions([...updatedSessions]);
    
    try {
      // 3. Stream Response
      const finalResponseText = await streamGeminiResponse(
        selectedModel.id,
        targetSession.messages.slice(0, -1),
        userText,
        language === 'zh' ? SYSTEM_INSTRUCTION_ZH : SYSTEM_INSTRUCTION_EN,
        (currentFullText) => {
          setSessions(prevSessions => {
             const newSessions = [...prevSessions];
             const sess = newSessions.find(s => s.id === targetSessionId);
             if (sess) {
               const msg = sess.messages.find(m => m.id === modelMsgId);
               if (msg) msg.text = currentFullText;
             }
             return newSessions;
          });
        }
      );

      // 4. Save Final State
      setSessions(prevSessions => {
        const newSessions = [...prevSessions];
        const sess = newSessions.find(s => s.id === targetSessionId);
        if (sess) {
          const msg = sess.messages.find(m => m.id === modelMsgId);
          if (msg) {
            msg.text = finalResponseText; // Ensure exact match
          }
          sess.updatedAt = Date.now();
        }
        // Persist to local storage
        saveSessionsToStorage(newSessions, user.id);
        return newSessions;
      });
      
    } catch (error) {
      console.error("Failed to generate", error);
      setSessions(prevSessions => {
        const newSessions = [...prevSessions];
        const sess = newSessions.find(s => s.id === targetSessionId);
        if (sess) {
          const msg = sess.messages.find(m => m.id === modelMsgId);
          if (msg) {
             msg.text = language === 'zh' ? "错误：连接中断，请重试。" : "Error: Connection interrupted. Please try again.";
             msg.isError = true;
          }
        }
        saveSessionsToStorage(newSessions, user.id);
        return newSessions;
     });
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, sessions, currentSessionId, selectedModel.id, user, language]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const t = UI_TEXT[language];

  if (!user) {
    return <AuthScreen onAuth={handleAuth} language={language} />;
  }

  const activeMessages = getCurrentMessages();

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
                <span className={selectedModel.isPro ? "text-purple-400" : "text-nexus-accent"}>
                  {selectedModel.name}
                </span>
                <ChevronDownIcon />
              </button>

              {modelMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-nexus-800 border border-nexus-700 rounded-xl shadow-2xl p-2 z-50">
                  {GEMINI_MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model);
                        setModelMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm mb-1 transition-colors ${selectedModel.id === model.id ? 'bg-nexus-700' : 'hover:bg-nexus-700/50'}`}
                    >
                      <div className={`font-semibold ${model.isPro ? 'text-purple-400' : 'text-nexus-accent'}`}>
                        {model.name}
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

          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 bg-nexus-800 rounded-full border border-nexus-700">
             {isLoading ? (
               <>
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                 </span>
                 <span className="text-[10px] font-mono text-amber-500 tracking-wider">{t.processing}</span>
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
                <p className="text-nexus-accent">{t.welcomeSubtitle}</p>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {activeMessages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-nexus-900 border-t border-nexus-700">
          <div className="max-w-3xl mx-auto relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              className="w-full bg-nexus-800 text-white placeholder-gray-500 border border-nexus-700 rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:border-nexus-accent focus:ring-1 focus:ring-nexus-accent resize-none overflow-hidden transition-all shadow-sm text-base"
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
              Nexus Core v2.0 • {selectedModel.id} • {language.toUpperCase()}
            </span>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;