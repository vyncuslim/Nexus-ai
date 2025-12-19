
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import AuthScreen from './components/AuthScreen';
import { 
  SendIcon, BrainIcon, PinIcon, LabIcon, MemoryIcon, MenuIcon
} from './components/Icon';
import { GEMINI_MODELS, SYSTEM_INSTRUCTION_EN, SYSTEM_INSTRUCTION_ZH, UI_TEXT, PERSONAS } from './constants';
import { ChatMessage, Role, ModelConfig, ChatSession, User, Language, GlobalMemory } from './types';
import { streamGeminiResponse } from './services/geminiService';
import { useHistory } from './hooks/useHistory';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [anthropicKey, setAnthropicKey] = useState<string>('');
  const [deepseekKey, setDeepseekKey] = useState<string>('');
  const [grokKey, setGrokKey] = useState<string>('');
  
  const [language, setLanguage] = useState<Language>('en');
  const [labOpen, setLabOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [pinnedItems, setPinnedItems] = useState<ChatMessage[]>([]);
  const [globalMemories, setGlobalMemories] = useState<GlobalMemory[]>([]);
  
  const [currentPersonaId, setCurrentPersonaId] = useState<string>('default');

  // Sidebar Resizing Logic
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const isResizing = useRef(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = Math.min(Math.max(220, e.clientX), 500);
    setSidebarWidth(newWidth);
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
    localStorage.setItem('nexus_sidebar_width', JSON.stringify(sidebarWidth));
  }, [sidebarWidth]);

  const sessionsControl = useHistory<ChatSession[]>([]);
  const sessions = sessionsControl.state;
  const setSessions = sessionsControl.set;

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const inputControl = useHistory<string>("");
  const inputValue = inputControl.state;
  const setInputValue = inputControl.set;

  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(GEMINI_MODELS[2]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = UI_TEXT[language];

  useEffect(() => {
    const storedUser = localStorage.getItem('nexus_user_v2');
    const storedOpenAI = localStorage.getItem('nexus_openai_key');
    const storedAnthropic = localStorage.getItem('nexus_anthropic_key');
    const storedDeepSeek = localStorage.getItem('nexus_deepseek_key');
    const storedGrok = localStorage.getItem('nexus_grok_key');
    const storedWidth = localStorage.getItem('nexus_sidebar_width');

    if (storedOpenAI) setOpenaiKey(storedOpenAI);
    if (storedAnthropic) setAnthropicKey(storedAnthropic);
    if (storedDeepSeek) setDeepseekKey(storedDeepSeek);
    if (storedGrok) setGrokKey(storedGrok);
    if (storedWidth) setSidebarWidth(JSON.parse(storedWidth));
    
    if (storedUser) { 
      try { setUser(JSON.parse(storedUser)); } catch (e) { console.error(e); } 
    }
    
    const storedPinned = localStorage.getItem('nexus_pinned');
    if (storedPinned) { try { setPinnedItems(JSON.parse(storedPinned)); } catch(e) {} }
    
    const storedMemories = localStorage.getItem('nexus_memories');
    if (storedMemories) { try { setGlobalMemories(JSON.parse(storedMemories)); } catch(e) {} }
  }, []);

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`nexus_sessions_global_${user.id}`);
      if (stored) {
        try {
          const s = JSON.parse(stored);
          setSessions(s, true);
          if (s.length > 0 && !currentSessionId) setCurrentSessionId(s[0].id);
        } catch (e) {}
      }
    }
  }, [user]);

  const handleUpdateApiKeys = (keys: { google?: string, openai?: string, anthropic?: string, deepseek?: string, grok?: string }) => {
    if (keys.openai !== undefined) { setOpenaiKey(keys.openai); localStorage.setItem('nexus_openai_key', keys.openai); }
    if (keys.anthropic !== undefined) { setAnthropicKey(keys.anthropic); localStorage.setItem('nexus_anthropic_key', keys.anthropic); }
    if (keys.deepseek !== undefined) { setDeepseekKey(keys.deepseek); localStorage.setItem('nexus_deepseek_key', keys.deepseek); }
    if (keys.grok !== undefined) { setGrokKey(keys.grok); localStorage.setItem('nexus_grok_key', keys.grok); }
  };

  const handleAuthSuccess = (ic: string, n: string, k: any, a?: string) => {
    const u: User = { 
      id: btoa(ic + n), 
      name: n, 
      email: ic, 
      avatar: a,
      isAdmin: ic === 'NEXUS-0001', 
      inviteCode: ic
    };
    setUser(u);
    handleUpdateApiKeys(k);
    localStorage.setItem('nexus_user_v2', JSON.stringify(u));
  };

  const addMemory = (content: string) => {
    if (!content.trim()) return;
    const newMem: GlobalMemory = { id: uuidv4(), content, enabled: true, timestamp: Date.now() };
    const updated = [newMem, ...globalMemories];
    setGlobalMemories(updated);
    localStorage.setItem('nexus_memories', JSON.stringify(updated));
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    let providerKey = "";
    if (selectedModel.provider === 'openai') providerKey = openaiKey;
    else if (selectedModel.provider === 'anthropic') providerKey = anthropicKey;
    else if (selectedModel.provider === 'deepseek') providerKey = deepseekKey;
    else if (selectedModel.provider === 'grok') providerKey = grokKey;
    else if (selectedModel.provider === 'google') providerKey = process.env.API_KEY as string;

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
    localStorage.setItem(`nexus_sessions_global_${user.id}`, JSON.stringify(updated));

    if (selectedModel.provider !== 'google' && (!providerKey || providerKey.trim() === "")) {
      target.messages.push({ 
        id: uuidv4(), 
        role: Role.MODEL, 
        text: `Error: No API key provided for ${selectedModel.provider.toUpperCase()}. Please configure it in Settings.`, 
        isError: true, 
        timestamp: Date.now() 
      });
      setSessions([...updated]);
      return;
    }

    setIsLoading(true);

    try {
      const mid = uuidv4();
      target.messages.push({ id: mid, role: Role.MODEL, text: "", timestamp: Date.now() });
      setSessions([...updated]);
      
      const persona = PERSONAS.find(p => p.id === currentPersonaId)?.instruction || "";
      const sys = (language === 'zh' ? SYSTEM_INSTRUCTION_ZH : SYSTEM_INSTRUCTION_EN) + "\n" + persona;
      
      const res = await streamGeminiResponse(
        selectedModel, target.messages.slice(0, -1), text, sys, 
        (txt) => {
          setSessions(p => {
            const n = [...p];
            const s = n.find(sess => sess.id === targetId);
            const m = s?.messages.find(msg => msg.id === mid);
            if (m) m.text = txt;
            return n;
          }, true);
        }, providerKey
      );
      
      const final = target.messages.find(m => m.id === mid);
      if (final) { final.text = res.text; final.groundingMetadata = res.groundingMetadata; }
      localStorage.setItem(`nexus_sessions_global_${user.id}`, JSON.stringify(updated));
    } catch (e: any) {
      target.messages.push({ id: uuidv4(), role: Role.MODEL, text: `Operational Error: ${e.message}`, isError: true, timestamp: Date.now() });
      setSessions([...updated]);
    } finally { setIsLoading(false); }
  }, [inputValue, isLoading, sessions, currentSessionId, selectedModel, user, openaiKey, anthropicKey, deepseekKey, grokKey, language, currentPersonaId]);

  if (!user) return <AuthScreen onAuthSuccess={handleAuthSuccess} language={language} />;

  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  return (
    <div className="flex h-screen mothership-bg text-slate-300 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <Sidebar 
        isOpen={isMobileSidebarOpen} sessions={sessions} currentSessionId={currentSessionId} 
        onNewChat={() => { setCurrentSessionId(null); setIsMobileSidebarOpen(false); }}
        onSelectSession={(id) => { setCurrentSessionId(id); setIsMobileSidebarOpen(false); }}
        onDeleteSession={(id, e) => { e.stopPropagation(); setSessions(sessions.filter(s => s.id !== id)); }} 
        user={user} onLogout={() => { localStorage.removeItem('nexus_user_v2'); setUser(null); }} language={language}
        onToggleLanguage={() => setLanguage(language === 'en' ? 'zh' : 'en')} 
        currentPersonaId={currentPersonaId} onUpdatePersona={setCurrentPersonaId}
        apiKeys={{ google: "", openai: openaiKey, anthropic: anthropicKey, deepseek: deepseekKey, grok: grokKey }}
        onUpdateApiKeys={handleUpdateApiKeys}
        width={sidebarWidth}
      />

      {/* Resize Handle - Hidden on Mobile */}
      <div 
        onMouseDown={startResizing}
        className="hidden lg:flex w-1 h-full cursor-col-resize hover:bg-nexus-accent/40 active:bg-nexus-accent/60 transition-colors z-50 items-center justify-center group"
      >
        <div className="w-[1px] h-16 bg-white/5 group-hover:bg-nexus-accent/50 transition-colors"></div>
      </div>

      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${labOpen ? 'xl:mr-80' : 'mr-0'}`}>
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 z-20 border-b border-white/5 bg-nexus-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-4">
             <button 
               onClick={() => setIsMobileSidebarOpen(true)}
               className="lg:hidden p-2 text-gray-500 hover:text-white transition-colors"
             >
               <MenuIcon />
             </button>
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-nexus-accent shadow-glow animate-pulse"></div>
               <span className="text-[10px] font-black font-mono text-nexus-accent uppercase tracking-widest hidden sm:inline">Uplink_Online</span>
             </div>
             
             <div className="flex items-center gap-2 px-2 py-0.5 bg-white/5 border border-white/5 rounded-full overflow-hidden max-w-[120px] sm:max-w-none">
                <select 
                  value={selectedModel.id}
                  onChange={(e) => setSelectedModel(GEMINI_MODELS.find(m => m.id === e.target.value) || GEMINI_MODELS[2])}
                  className="bg-transparent text-[9px] sm:text-[10px] font-bold text-gray-400 outline-none cursor-pointer uppercase tracking-tighter w-full"
                >
                  {GEMINI_MODELS.map(m => (
                    <option key={m.id} value={m.id} className="bg-nexus-900">{m.name}</option>
                  ))}
                </select>
             </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLabOpen(!labOpen)} 
              className={`p-2 rounded-xl transition-all ${labOpen ? 'text-nexus-accent bg-nexus-accent/10' : 'text-gray-500 hover:text-white'}`}
            >
              <LabIcon />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar">
          <div className="max-w-3xl mx-auto min-h-full flex flex-col">
            {currentMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20 select-none text-center">
                <div className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center mb-6 border-white/10">
                  <BrainIcon />
                </div>
                <h1 className="text-xl font-black italic text-white uppercase tracking-tighter">Nexus Mothership</h1>
                <p className="text-[9px] text-gray-600 font-mono tracking-[0.4em] mt-2 uppercase">Protocol_Bridge_Active</p>
              </div>
            ) : (
              <div className="space-y-6 pb-28">
                {currentMessages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} apiContext={{ 
                    apiKey: (selectedModel.provider === 'openai' ? openaiKey : (selectedModel.provider === 'anthropic' ? anthropicKey : (selectedModel.provider === 'deepseek' ? deepseekKey : (selectedModel.provider === 'grok' ? grokKey : "")))), 
                    provider: selectedModel.provider 
                  }} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-8 py-6 absolute bottom-0 left-0 right-0 pointer-events-none">
          <div className="max-w-3xl mx-auto glass-panel p-2 rounded-[2rem] pointer-events-auto border-white/10 shadow-2xl backdrop-blur-3xl ring-1 ring-white/5">
            <div className="flex items-end gap-2 px-2 py-1">
               <textarea 
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder={t.placeholder}
                className="flex-1 bg-transparent text-white px-3 py-3 focus:outline-none resize-none text-sm placeholder-gray-800 min-h-[44px] max-h-48 custom-scrollbar"
               />
               <button 
                 onClick={handleSendMessage} 
                 disabled={isLoading || !inputValue.trim()} 
                 className={`p-3 rounded-2xl transition-all shadow-lg active:scale-90 ${inputValue.trim() && !isLoading ? 'bg-nexus-accent text-black font-bold' : 'bg-white/5 text-gray-700 opacity-20'}`}
               >
                 {isLoading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <SendIcon />}
               </button>
            </div>
          </div>
        </div>
      </div>

      <aside className={`fixed inset-y-0 right-0 z-40 w-full sm:w-80 glass-panel border-l transform transition-all duration-500 ease-in-out ${labOpen ? 'translate-x-0' : 'translate-x-full'} bg-nexus-950/95 backdrop-blur-3xl shadow-2xl flex flex-col`}>
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="text-[10px] font-black tracking-widest text-white uppercase flex items-center gap-2">
             <LabIcon /> ANALYTICS_LAB
          </div>
          <button onClick={() => setLabOpen(false)} className="text-gray-500 hover:text-white p-2 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
           <section>
              <h3 className="text-[10px] font-black text-gray-600 uppercase mb-3 flex items-center gap-2 tracking-widest"><MemoryIcon /> Neural Memory</h3>
              <input 
                type="text" 
                placeholder="Log fact..."
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-nexus-accent/30 transition-all placeholder-gray-800 mb-4"
                onKeyDown={(e) => { if (e.key === 'Enter') { addMemory((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
              />
              <div className="space-y-2">
                 {globalMemories.map(mem => (
                   <div key={mem.id} className="p-3 prism-card rounded-xl flex items-center justify-between group/mem animate-in fade-in slide-in-from-right-2 border-white/5">
                      <p className="text-xs text-gray-400 flex-1">{mem.content}</p>
                      <button onClick={() => setGlobalMemories(p => p.filter(m => m.id !== mem.id))} className="opacity-0 group-hover/mem:opacity-100 text-red-500/50 hover:text-red-500 ml-2">✕</button>
                   </div>
                 ))}
              </div>
           </section>
        </div>
      </aside>
    </div>
  );
}

export default App;
