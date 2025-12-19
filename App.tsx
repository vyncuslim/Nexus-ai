
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import AuthScreen from './components/AuthScreen';
import { 
  SendIcon, BrainIcon, PinIcon, LabIcon, MemoryIcon, MenuIcon, AgentIcon, ActivityIcon
} from './components/Icon';
import { GEMINI_MODELS, SYSTEM_INSTRUCTION_EN, SYSTEM_INSTRUCTION_ZH, AGENT_INSTRUCTION, UI_TEXT, PERSONAS } from './constants';
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
    isAgentMode: false,
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
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(GEMINI_MODELS[0]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = UI_TEXT[language];

  useEffect(() => {
    const root = document.documentElement;
    const colors = { cyan: '#06b6d4', purple: '#d946ef', emerald: '#10b981' };
    const activeColor = settings.isAgentMode ? colors.purple : colors[settings.accentColor];
    root.style.setProperty('--nexus-accent', activeColor);
  }, [settings.accentColor, settings.isAgentMode]);

  useEffect(() => {
    const storedUser = localStorage.getItem('nexus_user_v3');
    const storedOpenAI = localStorage.getItem('nexus_openai_key');
    const storedDeepSeek = localStorage.getItem('nexus_deepseek_key');
    const storedGrok = localStorage.getItem('nexus_grok_key');
    const storedSettings = localStorage.getItem('nexus_app_settings');
    const storedMemories = localStorage.getItem('nexus_memories');
    
    if (storedOpenAI) setOpenaiKey(storedOpenAI);
    if (storedDeepSeek) setDeepseekKey(storedDeepSeek);
    if (storedGrok) setGrokKey(storedGrok);
    if (storedSettings) { try { setSettings(prev => ({ ...prev, ...JSON.parse(storedSettings) })); } catch(e) {} }
    if (storedUser) { try { setUser(JSON.parse(storedUser)); } catch (e) {} }
    if (storedMemories) { try { setGlobalMemories(JSON.parse(storedMemories)); } catch(e) {} }
  }, []);

  const handleUpdateApiKeys = (keys: any) => {
    if (keys.openai !== undefined) { setOpenaiKey(keys.openai); localStorage.setItem('nexus_openai_key', keys.openai); }
    if (keys.deepseek !== undefined) { setDeepseekKey(keys.deepseek); localStorage.setItem('nexus_deepseek_key', keys.deepseek); }
    if (keys.grok !== undefined) { setGrokKey(keys.grok); localStorage.setItem('nexus_grok_key', keys.grok); }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('nexus_app_settings', JSON.stringify(newSettings));
  };

  const addMemory = (content: string) => {
    if (!content.trim()) return;
    const updated = [{ id: uuidv4(), content, enabled: true, timestamp: Date.now() }, ...globalMemories];
    setGlobalMemories(updated);
    localStorage.setItem('nexus_memories', JSON.stringify(updated));
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    let providerKey = selectedModel.provider === 'openai' ? openaiKey : (selectedModel.provider === 'deepseek' ? deepseekKey : grokKey);
    if (selectedModel.provider === 'google') providerKey = process.env.API_KEY || "";

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

    if (selectedModel.provider !== 'google' && !providerKey) {
       target.messages.push({ id: uuidv4(), role: Role.MODEL, text: `API Link Missing: ${selectedModel.provider.toUpperCase()}`, isError: true, timestamp: Date.now() });
       setSessions([...updated]);
       return;
    }

    setIsLoading(true);
    try {
      const mid = uuidv4();
      target.messages.push({ id: mid, role: Role.MODEL, text: "", timestamp: Date.now() });
      setSessions([...updated]);
      
      let memoryInjection = "";
      if (settings.useMemories && globalMemories.length > 0) {
        memoryInjection = `\n\n[PERSISTENT MEMORY]\n${globalMemories.filter(m => m.enabled).map(m => `- ${m.content}`).join('\n')}`;
      }

      const agentInjection = settings.isAgentMode ? `\n\n[AGENT SUB-PROTOCOL: ${settings.agentType.toUpperCase()}]\n${AGENT_INSTRUCTION}` : "";
      const sys = (language === 'zh' ? SYSTEM_INSTRUCTION_ZH : SYSTEM_INSTRUCTION_EN) + memoryInjection + agentInjection;
      const budget = (settings.isAgentMode && settings.thinkingBudget === 0) ? 8192 : settings.thinkingBudget;

      const res = await streamGeminiResponse(selectedModel, target.messages.slice(0, -1), text, sys, (txt) => {
        setSessions(p => {
          const n = [...p];
          const s = n.find(sess => sess.id === targetId);
          const m = s?.messages.find(msg => msg.id === mid);
          if (m) m.text = txt;
          return n;
        }, true);
      }, providerKey, { useSearch: settings.useSearch, thinkingBudget: budget, temperature: settings.temperature, maxOutputTokens: settings.maxTokens });
      
      const finalMsg = target.messages.find(m => m.id === mid);
      if (finalMsg) { finalMsg.text = res.text; finalMsg.groundingMetadata = res.groundingMetadata; }
      localStorage.setItem(`nexus_sessions_global_${user.id}`, JSON.stringify(updated));
    } catch (e: any) {
      target.messages.push({ id: uuidv4(), role: Role.MODEL, text: `Uplink Error: ${e.message}`, isError: true, timestamp: Date.now() });
      setSessions([...updated]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, sessions, currentSessionId, selectedModel, user, openaiKey, deepseekKey, grokKey, language, settings, globalMemories]);

  if (!user) return <AuthScreen onAuthSuccess={(inviteCode, name, keys, avatar) => {
    const u = { id: btoa(inviteCode + name), name, email: inviteCode, avatar };
    setUser(u); handleUpdateApiKeys(keys); localStorage.setItem('nexus_user_v3', JSON.stringify(u));
  }} language={language} />;

  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  return (
    <div className="flex h-screen mothership-bg text-slate-300 font-sans overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <Sidebar isOpen={sidebarOpen} sessions={sessions} currentSessionId={currentSessionId} onNewChat={() => { setCurrentSessionId(null); setSidebarOpen(false); }} onSelectSession={setCurrentSessionId} onDeleteSession={(id) => setSessions(sessions.filter(s => s.id !== id))} user={user} onLogout={() => setUser(null)} language={language} onToggleLanguage={() => setLanguage(language === 'en' ? 'zh' : 'en')} currentPersonaId={currentPersonaId} onUpdatePersona={setCurrentPersonaId} apiKeys={{ google: "", openai: openaiKey, anthropic: "", deepseek: deepseekKey, grok: grokKey }} onUpdateApiKeys={handleUpdateApiKeys} appSettings={settings} onUpdateSettings={handleUpdateSettings} globalMemories={globalMemories} onAddMemory={addMemory} onDeleteMemory={(id) => setGlobalMemories(globalMemories.filter(m => m.id !== id))} />

      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${labOpen ? 'xl:mr-80' : 'mr-0'}`}>
        <header className="h-16 flex items-center justify-between px-6 z-20 border-b border-white/5 bg-nexus-900/40 backdrop-blur-xl">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:text-white"><MenuIcon /></button>
             <div className="flex flex-col">
               <div className="flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${settings.isAgentMode ? 'bg-nexus-purple shadow-[0_0_10px_#d946ef]' : 'bg-nexus-accent shadow-glow'} animate-pulse`}></div>
                 <span className={`text-[10px] font-black font-mono uppercase tracking-widest ${settings.isAgentMode ? 'text-nexus-purple' : 'text-nexus-accent'}`}>
                    {settings.isAgentMode ? `AGENT_MATRIX [TYPE: ${settings.agentType}]` : 'Uplink_Secure'}
                 </span>
               </div>
               {settings.isAgentMode && <span className="text-[7px] text-nexus-purple/40 font-mono tracking-[0.3em] uppercase ml-3.5">Autonomy_Level_High</span>}
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/5 rounded-2xl">
                <select value={selectedModel.id} onChange={(e) => setSelectedModel(GEMINI_MODELS.find(m => m.id === e.target.value) || GEMINI_MODELS[0])} className="bg-transparent text-[10px] font-bold text-gray-400 outline-none cursor-pointer uppercase tracking-tight">
                  {GEMINI_MODELS.map(m => (<option key={m.id} value={m.id} className="bg-nexus-900">{m.name}</option>))}
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
                <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">{settings.isAgentMode ? "Neural Agent Cluster" : "Nexus Mothership"}</h1>
                <p className="text-[10px] text-gray-600 font-mono tracking-[0.5em] mt-4 uppercase italic">Standby_For_Command_Deploy</p>
              </div>
            ) : (
              <div className="space-y-8 pb-32">
                {currentMessages.map((msg) => (<MessageBubble key={msg.id} message={msg} apiContext={{ apiKey: (selectedModel.provider === 'openai' ? openaiKey : (selectedModel.provider === 'deepseek' ? deepseekKey : grokKey)), provider: selectedModel.provider }} />))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-8 absolute bottom-0 left-0 right-0 pointer-events-none">
          <div className={`max-w-3xl mx-auto glass-panel p-2.5 rounded-[3rem] pointer-events-auto border-white/10 shadow-3xl backdrop-blur-3xl ring-1 transition-all duration-500 ${settings.isAgentMode ? 'ring-nexus-purple/40 border-nexus-purple/20' : 'ring-white/10'}`}>
            <div className="flex items-end gap-3 px-4 py-2">
               <textarea rows={1} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder={settings.isAgentMode ? "Define objective for Neural Agent..." : t.placeholder} className="flex-1 bg-transparent text-white px-3 py-3.5 focus:outline-none resize-none text-sm font-medium placeholder-gray-800 max-h-60 custom-scrollbar" />
               <button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className={`p-4.5 rounded-[2rem] transition-all shadow-2xl active:scale-95 ${inputValue.trim() && !isLoading ? (settings.isAgentMode ? 'bg-nexus-purple text-white' : 'bg-nexus-accent text-black font-black') : 'bg-white/5 text-gray-700 opacity-20'}`}>
                 {isLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <SendIcon />}
               </button>
            </div>
          </div>
        </div>
      </div>

      <aside className={`fixed inset-y-0 right-0 z-40 w-full sm:w-80 glass-panel border-l transform transition-all duration-500 ease-in-out ${labOpen ? 'translate-x-0' : 'translate-x-full'} bg-nexus-950/95 backdrop-blur-3xl shadow-2xl flex flex-col`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="text-[10px] font-black tracking-widest text-white uppercase flex items-center gap-2"><LabIcon /> ANALYTICS_CORE</div>
          <button onClick={() => setLabOpen(false)} className="text-gray-500 hover:text-white p-2">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
           <section>
              <h3 className="text-[10px] font-black text-gray-600 uppercase mb-6 flex items-center gap-2 tracking-widest"><ActivityIcon /> Matrix_Status</h3>
              <div className="space-y-4">
                 <div className="p-5 prism-card rounded-[2rem] border-white/5 bg-white/[0.02]">
                    <div className="text-[9px] text-gray-500 uppercase mb-2 font-mono">Neural_Load</div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-nexus-accent w-1/3 animate-pulse"></div></div>
                 </div>
                 <div className="p-5 prism-card rounded-[2rem] border-white/5 bg-white/[0.02]">
                    <div className="text-[9px] text-gray-500 uppercase mb-2 font-mono">Memory_Archive</div>
                    <div className="text-xl font-black text-white">{globalMemories.length} <span className="text-[10px] font-mono text-gray-700">Patterns</span></div>
                 </div>
              </div>
           </section>
        </div>
      </aside>
    </div>
  );
}

export default App;
