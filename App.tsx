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

  // 初始化加载本地数据
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

  // 加载用户会话
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
    localStorage.setItem(`nexus_sessions_global_${user.id}`, JSON.stringify(updated));
    setIsLoading(true);

    try {
      const mid = uuidv4();
      target.messages.push({ id: mid, role: Role.MODEL, text: "", timestamp: Date.now() });
      setSessions([...updated]);
      
      // 神经记忆注入 (Neural Memory Injection)
      const activeMemories = globalMemories.filter(m => m.enabled).map(m => `- ${m.content}`).join('\n');
      const memoryContext = activeMemories ? `\n[CRITICAL_USER_MEMORIES_AND_FACTS]:\n${activeMemories}\n` : "";
      
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

  if (!user) return <AuthScreen onAuthSuccess={(ic, n, k, a) => {
    const u = { id: btoa(ic + n), name: n, email: ic, avatar: a };
    setUser(u);
    handleUpdateApiKeys(k);
    localStorage.setItem('nexus_user_v2', JSON.stringify(u));
  }} language={language} />;

  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  return (
    <div className="flex h-screen mothership-bg text-slate-300 font-sans overflow-hidden">
      
      {/* 侧边栏永久固定 */}
      <Sidebar 
        isOpen={true} sessions={sessions} currentSessionId={currentSessionId} 
        onNewChat={() => setCurrentSessionId(null)}
        onSelectSession={setCurrentSessionId}
        onDeleteSession={(id, e) => { e.stopPropagation(); setSessions(sessions.filter(s => s.id !== id)); }} 
        user={user} onLogout={() => setUser(null)} language={language}
        onToggleLanguage={() => setLanguage(language === 'en' ? 'zh' : 'en')} 
        currentPersonaId={currentPersonaId} onUpdatePersona={setCurrentPersonaId}
        apiKeys={{ google: googleKey, openai: openaiKey, anthropic: anthropicKey }}
        onUpdateApiKeys={handleUpdateApiKeys}
      />

      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${labOpen ? 'mr-56' : 'mr-0'}`}>
        {/* 极致精简页眉 */}
        <header className="h-10 flex items-center justify-between px-4 z-20 border-b border-white/5 bg-nexus-900/40">
          <div className="flex items-center gap-2">
            <div className="glass-panel px-2 py-0.5 rounded-md flex items-center gap-2 border-white/5">
               <div className="text-[8px] font-black font-mono text-cyan-400">
                 <span className={`inline-block w-1 h-1 rounded-full mr-1 ${isLoading ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                 SYNC_OK
               </div>
            </div>
          </div>

          <button 
            onClick={() => setLabOpen(!labOpen)} 
            className={`p-1.5 rounded-md glass-panel ${labOpen ? 'text-cyan-400 border-cyan-500/20' : 'text-gray-600'}`}
          >
            <LabIcon />
          </button>
        </header>

        {/* 聊天消息流 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 custom-scrollbar">
          <div className="max-w-xl mx-auto min-h-full flex flex-col">
            {currentMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-60">
                <div className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center mb-4"><BrainIcon /></div>
                <h1 className="text-base font-black italic text-white uppercase tracking-tighter">Nexus_Core</h1>
                <p className="text-[7px] text-gray-700 font-mono tracking-[0.3em] mt-1 uppercase">Ready_for_Input</p>
              </div>
            ) : (
              <div className="space-y-4 pb-20">
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

        {/* 输入框收紧 */}
        <div className="px-4 py-3 absolute bottom-0 left-0 right-0 pointer-events-none">
          <div className="max-w-lg mx-auto glass-panel p-1 rounded-xl pointer-events-auto border-white/5 ring-1 ring-white/5">
            <div className="flex items-center gap-1">
               <textarea 
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder={t.placeholder}
                className="flex-1 bg-transparent text-white px-3 py-1.5 focus:outline-none resize-none text-[10px] font-medium leading-relaxed max-h-24"
               />
               <button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className={`p-2 rounded-lg transition-all ${inputValue.trim() && !isLoading ? 'bg-cyan-500 text-black' : 'bg-white/5 text-gray-700 opacity-20'}`}>
                 {isLoading ? <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <SendIcon />}
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧 Lab 指挥台 (常驻窄栏) */}
      <aside className={`fixed inset-y-0 right-0 z-40 w-56 glass-panel border-l transform transition-all duration-300 ${labOpen ? 'translate-x-0' : 'translate-x-full'} bg-nexus-950/40 backdrop-blur-3xl`}>
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <div className="text-[8px] font-black tracking-widest text-white uppercase flex items-center gap-1.5">
             <LabIcon /> WORKSPACE
          </div>
          <button onClick={() => setLabOpen(false)} className="text-gray-600 text-[10px]">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
           <section>
              <h3 className="text-[7px] font-black text-gray-600 uppercase mb-2 flex items-center gap-1.5 tracking-tighter"><MemoryIcon /> NEURAL_MEMORY</h3>
              <div className="space-y-1.5">
                 <input 
                  type="text" 
                  placeholder="Fact to record..."
                  className="w-full bg-white/5 border border-white/5 rounded px-2 py-1 text-[9px] text-white focus:outline-none focus:border-cyan-500/20"
                  onKeyDown={(e) => { if (e.key === 'Enter') { addMemory((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
                 />
                 <div className="space-y-1 max-h-60 overflow-y-auto">
                   {globalMemories.map(mem => (
                     <div key={mem.id} className="p-2 prism-card rounded flex items-center justify-between group/mem">
                        <p className="text-[9px] text-gray-400 leading-tight flex-1 line-clamp-2">{mem.content}</p>
                        <button onClick={() => setGlobalMemories(p => p.filter(m => m.id !== mem.id))} className="opacity-0 group-hover/mem:opacity-100 text-red-400/50 hover:text-red-400 ml-1">✕</button>
                     </div>
                   ))}
                 </div>
              </div>
           </section>

           <div className="h-px bg-white/5"></div>

           <section>
              <h3 className="text-[7px] font-black text-gray-600 uppercase mb-2 flex items-center gap-1.5 tracking-tighter"><PinIcon /> SNIPPETS</h3>
              <div className="space-y-2">
                {pinnedItems.map((item) => (
                  <div key={item.id} className="p-2 prism-card rounded relative group">
                      <button onClick={() => setPinnedItems(p => p.filter(i => i.id !== item.id))} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-600 scale-75">✕</button>
                      <div className="text-[9px] text-gray-500 line-clamp-3 leading-normal">{item.text}</div>
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