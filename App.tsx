
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import AuthScreen from './components/AuthScreen';
import { 
  SendIcon, BrainIcon, PinIcon, LabIcon, MemoryIcon, MenuIcon
} from './components/Icon';
import { GEMINI_MODELS, SYSTEM_INSTRUCTION_EN, SYSTEM_INSTRUCTION_ZH, UI_TEXT, PERSONAS } from './constants';
import { ChatMessage, Role, ModelConfig, ChatSession, User, Language, GlobalMemory, AppSettings } from './types';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pinnedItems, setPinnedItems] = useState<ChatMessage[]>([]);
  const [globalMemories, setGlobalMemories] = useState<GlobalMemory[]>([]);
  
  const [currentPersonaId, setCurrentPersonaId] = useState<string>('default');
  const [settings, setSettings] = useState<AppSettings>({
    temperature: 0.7,
    maxTokens: 2048,
    useSearch: true,
    useMemories: true,
    thinkingBudget: 0,
    accentColor: 'cyan'
  });

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

  // Apply theme color
  useEffect(() => {
    const root = document.documentElement;
    const colors = {
      cyan: '#06b6d4',
      purple: '#d946ef',
      emerald: '#10b981'
    };
    root.style.setProperty('--nexus-accent', colors[settings.accentColor]);
  }, [settings.accentColor]);

  // Load state from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('nexus_user_v3');
    const storedOpenAI = localStorage.getItem('nexus_openai_key');
    const storedAnthropic = localStorage.getItem('nexus_anthropic_key');
    const storedDeepSeek = localStorage.getItem('nexus_deepseek_key');
    const storedGrok = localStorage.getItem('nexus_grok_key');
    const storedSettings = localStorage.getItem('nexus_app_settings');
    
    if (storedOpenAI) setOpenaiKey(storedOpenAI);
    if (storedAnthropic) setAnthropicKey(storedAnthropic);
    if (storedDeepSeek) setDeepseekKey(storedDeepSeek);
    if (storedGrok) setGrokKey(storedGrok);
    if (storedSettings) {
      try { 
        const parsed = JSON.parse(storedSettings);
        setSettings(prev => ({ ...prev, ...parsed })); 
      } catch(e) {}
    }
    
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) {}
    }
    
    const storedPinned = localStorage.getItem('nexus_pinned');
    if (storedPinned) { try { setPinnedItems(JSON.parse(storedPinned)); } catch(e) {} }
    
    const storedMemories = localStorage.getItem('nexus_memories');
    if (storedMemories) { try { setGlobalMemories(JSON.parse(storedMemories)); } catch(e) {} }
  }, []);

  const handleUpdateApiKeys = (keys: { openai?: string, anthropic?: string, deepseek?: string, grok?: string }) => {
    if (keys.openai !== undefined) { setOpenaiKey(keys.openai); localStorage.setItem('nexus_openai_key', keys.openai); }
    if (keys.anthropic !== undefined) { setAnthropicKey(keys.anthropic); localStorage.setItem('nexus_anthropic_key', keys.anthropic); }
    if (keys.deepseek !== undefined) { setDeepseekKey(keys.deepseek); localStorage.setItem('nexus_deepseek_key', keys.deepseek); }
    if (keys.grok !== undefined) { setGrokKey(keys.grok); localStorage.setItem('nexus_grok_key', keys.grok); }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('nexus_app_settings', JSON.stringify(newSettings));
  };

  const handleAuthSuccess = (inviteCode: string, name: string, keys: any, avatar?: string) => {
    const u: User = { 
      id: btoa(inviteCode + name), 
      name, 
      email: inviteCode, 
      avatar,
      isAdmin: inviteCode === 'NEXUS-0001', 
      inviteCode 
    };
    setUser(u);
    handleUpdateApiKeys(keys);
    localStorage.setItem('nexus_user_v3', JSON.stringify(u));
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

    if (selectedModel.provider !== 'google' && (!providerKey || providerKey.trim() === "")) {
      target.messages.push({ 
        id: uuidv4(), role: Role.MODEL, text: `Configuration Missing: No API key for ${selectedModel.provider.toUpperCase()}.`, 
        isError: true, timestamp: Date.now() 
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
      
      // Memory Integration
      let memoryInjection = "";
      if (settings.useMemories && globalMemories.length > 0) {
        const activeMemories = globalMemories.filter(m => m.enabled).map(m => m.content).join("\n");
        if (activeMemories) {
          memoryInjection = `\n\nCORE MEMORIES FOR RECALL:\n${activeMemories}\nUse these memories to personalize your response if relevant.`;
        }
      }

      const sys = (language === 'zh' ? SYSTEM_INSTRUCTION_ZH : SYSTEM_INSTRUCTION_EN) + persona + memoryInjection;
      
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
        { 
          useSearch: settings.useSearch, 
          thinkingBudget: settings.thinkingBudget,
          temperature: settings.temperature,
          maxOutputTokens: settings.maxTokens
        }
      );
      
      const final = target.messages.find(m => m.id === mid);
      if (final) {
        final.text = res.text;
        final.groundingMetadata = res.groundingMetadata;
      }
      localStorage.setItem(`nexus_sessions_global_${user.id}`, JSON.stringify(updated));
    } catch (e: any) {
      target.messages.push({ id: uuidv4(), role: Role.MODEL, text: `Neural Link Error: ${e.message}`, isError: true, timestamp: Date.now() });
      setSessions([...updated]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, sessions, currentSessionId, selectedModel, user, openaiKey, anthropicKey, deepseekKey, grokKey, language, currentPersonaId, settings, globalMemories]);

  if (!user) return <AuthScreen onAuthSuccess={handleAuthSuccess} language={language} />;

  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  return (
    <div className="flex h-screen mothership-bg text-slate-300 font-sans overflow-hidden">
      
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar 
        isOpen={sidebarOpen} sessions={sessions} currentSessionId={currentSessionId} 
        onNewChat={() => { setCurrentSessionId(null); setSidebarOpen(false); }}
        onSelectSession={(id) => { setCurrentSessionId(id); setSidebarOpen(false); }}
        onDeleteSession={(id, e) => { e.stopPropagation(); setSessions(sessions.filter(s => s.id !== id)); }} 
        user={user} onLogout={() => { localStorage.removeItem('nexus_user_v3'); setUser(null); }} language={language}
        onToggleLanguage={() => setLanguage(language === 'en' ? 'zh' : 'en')} 
        currentPersonaId={currentPersonaId} onUpdatePersona={setCurrentPersonaId}
        apiKeys={{ google: "", openai: openaiKey, anthropic: anthropicKey, deepseek: deepseekKey, grok: grokKey }}
        onUpdateApiKeys={handleUpdateApiKeys}
        appSettings={settings}
        onUpdateSettings={handleUpdateSettings}
        globalMemories={globalMemories}
        onAddMemory={addMemory}
        onDeleteMemory={(id) => setGlobalMemories(prev => prev.filter(m => m.id !== id))}
      />

      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${labOpen ? 'xl:mr-80' : 'mr-0'}`}>
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 z-20 border-b border-white/5 bg-nexus-900/40 backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-4">
             <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:text-white transition-colors">
               <MenuIcon />
             </button>
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-nexus-accent shadow-glow animate-pulse"></div>
               <span className="text-[10px] font-black font-mono text-nexus-accent uppercase tracking-widest hidden sm:inline">Uplink_Secure</span>
             </div>
             
             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-full">
                <select 
                  value={selectedModel.id}
                  onChange={(e) => setSelectedModel(GEMINI_MODELS.find(m => m.id === e.target.value) || GEMINI_MODELS[2])}
                  className="bg-transparent text-[10px] font-bold text-gray-400 outline-none cursor-pointer uppercase tracking-tighter"
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
              className={`p-2 rounded-xl transition-all ${labOpen ? 'text-nexus-accent bg-nexus-accent/10 border border-nexus-accent/20' : 'text-gray-500 hover:text-white border border-transparent'}`}
            >
              <LabIcon />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar">
          <div className="max-w-3xl mx-auto min-h-full flex flex-col">
            {currentMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-40 select-none text-center animate-in fade-in zoom-in-95 duration-700">
                <div className="w-20 h-20 glass-panel rounded-[2rem] flex items-center justify-center mb-8 border-white/10 shadow-2xl relative">
                  <div className="absolute inset-0 bg-nexus-accent/10 rounded-[2rem] animate-pulse"></div>
                  <BrainIcon />
                </div>
                <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">Nexus Mothership</h1>
                <p className="text-[10px] text-gray-600 font-mono tracking-[0.6em] mt-3 uppercase">Neural_Network_Online</p>
              </div>
            ) : (
              <div className="space-y-6 pb-24">
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
          <div className="max-w-3xl mx-auto glass-panel p-2 rounded-[2.5rem] pointer-events-auto border-white/10 shadow-2xl backdrop-blur-3xl ring-1 ring-white/10">
            <div className="flex items-end gap-2 px-3 py-1">
               <textarea 
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder={t.placeholder}
                className="flex-1 bg-transparent text-white px-3 py-3.5 focus:outline-none resize-none text-sm font-medium placeholder-gray-800 max-h-60 custom-scrollbar"
               />
               <button 
                 onClick={handleSendMessage} 
                 disabled={isLoading || !inputValue.trim()} 
                 className={`p-4 rounded-[1.5rem] transition-all shadow-xl active:scale-90 ${inputValue.trim() && !isLoading ? 'bg-nexus-accent text-black font-black' : 'bg-white/5 text-gray-700 opacity-20'}`}
               >
                 {isLoading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <SendIcon />}
               </button>
            </div>
          </div>
        </div>
      </div>

      <aside className={`fixed inset-y-0 right-0 z-40 w-full sm:w-80 glass-panel border-l transform transition-all duration-500 ease-in-out ${labOpen ? 'translate-x-0' : 'translate-x-full'} bg-nexus-950/95 backdrop-blur-3xl shadow-2xl flex flex-col`}>
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/2">
          <div className="text-[10px] font-black tracking-widest text-white uppercase flex items-center gap-2">
             <LabIcon /> ANALYTICS_LAB
          </div>
          <button onClick={() => setLabOpen(false)} className="text-gray-500 hover:text-white p-2 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
           <section>
              <h3 className="text-[10px] font-black text-gray-600 uppercase mb-4 flex items-center gap-2 tracking-widest"><MemoryIcon /> Neural Memory</h3>
              <div className="space-y-4">
                 <input 
                  type="text" 
                  placeholder="Record neural fact..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-nexus-accent/30 transition-all placeholder-gray-800 shadow-inner"
                  onKeyDown={(e) => { if (e.key === 'Enter') { addMemory((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
                 />
                 <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                   {globalMemories.map(mem => (
                     <div key={mem.id} className="p-4 prism-card rounded-2xl flex items-center justify-between group/mem animate-in fade-in slide-in-from-right-4 border-white/5">
                        <p className="text-xs text-gray-400 leading-relaxed flex-1">{mem.content}</p>
                        <button onClick={() => setGlobalMemories(p => p.filter(m => m.id !== mem.id))} className="opacity-0 group-hover/mem:opacity-100 text-red-500/50 hover:text-red-400 transition-all ml-4">✕</button>
                     </div>
                   ))}
                 </div>
              </div>
           </section>

           <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

           <section>
              <h3 className="text-[10px] font-black text-gray-600 uppercase mb-4 flex items-center gap-2 tracking-widest"><PinIcon /> Pinned Logs</h3>
              <div className="space-y-3">
                {pinnedItems.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-white/5 rounded-3xl text-[10px] text-gray-700 italic uppercase tracking-tighter">No high-priority logs</div>
                ) : pinnedItems.map((item) => (
                  <div key={item.id} className="p-4 prism-card rounded-2xl relative group overflow-hidden border-white/5">
                      <button onClick={() => setPinnedItems(p => p.filter(i => i.id !== item.id))} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">✕</button>
                      <div className="text-[11px] text-gray-500 line-clamp-6 leading-relaxed font-mono">{item.text}</div>
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
