
import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, GlobeIcon, LogOutIcon, TrashIcon, 
  SettingsIcon, BrainIcon, GoogleIcon, 
  OpenAIIcon, AnthropicIcon, SearchIcon, ChevronDownIcon,
  LinkIcon, XIcon, ActivityIcon, HelpIcon, DeepSeekIcon, GrokIcon, CheckIcon, LabIcon, MemoryIcon, AgentIcon
} from './Icon';
import { ChatSession, User, Language, AppSettings, GlobalMemory } from '../types';
import { UI_TEXT } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  user: User;
  onLogout: () => void;
  language: Language;
  onToggleLanguage: () => void;
  currentPersonaId: string;
  onUpdatePersona: (personaId: string) => void;
  apiKeys: { google: string, openai: string, anthropic: string, deepseek: string, grok: string };
  onUpdateApiKeys: (keys: { google?: string, openai?: string, anthropic?: string, deepseek?: string, grok?: string }) => void;
  appSettings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  globalMemories: GlobalMemory[];
  onAddMemory: (content: string) => void;
  onDeleteMemory: (id: string) => void;
  width?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, sessions, currentSessionId, onNewChat, onSelectSession, onDeleteSession,
  user, onLogout, language, onToggleLanguage, apiKeys, onUpdateApiKeys, appSettings, onUpdateSettings,
  globalMemories, onAddMemory, onDeleteMemory, width = 260
}) => {
  const t = UI_TEXT[language];
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMemory, setNewMemory] = useState("");
  
  const [tempKeys, setTempKeys] = useState(apiKeys);
  const [tempSettings, setTempSettings] = useState<AppSettings>(appSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (showSettingsModal) {
      setTempKeys(apiKeys);
      setTempSettings(appSettings);
    }
  }, [showSettingsModal, apiKeys, appSettings]);

  const handleSave = () => {
    setIsSaving(true);
    onUpdateApiKeys(tempKeys);
    onUpdateSettings(tempSettings);
    setTimeout(() => {
      setIsSaving(false);
      setShowSettingsModal(false);
    }, 600);
  };

  const submitMemory = () => {
    if (newMemory.trim()) {
      onAddMemory(newMemory);
      setNewMemory("");
    }
  };

  return (
    <>
      <aside style={{ width: window.innerWidth >= 1024 ? `${width}px` : '280px' }} className={`fixed lg:relative inset-y-0 left-0 z-50 glass-panel border-r flex flex-col h-screen flex-shrink-0 shadow-2xl bg-nexus-950 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full relative z-10">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3 mb-6 group cursor-default">
              <div className="w-9 h-9 glass-panel rounded-xl flex items-center justify-center bg-gradient-to-tr from-nexus-accent/20 to-purple-500/20 border-white/10 shadow-lg">
                <BrainIcon />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black italic tracking-tighter text-white uppercase">NEXUS_OS</span>
                <span className="text-[9px] text-nexus-accent font-mono tracking-widest leading-none">MOTHERSHIP</span>
              </div>
            </div>
            <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 p-3 glass-panel rounded-2xl hover:bg-white/5 transition-all text-xs font-black text-white mb-4 border-white/10 tracking-widest uppercase"><PlusIcon /> {t.newChat}</button>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-700"><SearchIcon /></div>
              <input type="text" placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-800 focus:outline-none focus:border-nexus-accent/30 transition-all" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
            {/* AGENT MODE QUICK TOGGLE */}
            <div onClick={() => onUpdateSettings({ ...appSettings, isAgentMode: !appSettings.isAgentMode })} className={`mx-2 p-4 rounded-3xl border transition-all cursor-pointer flex flex-col gap-2 ${appSettings.isAgentMode ? 'bg-nexus-purple/10 border-nexus-purple/40 shadow-glow text-nexus-purple' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/5'}`}>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3"><AgentIcon /><span className="text-[10px] font-black uppercase tracking-widest">Neural_Agent_v4</span></div>
                 <div className={`w-2 h-2 rounded-full ${appSettings.isAgentMode ? 'bg-nexus-purple shadow-glow animate-pulse' : 'bg-gray-800'}`}></div>
               </div>
               {appSettings.isAgentMode && <div className="text-[8px] font-mono text-nexus-purple/60 tracking-widest uppercase">AUTONOMOUS_MATRIX_LINKED</div>}
            </div>

            {/* MANUAL MEMORY SECTION */}
            <div className="px-3 py-4 bg-white/[0.02] rounded-[2.5rem] border border-white/5">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] flex items-center gap-2"><MemoryIcon /> Neural_Memory</span>
              </div>
              <div className="flex flex-col gap-2">
                <input type="text" value={newMemory} onChange={(e) => setNewMemory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitMemory()} placeholder="Log neural pattern..." className="w-full bg-black/40 border border-white/5 rounded-2xl px-3 py-3 text-[10px] text-white focus:outline-none focus:border-nexus-accent/30 placeholder-gray-800" />
                <button onClick={submitMemory} disabled={!newMemory.trim()} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[9px] font-black uppercase transition-all ${newMemory.trim() ? 'bg-nexus-accent text-black shadow-glow' : 'bg-white/5 text-gray-700 opacity-20'}`}><PlusIcon /> Commit To Core</button>
              </div>
            </div>

            <div className="px-2 border-t border-white/5 pt-4">
               <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] px-2 mb-2 block">Terminal_Uplinks</span>
               <div className="space-y-1">
                {sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(session => (
                  <div key={session.id} onClick={() => onSelectSession(session.id)} className={`group relative flex items-center px-4 py-3 rounded-2xl cursor-pointer transition-all border ${currentSessionId === session.id ? 'bg-nexus-accent/10 border-nexus-accent/20 text-white shadow-glow' : 'text-gray-500 hover:bg-white/5 border-transparent'}`}>
                    <span className="truncate text-xs flex-1 font-bold uppercase tracking-tight">{session.title || 'NULL_SESSION'}</span>
                    <button onClick={(e) => onDeleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-black/40 border-t border-white/5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowSettingsModal(true)} className="flex items-center justify-center gap-2 p-3 glass-panel rounded-xl text-[10px] font-black text-gray-500 hover:text-white transition-all uppercase"><SettingsIcon /> {t.settings}</button>
              <button onClick={onToggleLanguage} className="flex items-center justify-center gap-2 p-3 glass-panel rounded-xl text-[10px] font-black text-gray-500 hover:text-white uppercase transition-all tracking-widest"><GlobeIcon /> {language}</button>
            </div>
            <div className="flex items-center justify-between p-3 glass-panel rounded-2xl border-white/10">
               <div className="flex items-center gap-3 min-w-0">
                 <div className="w-8 h-8 rounded-xl bg-nexus-accent/20 flex items-center justify-center border border-white/10 text-[10px] font-black text-nexus-accent uppercase">{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-xl" /> : user.name[0]}</div>
                 <div className="flex flex-col min-w-0 leading-tight"><span className="text-xs font-black text-white truncate uppercase tracking-tighter">{user.name}</span><span className="text-[8px] text-gray-600 font-mono tracking-widest uppercase">Operator_Active</span></div>
               </div>
               <button onClick={onLogout} className="text-gray-700 hover:text-red-400 p-1 transition-colors"><LogOutIcon /></button>
            </div>
          </div>
        </div>
      </aside>

      {showSettingsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={() => setShowSettingsModal(false)}></div>
           <div className="glass-panel w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative z-[111] max-h-[90vh] border border-white/10 animate-in zoom-in-95 duration-200">
              <div className="px-8 py-5 flex items-center justify-between border-b border-white/5 bg-white/2">
                <button onClick={() => setShowSettingsModal(false)} className="text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white">Cancel</button>
                <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">Matrix_Core</h2>
                <div className="w-10"></div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-nexus-950/40">
                 
                 {/* API UPLINKS SECTION */}
                 <section>
                    <div className="px-2 mb-6 text-[10px] text-gray-600 uppercase font-black tracking-widest flex items-center gap-2"><LinkIcon /> API_Uplinks</div>
                    <div className="space-y-4 px-2">
                       <div className="space-y-3">
                          <div className="relative group">
                             <div className="absolute left-4 top-3.5 text-gray-600 group-focus-within:text-emerald-500 transition-colors"><OpenAIIcon /></div>
                             <input 
                               type="password" 
                               value={tempKeys.openai} 
                               onChange={(e) => setTempKeys({...tempKeys, openai: e.target.value})}
                               className="w-full bg-black/40 border border-white/5 text-white rounded-2xl pl-12 pr-4 py-3.5 focus:border-nexus-accent/50 outline-none font-mono text-xs placeholder-gray-800" 
                               placeholder="OpenAI API Key (sk-...)" 
                             />
                          </div>
                          <div className="relative group">
                             <div className="absolute left-4 top-3.5 text-gray-600 group-focus-within:text-blue-500 transition-colors"><DeepSeekIcon /></div>
                             <input 
                               type="password" 
                               value={tempKeys.deepseek} 
                               onChange={(e) => setTempKeys({...tempKeys, deepseek: e.target.value})}
                               className="w-full bg-black/40 border border-white/5 text-white rounded-2xl pl-12 pr-4 py-3.5 focus:border-nexus-accent/50 outline-none font-mono text-xs placeholder-gray-800" 
                               placeholder="DeepSeek API Key" 
                             />
                          </div>
                          <div className="relative group">
                             <div className="absolute left-4 top-3.5 text-gray-600 group-focus-within:text-white transition-colors"><GrokIcon /></div>
                             <input 
                               type="password" 
                               value={tempKeys.grok} 
                               onChange={(e) => setTempKeys({...tempKeys, grok: e.target.value})}
                               className="w-full bg-black/40 border border-white/5 text-white rounded-2xl pl-12 pr-4 py-3.5 focus:border-nexus-accent/50 outline-none font-mono text-xs placeholder-gray-800" 
                               placeholder="Grok API Key" 
                             />
                          </div>
                          <div className="p-3 bg-nexus-accent/5 border border-nexus-accent/10 rounded-xl flex items-center gap-2">
                             <GoogleIcon />
                             <span className="text-[8px] font-mono text-nexus-accent/60 uppercase tracking-widest">Gemini_Core: Managed_By_Host</span>
                          </div>
                       </div>
                    </div>
                 </section>

                 <section>
                    <div className="px-2 mb-6 text-[10px] text-gray-600 uppercase font-black tracking-widest flex items-center gap-2"><AgentIcon /> Agent_Neural_Path</div>
                    <div className="space-y-4 px-2">
                       <div className="flex items-center justify-between p-5 bg-nexus-purple/5 rounded-[2rem] border border-nexus-purple/20">
                          <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-nexus-purple">Autonomous_Mode</span><span className="text-[8px] text-gray-500 font-mono">HIGH_AGENCY_EXECUTION</span></div>
                          <button onClick={() => setTempSettings({...tempSettings, isAgentMode: !tempSettings.isAgentMode})} className={`w-12 h-6 rounded-full transition-all relative ${tempSettings.isAgentMode ? 'bg-nexus-purple shadow-glow' : 'bg-white/10'}`}>
                             <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${tempSettings.isAgentMode ? 'left-7' : 'left-1'}`}></div>
                          </button>
                       </div>
                       <div className="grid grid-cols-3 gap-2">
                          {(['general', 'researcher', 'developer'] as const).map(type => (
                            <button key={type} onClick={() => setTempSettings({...tempSettings, agentType: type})} className={`py-3 rounded-2xl border text-[9px] font-black uppercase tracking-tight transition-all ${tempSettings.agentType === type ? 'bg-nexus-purple/20 border-nexus-purple/40 text-nexus-purple' : 'bg-white/5 border-transparent text-gray-600 hover:text-gray-400'}`}>{type}</button>
                          ))}
                       </div>
                    </div>
                 </section>

                 <section>
                    <div className="px-2 mb-6 text-[10px] text-gray-600 uppercase font-black tracking-widest flex items-center gap-2"><MemoryIcon /> Persistent_Recall</div>
                    <div className="space-y-4 px-2">
                       <div className="flex items-center justify-between p-5 bg-white/2 rounded-[2rem] border border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Memory_Protocol</span>
                          <button onClick={() => setTempSettings({...tempSettings, useMemories: !tempSettings.useMemories})} className={`w-12 h-6 rounded-full transition-all relative ${tempSettings.useMemories ? 'bg-nexus-accent shadow-glow' : 'bg-white/10'}`}>
                             <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${tempSettings.useMemories ? 'left-7' : 'left-1'}`}></div>
                          </button>
                       </div>
                    </div>
                 </section>

                 <section>
                    <div className="px-2 mb-6 text-[10px] text-gray-600 uppercase font-black tracking-widest flex items-center gap-2"><SettingsIcon /> Processing_Params</div>
                    <div className="space-y-6 px-2">
                       <div className="space-y-3">
                          <div className="flex justify-between text-[10px] font-mono uppercase tracking-tighter"><span className="text-gray-400">Thinking Budget</span><span className="text-nexus-accent">{tempSettings.thinkingBudget} Tokens</span></div>
                          <input type="range" min="0" max="16384" step="1024" value={tempSettings.thinkingBudget} onChange={(e) => setTempSettings({...tempSettings, thinkingBudget: parseInt(e.target.value)})} className="w-full accent-nexus-accent opacity-70 hover:opacity-100" />
                       </div>
                       <div className="flex items-center justify-between p-5 bg-white/2 rounded-[2rem] border border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Search_Grounding</span>
                          <button onClick={() => setTempSettings({...tempSettings, useSearch: !tempSettings.useSearch})} className={`w-12 h-6 rounded-full transition-all relative ${tempSettings.useSearch ? 'bg-nexus-accent shadow-glow' : 'bg-white/10'}`}>
                             <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${tempSettings.useSearch ? 'left-7' : 'left-1'}`}></div>
                          </button>
                       </div>
                    </div>
                 </section>
              </div>
              <div className="p-8 border-t border-white/5 bg-white/2 flex gap-3">
                 <button onClick={handleSave} disabled={isSaving} className={`flex-1 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-2 ${isSaving ? 'bg-emerald-500 text-black' : 'bg-nexus-accent text-black shadow-lg hover:scale-[1.02]'}`}>
                   {isSaving ? <CheckIcon /> : 'Synchronize_Matrix'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
