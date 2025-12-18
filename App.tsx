
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import AuthScreen from './components/AuthScreen';
import { 
  SendIcon, BroomIcon, BrainIcon, PinIcon, LabIcon, MemoryIcon
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
  
  const [currentPersonaId, setCurrentPersonaId] = useState<string>('default');

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

  // 加载本地存储
  useEffect(() => {
    const storedUser = localStorage.getItem('nexus_user_v2');
    const storedOpenAI = localStorage.getItem('nexus_openai_key');
    const storedGoogle = localStorage.getItem('nexus_google_key');
    const storedAnthropic = localStorage.getItem('nexus_anthropic_key');

    if (storedOpenAI) setOpenaiKey(storedOpenAI);
    if (storedGoogle) setGoogleKey(storedGoogle);
    if (storedAnthropic) setAnthropicKey(storedAnthropic);
    
    if (storedUser) { 
      try { 
        setUser(JSON.parse(storedUser)); 
      } catch (e) {} 
    }
    
    const storedPinned = localStorage.getItem('nexus_pinned');
    if (storedPinned) { try { setPinnedItems(JSON.parse(storedPinned)); } catch(e) {} }
    
    const storedMemories = localStorage.getItem('nexus_memories');
    if (storedMemories) { try { setGlobalMemories(JSON.parse(storedMemories)); } catch(e) {} }
  }, []);

  // 会话持久化
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

  const handleUpdateApiKeys = (keys: { google?: string, openai?: string, anthropic?: string }) => {
    if (keys.google !== undefined) { setGoogleKey(keys.google); localStorage.setItem('nexus_google_key', keys.google); }
    if (keys.openai !== undefined) { setOpenaiKey(keys.openai); localStorage.setItem('nexus_openai_key', keys.openai); }
    if (keys.anthropic !== undefined) { setAnthropicKey(keys.anthropic); localStorage.setItem('nexus_anthropic_key', keys.anthropic); }
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

    // Determine the relevant API Key
    let providerKey = "";
    if (selectedModel.provider === 'openai') providerKey = openaiKey;
    else if (selectedModel.provider === 'anthropic') providerKey = anthropicKey;
    else if (selectedModel.provider === 'google') providerKey = googleKey || (process.env.API_KEY as string);

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
    
    // Add User Message
    target.messages.push({ id: uuidv4(), role: Role.USER, text, timestamp: Date.now() });
    target.updatedAt = Date.now();
    updated = [target, ...updated.filter(s => s.id !== targetId)];
    setSessions(updated);
    localStorage.setItem(`nexus_sessions_global_${user.id}`, JSON.stringify(updated));

    // KEY VALIDATION CHECK
    if (!providerKey) {
      target.messages.push({ 
        id: uuidv4(), 
        role: Role.MODEL, 
        text: `No API Key found for ${selectedModel.provider.toUpperCase()}. Please add it in Settings.`, 
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
      
      const activeMemories = globalMemories.filter(m => m.enabled).map(m => `- ${m.content}`).join('\n');
      const memoryContext = activeMemories 
        ? `\n[MEMBERED_FACTS]:\n${activeMemories}\nUse these memories to personalize your response.` 
        : "";
      
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
        }, providerKey
      );
      
      const final = target.messages.find(m => m.id === mid);
      if (final) { final.text = res.text; final.groundingMetadata = res.groundingMetadata; }
      localStorage.setItem(`nexus_sessions_global_${user.id}`, JSON.stringify(updated));
    } catch (e) {
      target.messages.push({ id: uuidv4(), role: Role.MODEL, text: `Error: ${e.message}`, isError: true, timestamp: Date.now() });
      setSessions([...updated]);
    } finally { setIsLoading(false); }
  }, [inputValue, isLoading, sessions, currentSessionId, selectedModel, user, openaiKey, googleKey, anthropicKey, language, currentPersonaId, globalMemories]);

  if (!user) return <AuthScreen onAuthSuccess={handleAuthSuccess} language={language} />;

  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  return (
    <div className="flex h-screen mothership-bg text-slate-300 font-sans overflow-hidden">
      
      <Sidebar 
        isOpen={true} sessions={sessions} currentSessionId={currentSessionId} 
        onNewChat={() => setCurrentSessionId(null)}
        onSelectSession={setCurrentSessionId}
        onDeleteSession={(id, e) => { e.stopPropagation(); setSessions(sessions.filter(s => s.id !== id)); }} 
        user={user} onLogout={() => { localStorage.removeItem('nexus_user_v2'); setUser(null); }} language={language}
        onToggleLanguage={() => setLanguage(language === 'en' ? 'zh' : 'en')} 
        currentPersonaId={currentPersonaId} onUpdatePersona={setCurrentPersonaId}
        apiKeys={{ google: googleKey, openai: openaiKey, anthropic: anthropicKey }}
        onUpdateApiKeys={handleUpdateApiKeys}
      />

      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${labOpen ? 'mr-72' : 'mr-0'}`}>
        <header className="h-14 flex items-center justify-between px-6 z-20 border-b border-white/5 bg-nexus-900/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse"></div>
               <span className="text-xs font-black font-mono text-cyan-500 uppercase tracking-widest">System_Live</span>
             </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLabOpen(!labOpen)} 
              className={`p-2 rounded-xl glass-panel transition-all ${labOpen ? 'text-cyan-400 border-cyan-500/20 shadow-glow' : 'text-gray-500 hover:text-white'}`}
            >
              <LabIcon />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 md:px-12 custom-scrollbar">
          <div className="max-w-2xl mx-auto min-h-full flex flex-col">
            {currentMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30 select-none">
                <div className="w-16 h-16 glass-panel rounded-3xl flex items-center justify-center mb-6 shadow-2xl"><BrainIcon /></div>
                <h1 className="text-2xl font-black italic text-white uppercase tracking-tighter">Nexus Mothership</h1>
                <p className="text-[10px] text-gray-600 font-mono tracking-[0.5em] mt-2 uppercase">Neural_Link_Established</p>
              </div>
            ) : (
              <div className="space-y-6 pb-24">
                {currentMessages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} apiContext={{ 
                    apiKey: (selectedModel.provider === 'openai' ? openaiKey : (selectedModel.provider === 'anthropic' ? anthropicKey : googleKey)), 
                    provider: selectedModel.provider 
                  }} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-6 absolute bottom-0 left-0 right-0 pointer-events-none">
          <div className="max-w-2xl mx-auto glass-panel p-2 rounded-[2rem] pointer-events-auto border-white/5 shadow-2xl ring-1 ring-white/5 backdrop-blur-3xl">
            <div className="flex items-end gap-3 px-2 py-1">
               <textarea 
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder={t.placeholder}
                className="flex-1 bg-transparent text-white px-4 py-3 focus:outline-none resize-none text-sm font-medium leading-relaxed max-h-48 custom-scrollbar placeholder-gray-700"
               />
               <button 
                 onClick={handleSendMessage} 
                 disabled={isLoading || !inputValue.trim()} 
                 className={`p-3.5 rounded-2xl transition-all shadow-xl active:scale-90 ${inputValue.trim() && !isLoading ? 'bg-cyan-500 text-black' : 'bg-white/5 text-gray-700 opacity-20'}`}
               >
                 {isLoading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <SendIcon />}
               </button>
            </div>
          </div>
        </div>
      </div>

      <aside className={`fixed inset-y-0 right-0 z-40 w-72 glass-panel border-l transform transition-all duration-500 ease-in-out ${labOpen ? 'translate-x-0' : 'translate-x-full'} bg-nexus-950/80 backdrop-blur-3xl shadow-2xl flex flex-col`}>
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="text-[10px] font-black tracking-widest text-white uppercase flex items-center gap-2">
             <LabIcon /> ANALYTICS_LAB
          </div>
          <button onClick={() => setLabOpen(false)} className="text-gray-600 hover:text-white text-sm p-1 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
           <section>
              <h3 className="text-[10px] font-black text-gray-500 uppercase mb-3 flex items-center gap-2 tracking-widest"><MemoryIcon /> Neural Memory</h3>
              <div className="space-y-3">
                 <input 
                  type="text" 
                  placeholder="Fact to record..."
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/30 transition-all shadow-inner"
                  onKeyDown={(e) => { if (e.key === 'Enter') { addMemory((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
                 />
                 <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                   {globalMemories.map(mem => (
                     <div key={mem.id} className="p-3 prism-card rounded-xl flex items-center justify-between group/mem animate-in fade-in slide-in-from-right-2">
                        <p className="text-xs text-gray-400 leading-normal flex-1">{mem.content}</p>
                        <button onClick={() => setGlobalMemories(p => p.filter(m => m.id !== mem.id))} className="opacity-0 group-hover/mem:opacity-100 text-red-500/50 hover:text-red-500 ml-2 transition-all">✕</button>
                     </div>
                   ))}
                 </div>
              </div>
           </section>

           <div className="h-px bg-white/5"></div>

           <section>
              <h3 className="text-[10px] font-black text-gray-500 uppercase mb-3 flex items-center gap-2 tracking-widest"><PinIcon /> Pinned Snippets</h3>
              <div className="space-y-3">
                {pinnedItems.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl text-[10px] text-gray-700 italic">No pinned items</div>
                ) : pinnedItems.map((item) => (
                  <div key={item.id} className="p-3 prism-card rounded-xl relative group overflow-hidden border-white/5">
                      <button onClick={() => setPinnedItems(p => p.filter(i => i.id !== item.id))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">✕</button>
                      <div className="text-[11px] text-gray-500 line-clamp-4 leading-relaxed">{item.text}</div>
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
