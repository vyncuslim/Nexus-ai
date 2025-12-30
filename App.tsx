import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import AuthScreen from './components/AuthScreen';
import { 
  SendIcon, BrainIcon, LabIcon, MemoryIcon, MenuIcon, AgentIcon, ActivityIcon, LinkIcon, TrashIcon, XIcon
} from './components/Icon';
import { AVAILABLE_MODELS, SYSTEM_INSTRUCTION_EN, SYSTEM_INSTRUCTION_ZH, AGENT_INSTRUCTION, UI_TEXT, PERSONAS, DATABASE_TOOLS } from './constants';
import { ChatMessage, Role, ModelConfig, ChatSession, User, Language, GlobalMemory, AppSettings, DatabaseRecord } from './types';
import { streamGeminiResponse } from './services/geminiService';
import { useHistory } from './hooks/useHistory';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [googleKey, setGoogleKey] = useState<string>('');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [anthropicKey, setAnthropicKey] = useState<string>('');
  const [deepseekKey, setDeepseekKey] = useState<string>('');
  const [grokKey, setGrokKey] = useState<string>('');
  
  const [language, setLanguage] = useState<Language>('en');
  const [labOpen, setLabOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalMemories, setGlobalMemories] = useState<GlobalMemory[]>([]);
  const [database, setDatabase] = useState<DatabaseRecord[]>([]);
  const [dbSearch, setDbSearch] = useState("");
  const [isDbAccessing, setIsDbAccessing] = useState(false);
  
  const [currentPersonaId, setCurrentPersonaId] = useState<string>('default');
  const [settings, setSettings] = useState<AppSettings>({
    temperature: 0.7,
    maxTokens: 2048,
    useSearch: true,
    useMemories: true,
    isAgentMode: true,
    agentType: 'general',
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
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(AVAILABLE_MODELS[0]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = UI_TEXT[language];

  const getProviderKey = useCallback((provider: string) => {
    switch (provider) {
      case 'google': return googleKey;
      case 'openai': return openaiKey;
      case 'anthropic': return anthropicKey;
      case 'deepseek': return deepseekKey;
      case 'grok': return grokKey;
      default: return "";
    }
  }, [googleKey, openaiKey, anthropicKey, deepseekKey, grokKey]);

  useEffect(() => {
    const root = document.documentElement;
    const colors = { cyan: '#06b6d4', purple: '#d946ef', emerald: '#10b981' };
    const activeColor = settings.isAgentMode ? colors.purple : colors[settings.accentColor];
    root.style.setProperty('--nexus-accent', activeColor);
  }, [settings.accentColor, settings.isAgentMode]);

  useEffect(() => {
    const storedUser = localStorage.getItem('nexus_user_v3');
    const storedSettings = localStorage.getItem('nexus_app_settings');
    const storedMemories = localStorage.getItem('nexus_memories');
    const storedDb = localStorage.getItem('nexus_database');
    const storedKeys = localStorage.getItem('nexus_api_keys');
    
    if (storedSettings) { try { setSettings(prev => ({ ...prev, ...JSON.parse(storedSettings) })); } catch(e) {} }
    if (storedUser) { try { setUser(JSON.parse(storedUser)); } catch (e) {} }
    if (storedMemories) { try { setGlobalMemories(JSON.parse(storedMemories)); } catch(e) {} }
    if (storedDb) { try { setDatabase(JSON.parse(storedDb)); } catch(e) {} }
    if (storedKeys) {
      try {
        const keys = JSON.parse(storedKeys);
        if (keys.google) setGoogleKey(keys.google);
        if (keys.openai) setOpenaiKey(keys.openai);
        if (keys.anthropic) setAnthropicKey(keys.anthropic);
        if (keys.deepseek) setDeepseekKey(keys.deepseek);
        if (keys.grok) setGrokKey(keys.grok);
      } catch(e) {}
    }
  }, []);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('nexus_app_settings', JSON.stringify(newSettings));
  };

  const handleUpdateApiKeys = (keys: { google?: string, openai?: string, anthropic?: string, deepseek?: string, grok?: string }) => {
    if (keys.google !== undefined) setGoogleKey(keys.google);
    if (keys.openai !== undefined) setOpenaiKey(keys.openai);
    if (keys.anthropic !== undefined) setAnthropicKey(keys.anthropic);
    if (keys.deepseek !== undefined) setDeepseekKey(keys.deepseek);
    if (keys.grok !== undefined) setGrokKey(keys.grok);
    
    localStorage.setItem('nexus_api_keys', JSON.stringify({
      google: keys.google ?? googleKey,
      openai: keys.openai ?? openaiKey,
      anthropic: keys.anthropic ?? anthropicKey,
      deepseek: keys.deepseek ?? deepseekKey,
      grok: keys.grok ?? grokKey
    }));
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    const currentKey = getProviderKey(selectedModel.provider);
    
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
    setSessions([target, ...updated.filter(s => s.id !== targetId)]);

    setIsLoading(true);

    try {
      const executeChatLoop = async (userMsg: string, isToolResponse = false) => {
        const mid = uuidv4();
        target!.messages.push({ id: mid, role: Role.MODEL, text: "", timestamp: Date.now() });
        setSessions(prev => [...prev]);

        let memoryInjection = "";
        if (settings.useMemories && globalMemories.length > 0) {
          memoryInjection = `\n\n[MEM_CORE]\n${globalMemories.filter(m => m.enabled).map(m => `- ${m.content}`).join('\n')}`;
        }
        const agentInjection = settings.isAgentMode ? `\n\n[PROTOCOL: ${settings.agentType.toUpperCase()}]\n${AGENT_INSTRUCTION}` : "";
        const sys = (language === 'zh' ? SYSTEM_INSTRUCTION_ZH : SYSTEM_INSTRUCTION_EN) + memoryInjection + agentInjection;
        
        const res = await streamGeminiResponse(
          selectedModel, 
          target!.messages.slice(0, -1), 
          userMsg, sys, 
          (txt) => {
            setSessions(p => {
              const n = [...p];
              const s = n.find(sess => sess.id === targetId);
              const m = s?.messages.find(msg => msg.id === mid);
              if (m) m.text = txt;
              return n;
            }, true);
          }, 
          currentKey, 
          { 
            useSearch: settings.useSearch, 
            tools: settings.isAgentMode ? DATABASE_TOOLS : undefined,
            thinkingBudget: settings.isAgentMode ? 8192 : settings.thinkingBudget,
            temperature: settings.temperature 
          }
        );

        if (res.functionCalls && res.functionCalls.length > 0) {
          setIsDbAccessing(true);
          const toolResults = [];
          
          let currentDb = [...database];
          const stored = localStorage.getItem('nexus_database');
          if (stored) currentDb = JSON.parse(stored);

          for (const call of res.functionCalls) {
            let result = "error: unknown tool";
            if (call.name === 'query_database') {
              const query = (call.args.query || '').toLowerCase();
              const found = currentDb.filter(r => r.content.toLowerCase().includes(query));
              result = found.length > 0 ? JSON.stringify(found) : "No relevant records found.";
            } else if (call.name === 'update_database') {
              const { action, content, id } = call.args;
              if (action === 'create' && content) {
                const newRec = { id: uuidv4().slice(0, 8).toUpperCase(), content, timestamp: Date.now() };
                currentDb = [newRec, ...currentDb];
                result = `Record Created: ${content} (ID: ${newRec.id})`;
              } else if (action === 'delete' && id) {
                currentDb = currentDb.filter(r => r.id !== id);
                result = `Record ${id} Deleted.`;
              } else if (action === 'purge_all') {
                currentDb = [];
                result = "Database completely purged.";
              }
            }
            toolResults.push({ name: call.name, result });
          }

          setDatabase(currentDb);
          localStorage.setItem('nexus_database', JSON.stringify(currentDb));
          setIsDbAccessing(false);

          await executeChatLoop(`TOOL_RESULT: ${JSON.stringify(toolResults)}`, true);
        } else {
          const finalMsg = target!.messages.find(m => m.id === mid);
          if (finalMsg) { finalMsg.text = res.text; finalMsg.groundingMetadata = res.groundingMetadata; }
        }
      };

      await executeChatLoop(text);
      localStorage.setItem(`nexus_sessions_global_${user.id}`, JSON.stringify(sessions));
    } catch (e: any) {
      target.messages.push({ id: uuidv4(), role: Role.MODEL, text: `Uplink Error: ${e.message}`, isError: true, timestamp: Date.now() });
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, sessions, currentSessionId, selectedModel, user, getProviderKey, language, settings, globalMemories, database]);

  if (!user) return <AuthScreen onAuthSuccess={(inviteCode, name, keys) => {
    const u = { id: btoa(inviteCode + name), name, email: inviteCode };
    setUser(u); 
    localStorage.setItem('nexus_user_v3', JSON.stringify(u));
    handleUpdateApiKeys(keys);
  }} language={language} />;

  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];
  const filteredDb = database.filter(r => r.content.toLowerCase().includes(dbSearch.toLowerCase()) || r.id.toLowerCase().includes(dbSearch.toLowerCase()));

  return (
    <div className="flex h-screen mothership-bg text-slate-300 font-sans overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <Sidebar 
        isOpen={sidebarOpen} 
        sessions={sessions} 
        currentSessionId={currentSessionId} 
        onNewChat={() => { setCurrentSessionId(null); setSidebarOpen(false); }} 
        onSelectSession={setCurrentSessionId} 
        onDeleteSession={(id) => setSessions(sessions.filter(s => s.id !== id))} 
        user={user} 
        onLogout={() => setUser(null)} 
        language={language} 
        onToggleLanguage={() => setLanguage(language === 'en' ? 'zh' : 'en')} 
        currentPersonaId={currentPersonaId} 
        onUpdatePersona={setCurrentPersonaId} 
        apiKeys={{ google: googleKey, openai: openaiKey, anthropic: anthropicKey, deepseek: deepseekKey, grok: grokKey }} 
        onUpdateApiKeys={handleUpdateApiKeys} 
        appSettings={settings} 
        onUpdateSettings={handleUpdateSettings} 
        globalMemories={globalMemories} 
        onAddMemory={(c) => setGlobalMemories([{id:uuidv4(),content:c,enabled:true,timestamp:Date.now()}, ...globalMemories])} 
        onDeleteMemory={(id) => setGlobalMemories(globalMemories.filter(m => m.id !== id))} 
      />

      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${labOpen ? 'xl:mr-80' : 'mr-0'}`}>
        <header className="h-16 flex items-center justify-between px-6 z-20 border-b border-white/5 bg-nexus-900/40 backdrop-blur-xl">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:text-white"><MenuIcon /></button>
             <div className="flex flex-col">
               <div className="flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${isDbAccessing ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24]' : settings.isAgentMode ? 'bg-nexus-purple shadow-[0_0_10px_#d946ef]' : 'bg-nexus-accent shadow-glow'} animate-pulse`}></div>
                 <span className={`text-[10px] font-black font-mono uppercase tracking-widest ${isDbAccessing ? 'text-amber-400' : settings.isAgentMode ? 'text-nexus-purple' : 'text-nexus-accent'}`}>
                    {isDbAccessing ? 'NEURAL_DB_ACCESSING' : settings.isAgentMode ? `AGENT_MATRIX [TYPE: ${settings.agentType}]` : 'Uplink_Secure'}
                 </span>
               </div>
               {settings.isAgentMode && <span className="text-[7px] text-nexus-purple/40 font-mono tracking-[0.3em] uppercase ml-3.5">Persistent_Storage_Active</span>}
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/5 rounded-2xl">
                <select value={selectedModel.id} onChange={(e) => setSelectedModel(AVAILABLE_MODELS.find(m => m.id === e.target.value) || AVAILABLE_MODELS[0])} className="bg-transparent text-[10px] font-bold text-gray-400 outline-none cursor-pointer uppercase tracking-tight max-w-[120px] md:max-w-none">
                  {AVAILABLE_MODELS.map(m => (<option key={m.id} value={m.id} className="bg-nexus-900">{m.name} ({m.provider})</option>))}
                </select>
             </div>
             <button onClick={() => setLabOpen(!labOpen)} className={`p-2.5 rounded-xl transition-all ${labOpen ? 'text-nexus-accent bg-nexus-accent/10 border border-nexus-accent/20' : 'text-gray-500 hover:text-white border border-transparent'}`}><LabIcon /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-12 py-10 custom-scrollbar">
          <div className="max-w-4xl mx-auto min-h-full flex flex-col">
            {currentMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30 select-none text-center">
                <div className="w-24 h-24 glass-panel rounded-[2.5rem] flex items-center justify-center mb-8 border-white/10 shadow-2xl relative">
                  <div className={`absolute inset-0 ${settings.isAgentMode ? 'bg-nexus-purple/10' : 'bg-nexus-accent/10'} rounded-[2.5rem] animate-pulse`}></div>
                  {settings.isAgentMode ? <AgentIcon /> : <BrainIcon />}
                </div>
                <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">Nexus Agent Matrix</h1>
                <p className="text-[10px] text-gray-600 font-mono tracking-[0.5em] mt-4 uppercase italic">Neural_Database_Engine_v5</p>
              </div>
            ) : (
              <div className="space-y-8 pb-32">
                {currentMessages.map((msg) => (<MessageBubble key={msg.id} message={msg} apiContext={{ apiKey: getProviderKey(selectedModel.provider), provider: selectedModel.provider }} />))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-8 absolute bottom-0 left-0 right-0 pointer-events-none">
          <div className={`max-w-3xl mx-auto glass-panel p-2.5 rounded-[3rem] pointer-events-auto border-white/10 shadow-3xl backdrop-blur-3xl ring-1 transition-all duration-500 ${settings.isAgentMode ? 'ring-nexus-purple/40 border-nexus-purple/20' : 'ring-white/10'}`}>
            <div className="flex items-end gap-3 px-4 py-2">
               <textarea rows={1} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder={settings.isAgentMode ? "Instruct Agent to manage neural database..." : t.placeholder} className="flex-1 bg-transparent text-white px-3 py-3.5 focus:outline-none resize-none text-sm font-medium placeholder-gray-800 max-h-60 custom-scrollbar" />
               <button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className={`p-4.5 rounded-[2rem] transition-all shadow-2xl active:scale-95 ${inputValue.trim() && !isLoading ? (settings.isAgentMode ? 'bg-nexus-purple text-white' : 'bg-nexus-accent text-black font-black') : 'bg-white/5 text-gray-700 opacity-20'}`}>
                 {isLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <SendIcon />}
               </button>
            </div>
          </div>
        </div>
      </div>

      <aside className={`fixed inset-y-0 right-0 z-40 w-full sm:w-80 glass-panel border-l transform transition-all duration-500 ease-in-out ${labOpen ? 'translate-x-0' : 'translate-x-full'} bg-nexus-950/95 backdrop-blur-3xl shadow-2xl flex flex-col`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="text-[10px] font-black tracking-widest text-white uppercase flex items-center gap-2"><LabIcon /> DATA_CONSOLE</div>
          <button onClick={() => setLabOpen(false)} className="text-gray-500 hover:text-white p-2">✕</button>
        </div>
        <div className="p-4 border-b border-white/5">
            <input 
              type="text" 
              placeholder="Filter Records..." 
              value={dbSearch}
              onChange={(e) => setDbSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-[10px] text-white focus:outline-none focus:border-nexus-accent/30 placeholder-gray-800"
            />
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
           <section>
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-gray-600 uppercase flex items-center gap-2 tracking-widest"><ActivityIcon /> Neural_Records</h3>
                  <button onClick={() => {setDatabase([]); localStorage.setItem('nexus_database', "[]")}} className="text-[8px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest">Wipe_All</button>
              </div>
              <div className="space-y-3">
                 {filteredDb.length === 0 ? (
                   <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl text-gray-800 italic text-[10px] uppercase">No_Records_Found</div>
                 ) : (
                   filteredDb.map(record => (
                     <div key={record.id} className="p-4 prism-card rounded-[1.5rem] group border-white/5 relative overflow-hidden animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[8px] font-mono text-nexus-purple tracking-tighter bg-nexus-purple/10 px-1.5 py-0.5 rounded-md border border-nexus-purple/20">REC_{record.id}</span>
                           <button onClick={() => {const ndb = database.filter(r => r.id !== record.id); setDatabase(ndb); localStorage.setItem('nexus_database', JSON.stringify(ndb))}} className="opacity-0 group-hover:opacity-100 text-red-500/50 hover:text-red-500 transition-all"><TrashIcon /></button>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-medium uppercase tracking-tight">{record.content}</p>
                        <div className="mt-2 pt-2 border-t border-white/5 text-[7px] text-gray-700 font-mono italic flex justify-between">
                            <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                            <span>{new Date(record.timestamp).toLocaleTimeString()}</span>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </section>
        </div>
      </aside>
    </div>
  );
}

export default App;