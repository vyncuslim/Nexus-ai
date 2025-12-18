import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import AuthScreen from './components/AuthScreen';
import { 
  SendIcon, MenuIcon, BroomIcon, GoogleIcon, 
  OpenAIIcon, BrainIcon, PinIcon, CommandIcon, LabIcon,
  MemoryIcon
} from './components/Icon';
import { GEMINI_MODELS, SYSTEM_INSTRUCTION_EN, SYSTEM_INSTRUCTION_ZH, UI_TEXT, PERSONAS } from './constants';
import { ChatMessage, Role, ModelConfig, ChatSession, User, Language, GlobalMemory } from './types';
import { streamGeminiResponse } from './services/geminiService';
import { useHistory } from './hooks/useHistory';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [googleKey, setGoogleKey] = useState<string>('');
  const [anthropicKey, setAnthropicKey] = useState<string>('');
  
  const [language, setLanguage] = useState<Language>('en');
  const [labOpen, setLabOpen] = useState(false);
  const [pinnedItems, setPinnedItems] = useState<ChatMessage[]>([]);
  const [globalMemories, setGlobalMemories] = useState<GlobalMemory[]>([]);
  
  const [commandBarOpen, setCommandBarOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  
  const [currentPersonaId, setCurrentPersonaId] = useState<string>('default');
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);

  const sessionsControl = useHistory<ChatSession[]>([]);
  const sessions = sessionsControl.state;
  const setSessions = sessionsControl.set;

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const inputControl = useHistory<string>("");
  const inputValue = inputControl.state;
  const setInputValue = inputControl.set;

  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(GEMINI_MODELS[3]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const t = UI_TEXT[language];

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCommandBarOpen(prev => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('nexus_user_v2');
    const storedOpenAI = localStorage.getItem('nexus_openai_key');
    const storedGoogle = localStorage.getItem('nexus_google_key');
    const storedAnthropic = localStorage.getItem('nexus_anthropic_key');

    if (storedOpenAI) setOpenaiKey(storedOpenAI);
    if (storedGoogle) setGoogleKey(storedGoogle);
    if (storedAnthropic) setAnthropicKey(storedAnthropic);
    if (storedUser) { try { setUser(JSON.parse(storedUser)); } catch (e) {} }
    
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

  const saveSessionsToStorage = (updated: ChatSession[], userId: string) => {
    localStorage.setItem(`nexus_sessions_global_${userId}`, JSON.stringify(updated));
  };

  const handleUpdateApiKeys = (keys: { google?: string, openai?: string, anthropic?: string }) => {
    if (keys.google !== undefined) { setGoogleKey(keys.google); localStorage.setItem('nexus_google_key', keys.google); }
    if (keys.openai !== undefined) { setOpenaiKey(keys.openai); localStorage.setItem('nexus_openai_key', keys.openai); }
    if (keys.anthropic !== undefined) { setAnthropicKey(keys.anthropic); localStorage.setItem('nexus_anthropic_key', keys.anthropic); }
  };

  const handleAuthSuccess = (inviteCode: string, name: string, keys: { openai?: string, google?: string, anthropic?: string }, avatar?: string) => {
    const u = { id: btoa(inviteCode + name), name, email: inviteCode, avatar };
    setUser(u);
    handleUpdateApiKeys(keys);
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
    const providerKey = selectedModel.provider === 'openai' ? openaiKey : (selectedModel.provider === 'anthropic' ? anthropicKey : (googleKey || process.env.API_KEY));
    if (!inputValue.trim() || isLoading || !user || !providerKey) return;
    
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
      const mid = uuidv4();
      target.messages.push({ id: mid, role: Role.MODEL, text: "", timestamp: Date.now() });
      setSessions([...updated]);
      
      const activeMemories = globalMemories.filter(m => m.enabled).map(m => `- ${m.content}`).join('\n');
      const memoryContext = activeMemories ? `\n[MEMBERED USER FACTS & PREFERENCES]:\n${activeMemories}\n` : "";
      
      const persona = PERSONAS.find(p => p.id === currentPersonaId)?.instruction || "";
      const sys = (language === 'zh' ? SYSTEM_INSTRUCTION_ZH : SYSTEM_INSTRUCTION_EN) + memoryContext + "\n" + persona;
      
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
        }, providerKey,
        { useSearch: useSearch && selectedModel.provider === 'google', useThinking: useThinking && selectedModel.provider === 'google' }
      );
      
      const final = target.messages.find(m => m.id === mid);
      if (final) { final.text = res.text; final.groundingMetadata = res.groundingMetadata; }
      saveSessionsToStorage(updated, user.id);
    } catch (e) {
      target.messages.push({ id: uuidv4(), role: Role.MODEL, text: `Error: ${e.message}`, isError: true, timestamp: Date.now() });
      setSessions([...updated]);
    } finally { setIsLoading(false); }
  }, [inputValue, isLoading, sessions, currentSessionId, selectedModel, user, openaiKey, googleKey, anthropicKey, language, currentPersonaId, useSearch, useThinking, globalMemories]);

  if (!user) return <AuthScreen onAuthSuccess={handleAuthSuccess} language={language} />;

  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  return (
    <div className="flex h-screen mothership-bg text-slate-300 font-sans overflow-hidden">
      
      {/* Permanent Sidebar (No Toggle) */}
      <Sidebar 
        isOpen={true} sessions={sessions} currentSessionId={currentSessionId} 
        onNewChat={() => { setCurrentSessionId(null); }}
        onSelectSession={(id) => { setCurrentSessionId(id); }}
        onDeleteSession={(id, e) => { e.stopPropagation(); setSessions(sessions.filter(s => s.id !== id)); }} 
        user={user} onLogout={() => setUser(null)} language={language}
        onToggleLanguage={() => setLanguage(language === 'en' ? 'zh' : 'en')} 
        currentPersonaId={currentPersonaId} onUpdatePersona={setCurrentPersonaId}
        apiKeys={{ google: googleKey, openai: openaiKey, anthropic: anthropicKey }}
        onUpdateApiKeys={handleUpdateApiKeys}
      />

      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${labOpen ? 'mr-64' : 'mr-0'}`}>
        {/* Minimized Header */}
        <header className="h-10 flex items-center justify-between px-4 z-20 border-b border-white/5 bg-nexus-900/40">
          <div className="flex items-center gap-3">
            <div className="glass-panel px-2 py-0.5 rounded-md flex items-center gap-2 border-white/5 shadow-sm">
               <div className="flex items-center gap-1.5 text-[8px] font-black font-mono tracking-widest text-cyan-400">
                 <span className={`w-1 h-1 rounded-full ${isLoading ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-500'}`}></span> LIVE
               </div>
               <div className="h-2 w-px bg-white/10"></div>
               <button onClick={() => setCommandBarOpen(true)} className="flex items-center gap-1.5 text-[8px] text-gray-500 hover:text-white transition-all uppercase font-bold">
                  <span className="bg-white/5 px-1 rounded border border-white/5 font-mono text-nexus-accent">⌘K</span>
                  SWITCH
               </button>
            </div>
          </div>

          <button 
            onClick={() => setLabOpen(!labOpen)} 
            className={`p-1.5 rounded-md glass-panel transition-all duration-300 ${labOpen ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-glow' : 'hover:bg-white/5 text-gray-600'}`}
          >
            <LabIcon />
          </button>
        </header>

        {/* Dense Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 custom-scrollbar">
          <div className="max-w-2xl mx-auto min-h-full flex flex-col">
            {currentMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-10 animate-in fade-in duration-500">
                <div className="w-16 h-16 glass-panel rounded-xl flex items-center justify-center shadow-xl border-white/10 opacity-60">
                  <BrainIcon />
                </div>
                <div>
                  <h1 className="text-xl font-black italic tracking-tighter text-white">NEXUS<span className="text-cyan-400 font-mono">_OS</span></h1>
                  <p className="text-[9px] text-gray-600 font-mono uppercase tracking-[0.2em]">Neural Node Ready</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                   {["Recall preferences", "Analyze markets", "Debug architecture", "Logic simulation"].map((p, i) => (
                    <button key={i} onClick={() => setInputValue(p)} className="p-2.5 prism-card rounded-lg text-left text-[10px] font-bold text-gray-500 hover:text-cyan-400 transition-all">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-28">
                {currentMessages.map((msg) => (
                  <div key={msg.id} className="relative group/msg">
                    <MessageBubble 
                      message={msg} 
                      apiContext={{ 
                        apiKey: (selectedModel.provider === 'openai' ? openaiKey : (selectedModel.provider === 'anthropic' ? anthropicKey : googleKey)), 
                        provider: selectedModel.provider 
                      }} 
                    />
                    {msg.role === Role.MODEL && !msg.isError && (
                      <button onClick={() => {
                        setPinnedItems(prev => {
                          const n = [msg, ...prev];
                          localStorage.setItem('nexus_pinned', JSON.stringify(n));
                          if (!labOpen) setLabOpen(true);
                          return n;
                        });
                      }} className="absolute -right-5 top-1 p-1 glass-panel rounded-md opacity-0 group-hover/msg:opacity-100 transition-all text-gray-600 hover:text-cyan-400 scale-75">
                        <PinIcon />
                      </button>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Minimal Input */}
        <div className="px-4 py-3 absolute bottom-0 left-0 right-0 pointer-events-none">
          <div className="max-w-xl mx-auto glass-panel p-1 rounded-xl shadow-2xl pointer-events-auto border-white/5 ring-1 ring-white/10">
            <div className="flex items-center gap-1.5">
               <textarea 
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder={t.placeholder}
                className="flex-1 bg-transparent text-white px-3 py-1.5 focus:outline-none resize-none overflow-hidden text-[11px] font-medium leading-relaxed max-h-24 custom-scrollbar"
               />
               <div className="flex items-center gap-1 pr-1">
                 <button onClick={() => setInputValue("")} className="p-1.5 text-gray-700 hover:text-red-400 transition-all scale-90"><BroomIcon /></button>
                 <button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className={`p-2 rounded-lg transition-all ${inputValue.trim() && !isLoading ? 'bg-cyan-500 text-black shadow-lg' : 'bg-white/5 text-gray-700 opacity-30 cursor-not-allowed'}`}>
                   {isLoading ? <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <SendIcon />}
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lab Area - Thinner */}
      <aside className={`fixed inset-y-0 right-0 z-40 w-64 glass-panel border-l transform transition-all duration-300 ${labOpen ? 'translate-x-0' : 'translate-x-full'} shadow-2xl flex flex-col bg-nexus-950/40 backdrop-blur-3xl`}>
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-white uppercase">
             <LabIcon /> WORKSPACE
          </div>
          <button onClick={() => setLabOpen(false)} className="text-gray-600 hover:text-white text-xs">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
           {/* Memory persistence UI */}
           <section>
              <h3 className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MemoryIcon /> NEURAL MEMORY</h3>
              <div className="space-y-1.5">
                 <input 
                  type="text" 
                  placeholder="Fact to record..."
                  className="w-full bg-white/5 border border-white/5 rounded-md px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-cyan-500/20"
                  onKeyDown={(e) => { if (e.key === 'Enter') { addMemory((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
                 />
                 <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                   {globalMemories.map(mem => (
                     <div key={mem.id} className="p-2 prism-card rounded-md flex items-center justify-between group/mem">
                        <p className="text-[9px] text-gray-400 leading-tight flex-1 line-clamp-2">{mem.content}</p>
                        <button onClick={() => setGlobalMemories(p => p.filter(m => m.id !== mem.id))} className="opacity-0 group-hover/mem:opacity-100 text-gray-700 hover:text-red-400 ml-1 scale-75">✕</button>
                     </div>
                   ))}
                 </div>
              </div>
           </section>

           <div className="h-px bg-white/5"></div>

           {/* Snippets UI */}
           <section>
              <h3 className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><PinIcon /> SNAPSHOTS</h3>
              <div className="space-y-2">
                {pinnedItems.map((item) => (
                  <div key={item.id} className="p-2 prism-card rounded-lg relative group animate-in slide-in-from-right-1">
                      <button onClick={() => setPinnedItems(p => p.filter(i => i.id !== item.id))} className="absolute top-1 right-1 text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity scale-75">✕</button>
                      <div className="text-[9px] text-gray-500 line-clamp-4 leading-normal">{item.text}</div>
                  </div>
                ))}
              </div>
           </section>
        </div>
      </aside>

      {/* Command Palette */}
      {commandBarOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 backdrop-blur-xl bg-black/40" onClick={() => setCommandBarOpen(false)}>
          <div className="glass-panel w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <CommandIcon />
              <input 
                autoFocus
                type="text" 
                placeholder="Search Neurons..." 
                className="bg-transparent border-none outline-none flex-1 text-xs text-white placeholder-gray-600"
                value={commandSearch}
                onChange={e => setCommandSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[30vh] overflow-y-auto p-1.5 custom-scrollbar">
              {GEMINI_MODELS.filter(m => m.name.toLowerCase().includes(commandSearch.toLowerCase())).map(model => (
                <button key={model.id} onClick={() => { setSelectedModel(model); setCommandBarOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center justify-between group transition-all ${selectedModel.id === model.id ? 'bg-cyan-500/10' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center scale-90 ${model.provider === 'google' ? 'bg-cyan-500/10 text-cyan-400' : (model.provider === 'anthropic' ? 'bg-orange-500/10 text-orange-400' : 'bg-fuchsia-500/10 text-fuchsia-400')}`}>
                      {model.provider === 'google' ? <GoogleIcon /> : <OpenAIIcon />}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-white group-hover:text-cyan-400">{model.name}</div>
                      <div className="text-[8px] text-gray-500 uppercase">{model.provider}</div>
                    </div>
                  </div>
                  {selectedModel.id === model.id && <div className="text-cyan-400 text-[10px]">●</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;