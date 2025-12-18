import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import AuthScreen from './components/AuthScreen';
import { SendIcon, MenuIcon, ChevronDownIcon, BoldIcon, ItalicIcon, CodeIcon, ImageIcon, VideoIcon, LinkIcon, UndoIcon, RedoIcon, SparklesIcon, BroomIcon, GoogleIcon, OpenAIIcon, CodeBlockIcon, MicIcon, MagicWandIcon, StopIcon, GlobeIcon, BrainIcon, UploadIcon } from './components/Icon';
import { GEMINI_MODELS, SYSTEM_INSTRUCTION_EN, SYSTEM_INSTRUCTION_ZH, UI_TEXT, PERSONAS } from './constants';
import { ChatMessage, Role, ModelConfig, ChatSession, User, Language } from './types';
import { streamGeminiResponse, generateImage, generateVideo } from './services/geminiService';
import { useHistory } from './hooks/useHistory';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from "@google/genai";

declare const google: any;

const DEFAULT_GOOGLE_CLIENT_ID = "597221340810-08rd8e05gs8cvm32afrk8b5i0prl2n3m.apps.googleusercontent.com";

function App() {
  const STORAGE_KEY_USER = 'nexus_user_v2';
  const STORAGE_KEY_OPENAI_KEY = 'nexus_openai_key';
  const STORAGE_KEY_GOOGLE_KEY = 'nexus_google_key';
  const STORAGE_KEY_ANTHROPIC_KEY = 'nexus_anthropic_key';
  const STORAGE_KEY_GOOGLE_CLIENT_ID = 'nexus_google_client_id';
  const STORAGE_KEY_INVITE_CODE = 'nexus_invite_code';
  const STORAGE_KEY_SESSIONS = 'nexus_sessions_global';
  const STORAGE_KEY_PREFS = 'nexus_preferences';

  const [user, setUser] = useState<User | null>(null);
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [googleKey, setGoogleKey] = useState<string>('');
  const [anthropicKey, setAnthropicKey] = useState<string>('');
  const [googleClientId, setGoogleClientId] = useState<string>(DEFAULT_GOOGLE_CLIENT_ID);
  
  const [language, setLanguage] = useState<Language>('en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPersonaId, setCurrentPersonaId] = useState<string>('default');
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);

  const sessionsControl = useHistory<ChatSession[]>([]);
  const sessions = sessionsControl.state;
  const setSessions = sessionsControl.set;

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const inputControl = useHistory<string>("");
  const inputValue = inputControl.state;
  const setInputValue = inputControl.set;

  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(GEMINI_MODELS[0]);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [imageSize, setImageSize] = useState("1K");
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const t = UI_TEXT[language];

  useEffect(() => {
    const prefs = localStorage.getItem(STORAGE_KEY_PREFS);
    if (prefs) {
      try {
        const p = JSON.parse(prefs);
        if (p.language) setLanguage(p.language);
        if (p.personaId) setCurrentPersonaId(p.personaId);
      } catch (e) {}
    }

    const storedOpenAI = localStorage.getItem(STORAGE_KEY_OPENAI_KEY);
    const storedGoogle = localStorage.getItem(STORAGE_KEY_GOOGLE_KEY);
    const storedAnthropic = localStorage.getItem(STORAGE_KEY_ANTHROPIC_KEY);
    const storedClientId = localStorage.getItem(STORAGE_KEY_GOOGLE_CLIENT_ID);
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    const storedInvite = localStorage.getItem(STORAGE_KEY_INVITE_CODE);

    if (storedOpenAI) setOpenaiKey(storedOpenAI);
    if (storedGoogle) setGoogleKey(storedGoogle);
    if (storedAnthropic) setAnthropicKey(storedAnthropic);
    if (storedClientId) setGoogleClientId(storedClientId);
    else setGoogleClientId(DEFAULT_GOOGLE_CLIENT_ID);

    if (storedUser && storedInvite) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (user) loadSessions(user.id);
  }, [user]);

  const loadSessions = (userId: string) => {
    const key = `${STORAGE_KEY_SESSIONS}_${userId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const s = JSON.parse(stored);
        s.sort((a: any, b: any) => b.updatedAt - a.updatedAt);
        setSessions(s, true);
        if (s.length > 0) setCurrentSessionId(s[0].id);
      } catch (e) { setSessions([], true); }
    } else {
      setSessions([], true);
      setCurrentSessionId(null);
    }
  };

  const saveSessionsToStorage = (updated: ChatSession[], userId: string) => {
    localStorage.setItem(`${STORAGE_KEY_SESSIONS}_${userId}`, JSON.stringify(updated));
  };

  const createNewSession = () => {
    if (!user) return;
    const newSession = { id: uuidv4(), userId: user.id, title: "", messages: [], updatedAt: Date.now() };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setCurrentSessionId(newSession.id);
    setSidebarOpen(false);
    saveSessionsToStorage(updated, user.id);
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    saveSessionsToStorage(updated, user.id);
    if (currentSessionId === sessionId) setCurrentSessionId(updated.length > 0 ? updated[0].id : null);
  };

  const clearCurrentChat = () => {
    if (!user || !currentSessionId) return;
    const updated = sessions.map(s => s.id === currentSessionId ? { ...s, messages: [], updatedAt: Date.now() } : s);
    setSessions(updated);
    saveSessionsToStorage(updated, user.id);
    setShowClearConfirm(false);
  };

  const handleAuthSuccess = (inviteCode: string, name: string, keys: { openai?: string, google?: string, anthropic?: string, googleClientId?: string }, avatar?: string) => {
    const u = { id: btoa(inviteCode + name), name, email: inviteCode, avatar };
    setUser(u);
    if (keys.openai) { setOpenaiKey(keys.openai); localStorage.setItem(STORAGE_KEY_OPENAI_KEY, keys.openai); }
    if (keys.google) { setGoogleKey(keys.google); localStorage.setItem(STORAGE_KEY_GOOGLE_KEY, keys.google); }
    if (keys.anthropic) { setAnthropicKey(keys.anthropic); localStorage.setItem(STORAGE_KEY_ANTHROPIC_KEY, keys.anthropic); }
    if (keys.googleClientId) { setGoogleClientId(keys.googleClientId); localStorage.setItem(STORAGE_KEY_GOOGLE_CLIENT_ID, keys.googleClientId); }
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(u));
    localStorage.setItem(STORAGE_KEY_INVITE_CODE, inviteCode);
  };

  const updateApiKeys = (keys: { google?: string, openai?: string, anthropic?: string, googleClientId?: string }) => {
    if (keys.google !== undefined) { setGoogleKey(keys.google); localStorage.setItem(STORAGE_KEY_GOOGLE_KEY, keys.google); }
    if (keys.openai !== undefined) { setOpenaiKey(keys.openai); localStorage.setItem(STORAGE_KEY_OPENAI_KEY, keys.openai); }
    if (keys.anthropic !== undefined) { setAnthropicKey(keys.anthropic); localStorage.setItem(STORAGE_KEY_ANTHROPIC_KEY, keys.anthropic); }
    if (keys.googleClientId !== undefined) { setGoogleClientId(keys.googleClientId); localStorage.setItem(STORAGE_KEY_GOOGLE_CLIENT_ID, keys.googleClientId); }
  };

  const updateUserAvatar = (avatar: string) => {
    if (!user) return;
    const updated = { ...user, avatar };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
  };

  const linkGoogleAccount = async () => {
    if (!user) return;

    if (typeof google === 'undefined' || !google.accounts) {
      alert("Google Identity Services failed to load. Please check your internet connection.");
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.access_token) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              if (!res.ok) throw new Error("Profile fetch failed");
              const data = await res.json();
              
              const updated = { 
                ...user, 
                isGoogleLinked: true, 
                avatar: user.avatar || data.picture, 
                name: (user.name === "Guest" || !user.name) ? data.name : user.name,
                email: data.email || user.email
              };
              
              setUser(updated);
              localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
              alert(`Linked to Google Account: ${data.email}`);
            } catch (err) {
              const updated = { ...user, isGoogleLinked: true };
              setUser(updated);
              localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
              alert("Google Account linked!");
            }
          }
        },
        error_callback: (err: any) => {
           console.error("OAuth Error:", err);
           if (err.type === 'popup_closed') {
             alert("Google Sign-In window closed. This happens if you cancel the login or if your browser blocks popups.\n\nTips:\n1. Ensure popups are allowed for this site.\n2. Do not close the window before finishing login.");
           } else if (err.type === 'popup_blocked_by_browser') {
             alert("The Google Sign-In window was blocked by your browser. Please allow popups for this site.");
           } else {
             alert(`Google Authorization failed.\n\nType: ${err.type || 'unknown'}\n\nCheck if this origin is authorized in Google Cloud Console:\n${window.location.origin}\n\nClient ID: ${googleClientId}`);
           }
        }
      });
      client.requestAccessToken();
    } catch (e: any) {
      console.error("GIS Init Error", e);
      alert("Failed to initialize Google Authentication flow.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSessions([], true);
    setCurrentSessionId(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_INVITE_CODE);
    setSidebarOpen(false);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS) || '{}');
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({ ...prefs, language: newLang }));
  };

  const updatePersona = (id: string) => {
    setCurrentPersonaId(id);
    const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS) || '{}');
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({ ...prefs, personaId: id }));
  }

  const toggleListening = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech not supported."); return; }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US';
    recognition.onresult = (e: any) => setInputValue(p => p + " " + e.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  const getActiveKey = (provider: string) => {
    if (provider === 'openai' || provider === 'codex') return openaiKey;
    if (provider === 'google') return googleKey || process.env.API_KEY;
    if (provider === 'anthropic') return anthropicKey;
    return null;
  };

  const handleShareChat = () => {
    if (!currentSessionId) return;
    const link = `${window.location.origin}/share/${currentSessionId}`;
    navigator.clipboard.writeText(link);
    setShareLink(t.shareSuccess);
    setTimeout(() => setShareLink(null), 2000);
  };

  const wrapSelection = (prefix: string, suffix: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    const newText = before + prefix + selection + suffix + after;
    setInputValue(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + prefix.length, end + prefix.length);
      }
    }, 0);
  };

  const handleOptimizePrompt = async () => {
    const key = getActiveKey('google');
    if (!inputValue.trim() || isOptimizing || !key) return;
    setIsOptimizing(true);
    try {
       const ai = new GoogleGenAI({ apiKey: key });
       const res = await ai.models.generateContent({
         model: 'gemini-3-flash-preview',
         contents: `Optimize this prompt for better AI results: ${inputValue}`
       });
       if (res.text) setInputValue(res.text.trim());
    } catch (e) {} finally { setIsOptimizing(false); }
  };

  const handleSendMessage = useCallback(async () => {
    const key = getActiveKey(selectedModel.provider);
    if (!inputValue.trim() || isLoading || !user || !key) return;
    
    let targetId = currentSessionId;
    let target = sessions.find(s => s.id === targetId);
    let updated = [...sessions];

    if (!target) {
      target = { id: uuidv4(), userId: user.id, title: inputValue.slice(0, 30), messages: [], updatedAt: Date.now() };
      targetId = target.id;
      updated = [target, ...sessions];
      setCurrentSessionId(targetId);
    }

    const text = inputValue.trim();
    setInputValue("");
    target.messages.push({ id: uuidv4(), role: Role.USER, text, timestamp: Date.now() });
    target.updatedAt = Date.now();
    updated = [target, ...updated.filter(s => s.id !== targetId)];
    setSessions(updated);
    saveSessionsToStorage(updated, user.id);
    setIsLoading(true);

    try {
      if (selectedModel.category === 'image') {
        const url = await generateImage(selectedModel, text, imageSize, key);
        target.messages.push({ id: uuidv4(), role: Role.MODEL, text: "Image generated.", attachment: { type: 'image', url }, timestamp: Date.now() });
      } else if (selectedModel.category === 'video') {
        const url = await generateVideo(selectedModel, text, videoAspectRatio, key);
        target.messages.push({ id: uuidv4(), role: Role.MODEL, text: "Video generated.", attachment: { type: 'video', url }, timestamp: Date.now() });
      } else {
        const mid = uuidv4();
        target.messages.push({ id: mid, role: Role.MODEL, text: "", timestamp: Date.now() });
        setSessions([...updated]);
        const res = await streamGeminiResponse(selectedModel, target.messages.slice(0, -1), text, (language === 'zh' ? SYSTEM_INSTRUCTION_ZH : SYSTEM_INSTRUCTION_EN) + (PERSONAS.find(p => p.id === currentPersonaId)?.instruction || ""), (txt) => {
            setSessions(p => {
               const n = [...p];
               const s = n.find(sess => sess.id === targetId);
               const m = s?.messages.find(msg => msg.id === mid);
               if (m) m.text = txt;
               return n;
            }, true);
          }, key, { useSearch: useSearch && selectedModel.provider === 'google', useThinking: useThinking && selectedModel.provider === 'google' });
        const final = target.messages.find(m => m.id === mid);
        if (final) { final.text = res.text; final.groundingMetadata = res.groundingMetadata; }
      }
      saveSessionsToStorage(updated, user.id);
    } catch (e) {
      target.messages.push({ id: uuidv4(), role: Role.MODEL, text: `Error: ${e.message}`, isError: true, timestamp: Date.now() });
      setSessions([...updated]);
    } finally { setIsLoading(false); }
  }, [inputValue, isLoading, sessions, currentSessionId, selectedModel, user, openaiKey, googleKey, anthropicKey, language, imageSize, videoAspectRatio, currentPersonaId, useSearch, useThinking]);

  if (!user) return <AuthScreen onAuthSuccess={handleAuthSuccess} language={language} initialClientId={googleClientId} />;

  const activeKey = getActiveKey(selectedModel.provider);
  const msgs = sessions.find(s => s.id === currentSessionId)?.messages || [];

  return (
    <div className="flex h-screen bg-nexus-900 text-slate-200 font-sans overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-nexus-800 border border-nexus-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">{t.clearChat}?</h3>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-nexus-700">{t.cancel}</button>
              <button onClick={clearCurrentChat} className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white">{t.clearChat}</button>
            </div>
          </div>
        </div>
      )}

      <Sidebar 
        isOpen={sidebarOpen} sessions={sessions} currentSessionId={currentSessionId} onNewChat={createNewSession}
        onSelectSession={(id) => { setCurrentSessionId(id); setSidebarOpen(false); }}
        onDeleteSession={deleteSession} user={user} onUpdateUserAvatar={updateUserAvatar}
        onLinkGoogle={linkGoogleAccount} onLogout={handleLogout} language={language}
        onToggleLanguage={toggleLanguage} onUndo={sessionsControl.undo} onRedo={sessionsControl.redo}
        canUndo={sessionsControl.canUndo} canRedo={sessionsControl.canRedo} currentPersonaId={currentPersonaId}
        onUpdatePersona={updatePersona} apiKeys={{ google: googleKey, openai: openaiKey, anthropic: anthropicKey }}
        googleClientId={googleClientId} onUpdateApiKeys={updateApiKeys}
      />

      <main className="flex-1 flex flex-col relative w-full h-full transition-all">
        <header className="h-16 border-b border-nexus-700 flex items-center justify-between px-4 bg-nexus-900/80 backdrop-blur-md z-20 sticky top-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 hover:bg-nexus-800 rounded-lg"><MenuIcon /></button>
            <div className="relative">
              <button onClick={() => setModelMenuOpen(!modelMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-nexus-800 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-nexus-700">
                {selectedModel.provider === 'google' ? <GoogleIcon /> : <OpenAIIcon />}
                <span className={selectedModel.isPro ? "text-purple-400" : "text-emerald-400"}>{selectedModel.name}</span>
                <ChevronDownIcon />
              </button>
              {modelMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-nexus-800 border border-nexus-700 rounded-xl shadow-2xl p-2 z-50">
                  {GEMINI_MODELS.map(model => (
                    <button key={model.id} onClick={() => { setSelectedModel(model); setModelMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm mb-1 ${selectedModel.id === model.id ? 'bg-nexus-700' : 'hover:bg-nexus-700/50'}`}>
                      <div className="flex items-center gap-2">
                        {model.provider === 'google' ? <GoogleIcon /> : <OpenAIIcon />}
                        <span className={`font-semibold ${model.isPro ? 'text-purple-400' : 'text-emerald-400'}`}>{model.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedModel.provider === 'google' && selectedModel.category === 'text' && (
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-nexus-700/50">
                <button onClick={() => setUseSearch(!useSearch)} className={`px-2 py-1 rounded-lg text-xs border ${useSearch ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50' : 'text-gray-400 border-transparent'}`}>Search</button>
                <button onClick={() => setUseThinking(!useThinking)} className={`px-2 py-1 rounded-lg text-xs border ${useThinking ? 'bg-purple-900/30 text-purple-400 border-purple-500/50' : 'text-gray-400 border-transparent'}`}>Think</button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
             {currentSessionId && !isLoading && (
               <div className="flex items-center gap-1 border-r border-nexus-700 pr-4">
                 <button onClick={handleShareChat} className="p-2 text-gray-400 hover:text-white" title="Share"><UploadIcon /></button>
                 <button onClick={() => setShowClearConfirm(true)} className="p-2 text-gray-400 hover:text-red-400" title="Clear"><BroomIcon /></button>
               </div>
             )}
             <div className="flex items-center gap-2 px-3 py-1 bg-nexus-800 rounded-full border border-nexus-700">
               {isLoading ? <span className="text-[10px] text-amber-500 font-mono tracking-widest uppercase">{t.processing}</span> : <span className="text-[10px] text-emerald-500 font-mono tracking-widest uppercase">{t.ready}</span>}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto min-h-full flex flex-col">
            {msgs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40 select-none text-center">
                <div className="w-20 h-20 bg-nexus-800 rounded-3xl flex items-center justify-center mb-6 border border-nexus-700 shadow-xl">
                  <BrainIcon />
                </div>
                <h1 className="text-3xl font-bold mb-2 text-white">{t.welcomeTitle}</h1>
                <p className="text-emerald-400 font-mono text-sm tracking-tighter uppercase">{t.welcomeSubtitle}</p>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {msgs.map((msg) => <MessageBubble key={msg.id} message={msg} apiContext={activeKey ? { apiKey: activeKey, provider: selectedModel.provider } : undefined} />)}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-nexus-900 border-t border-nexus-700">
          <div className="max-w-3xl mx-auto relative group">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1">
                <button onClick={() => wrapSelection('**', '**')} className="p-1.5 text-gray-400 hover:text-white" title="Bold"><BoldIcon /></button>
                <button onClick={() => wrapSelection('_', '_')} className="p-1.5 text-gray-400 hover:text-white" title="Italic"><ItalicIcon /></button>
                <button onClick={handleOptimizePrompt} className={`p-1.5 rounded ${isOptimizing ? 'text-emerald-400 animate-pulse' : 'text-gray-400 hover:text-emerald-400'}`} title={t.optimizer}><MagicWandIcon /></button>
              </div>
            </div>
            <div className="relative rounded-2xl bg-nexus-800/80 border border-nexus-700 focus-within:border-emerald-500/50 transition-all">
              <textarea ref={textareaRef} rows={1} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder={isListening ? t.listening : t.placeholder} className="w-full bg-transparent text-white pl-5 pr-14 py-4 focus:outline-none resize-none overflow-hidden" />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <button onClick={toggleListening} className={`p-2.5 rounded-xl ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-white'}`}>{isListening ? <StopIcon /> : <MicIcon />}</button>
                <button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className={`p-2.5 rounded-xl ${inputValue.trim() && !isLoading ? 'bg-emerald-500 text-white shadow-lg' : 'bg-nexus-700/50 text-gray-500'}`}><SendIcon /></button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;