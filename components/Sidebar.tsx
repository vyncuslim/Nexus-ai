import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, GlobeIcon, LogOutIcon, TrashIcon, 
  SettingsIcon, BrainIcon, GoogleIcon, 
  OpenAIIcon, AnthropicIcon, SearchIcon, ChevronDownIcon,
  LinkIcon, XIcon, ActivityIcon, DeepSeekIcon, GrokIcon, CheckIcon, AgentIcon, MemoryIcon, CommandIcon, UserIcon
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
  apiKeys: { google: string, openai: string, anthropic: string, deepseek: string, grok: string, googleClientId?: string };
  onUpdateApiKeys: (keys: { google?: string, openai?: string, anthropic?: string, deepseek?: string, grok?: string, googleClientId?: string }) => void;
  onUpdateUserProfile?: (name: string, avatar: string) => void;
  appSettings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  globalMemories: GlobalMemory[];
  onAddMemory: (content: string) => void;
  onDeleteMemory: (id: string) => void;
  width?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, sessions, currentSessionId, onNewChat, onSelectSession, onDeleteSession,
  user, onLogout, language, onToggleLanguage, apiKeys, onUpdateApiKeys, onUpdateUserProfile, appSettings, onUpdateSettings,
  globalMemories, onAddMemory, onDeleteMemory, width = 260
}) => {
  const t = UI_TEXT[language];
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempKeys, setTempKeys] = useState(apiKeys);
  const [tempSettings, setTempSettings] = useState<AppSettings>(appSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCodes, setActiveCodes] = useState<string[]>([]);

  useEffect(() => {
    if (showSettingsModal) {
      setTempKeys(apiKeys);
      setTempSettings(appSettings);
      
      const stored = localStorage.getItem('nexus_active_codes');
      if (stored) {
        try {
          setActiveCodes(JSON.parse(stored));
        } catch (e) {
          setActiveCodes(["NEXUS-0001", "NEXUS-0002", "NEXUS-0003"]);
        }
      } else {
        const initial = ["NEXUS-0001", "NEXUS-0002", "NEXUS-0003"];
        localStorage.setItem('nexus_active_codes', JSON.stringify(initial));
        setActiveCodes(initial);
      }
    }
  }, [showSettingsModal, apiKeys, appSettings]);

  const handleSave = () => {
    setIsSaving(true);
    onUpdateApiKeys(tempKeys);
    onUpdateSettings(tempSettings);
    setTimeout(() => {
      setIsSaving(false);
      setShowSettingsModal(false);
    }, 800);
  };

  const generateCode = () => {
    const newCode = `NEXUS-${Math.floor(Math.random() * 9000 + 1000)}`;
    const updated = [...activeCodes, newCode];
    setActiveCodes(updated);
    localStorage.setItem('nexus_active_codes', JSON.stringify(updated));
  };

  const revokeCode = (code: string) => {
    const updated = activeCodes.filter(c => c !== code);
    setActiveCodes(updated);
    localStorage.setItem('nexus_active_codes', JSON.stringify(updated));
  };

  return (
    <>
      <aside style={{ width: window.innerWidth >= 1024 ? `${width}px` : '280px' }} className={`fixed lg:relative inset-y-0 left-0 z-50 glass-panel border-r flex flex-col h-screen flex-shrink-0 shadow-2xl bg-nexus-950 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full relative z-10">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3 mb-6 group cursor-default">
              <div className="w-9 h-9 glass-panel rounded-xl flex items-center justify-center bg-gradient-to-tr from-nexus-accent/20 to-purple-500/20 border-white/10 shadow-lg"><BrainIcon /></div>
              <div className="flex flex-col">
                <span className="text-sm font-black italic tracking-tighter text-white uppercase">NEXUS_OS</span>
                <span className="text-[9px] text-nexus-accent font-mono tracking-widest leading-none">TERMINAL</span>
              </div>
            </div>
            <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 p-3 glass-panel rounded-2xl hover:bg-white/5 transition-all text-xs font-black text-white mb-4 border-white/10 tracking-widest uppercase"><PlusIcon /> {t.newChat}</button>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-700"><SearchIcon /></div>
              <input type="text" placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-800 focus:outline-none focus:border-nexus-accent/30" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
            <div onClick={() => onUpdateSettings({ ...appSettings, isAgentMode: !appSettings.isAgentMode })} className={`mx-2 p-4 rounded-3xl border transition-all cursor-pointer flex flex-col gap-2 ${appSettings.isAgentMode ? 'bg-nexus-purple/10 border-nexus-purple/40 shadow-glow text-nexus-purple' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/5'}`}>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3"><AgentIcon /><span className="text-[10px] font-black uppercase tracking-widest">Neural_Agent</span></div>
                 <div className={`w-2 h-2 rounded-full ${appSettings.isAgentMode ? 'bg-nexus-purple shadow-glow animate-pulse' : 'bg-gray-800'}`}></div>
               </div>
            </div>

            <div className="px-2 border-t border-white/5 pt-4">
               <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] px-2 mb-2 block">Uplinks</span>
               <div className="space-y-1">
                {sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(session => (
                  <div key={session.id} onClick={() => onSelectSession(session.id)} className={`group relative flex items-center px-4 py-3 rounded-2xl cursor-pointer transition-all border ${currentSessionId === session.id ? 'bg-nexus-accent/10 border-nexus-accent/20 text-white shadow-glow' : 'text-gray-500 hover:bg-white/5 border-transparent'}`}>
                    <span className="truncate text-xs flex-1 font-bold uppercase tracking-tight">{session.title || 'UNNAMED'}</span>
                    <button onClick={(e) => onDeleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-black/40 border-t border-white/5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowSettingsModal(true)} className="flex items-center justify-center gap-2 p-2.5 glass-panel rounded-xl text-[10px] font-black text-gray-500 hover:text-white uppercase transition-all hover:bg-white/5"><SettingsIcon /> {t.settings}</button>
              <button onClick={onToggleLanguage} className="flex items-center justify-center gap-2 p-2.5 glass-panel rounded-xl text-[10px] font-black text-gray-500 hover:text-white uppercase transition-all hover:bg-white/5"><GlobeIcon /> {language}</button>
            </div>
            <div className="flex items-center justify-between p-3 glass-panel rounded-2xl border-white/10">
               <div className="flex items-center gap-3 min-w-0">
                 <div className="w-8 h-8 rounded-xl bg-nexus-accent/20 flex items-center justify-center border border-white/10 text-[10px] font-black text-nexus-accent uppercase overflow-hidden">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="text-nexus-accent font-black uppercase text-[10px]">{user.name[0]}</div>}
                 </div>
                 <div className="flex flex-col min-w-0 leading-tight">
                    <span className="text-xs font-black text-white truncate uppercase tracking-tighter">{user.name}</span>
                    <span className="text-[8px] text-gray-600 font-mono tracking-widest uppercase">Operator</span>
                 </div>
               </div>
               <button onClick={onLogout} className="text-gray-700 hover:text-red-400 p-1 transition-colors"><LogOutIcon /></button>
            </div>
          </div>
        </div>
      </aside>

      {showSettingsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300" onClick={() => setShowSettingsModal(false)}></div>
           <div className="glass-panel w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative z-[111] max-h-[90vh] border border-white/10 animate-in zoom-in-95 duration-300">
              
              <div className="px-8 py-6 flex items-center justify-between border-b border-white/5">
                <div className="flex flex-col">
                  <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">Matrix_Core</h2>
                  <span className="text-[8px] font-mono text-gray-600 tracking-widest uppercase">Configuration_Module_v2.5</span>
                </div>
                <button onClick={() => setShowSettingsModal(false)} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
                  <XIcon />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-nexus-950/40">
                 
                 <section>
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                       <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                         <CommandIcon /> Access_Control
                       </h3>
                    </div>
                    <div className="p-5 iphone-group bg-white/[0.02] border border-white/5 space-y-4">
                       <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Active_Token</span>
                            <span className="text-[9px] text-nexus-accent font-mono">{user.inviteCode}</span>
                          </div>
                          <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${user.isOwner ? 'bg-nexus-purple text-white shadow-glow' : 'bg-gray-800 text-gray-500'}`}>
                             {user.isOwner ? 'Matrix_Owner' : 'Operator'}
                          </div>
                       </div>
                       
                       {user.isOwner && (
                         <div className="pt-4 border-t border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                               <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Active_Invite_Registry</span>
                               <button onClick={generateCode} className="text-[9px] text-nexus-accent font-black uppercase hover:underline">+ Generate</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                               {activeCodes.map(code => (
                                 <div key={code} className="flex items-center justify-between p-2 bg-black/40 rounded-xl border border-white/5 group">
                                    <span className="text-[10px] font-mono text-gray-400">{code}</span>
                                    <button onClick={() => revokeCode(code)} className="opacity-0 group-hover:opacity-100 text-red-500 text-[10px] transition-opacity hover:scale-110">✕</button>
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}
                    </div>
                 </section>

                 <section>
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-1.5 h-6 bg-nexus-purple rounded-full"></div>
                       <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                         <ActivityIcon /> Engine_Parameters
                       </h3>
                    </div>
                    <div className="space-y-5">
                       <div className="p-5 iphone-group bg-white/[0.02] border border-white/5 space-y-6">
                          <div className="space-y-3">
                             <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
                               <span className="text-gray-400">Thinking_Budget</span>
                               <span className="text-nexus-accent">{tempSettings.thinkingBudget} Tokens</span>
                             </div>
                             <input 
                               type="range" min="0" max="32768" step="1024" 
                               value={tempSettings.thinkingBudget} 
                               onChange={(e) => setTempSettings({...tempSettings, thinkingBudget: parseInt(e.target.value)})}
                               className="w-full accent-nexus-accent opacity-70 hover:opacity-100 transition-opacity" 
                             />
                          </div>

                          <div className="flex items-center justify-between pt-2">
                             <div className="flex flex-col">
                               <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Web_Grounding</span>
                               <span className="text-[8px] text-gray-600 font-mono">LIVE_SEARCH_PROTOCOL</span>
                             </div>
                             <button 
                               onClick={() => setTempSettings({...tempSettings, useSearch: !tempSettings.useSearch})}
                               className={`w-12 h-6 rounded-full relative transition-all duration-300 ${tempSettings.useSearch ? 'bg-nexus-accent shadow-glow' : 'bg-white/10'}`}
                             >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${tempSettings.useSearch ? 'translate-x-7' : 'translate-x-1'}`}></div>
                             </button>
                          </div>
                       </div>
                    </div>
                 </section>
              </div>

              <div className="p-8 border-t border-white/5 bg-white/2 flex gap-4">
                 <button 
                   onClick={handleSave} 
                   disabled={isSaving} 
                   className={`flex-1 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 ${isSaving ? 'bg-emerald-500 text-black shadow-glow' : 'bg-nexus-accent text-black shadow-lg hover:scale-[1.02] active:scale-95'}`}
                 >
                   {isSaving ? <><CheckIcon /> Synchronizing...</> : 'Synchronize_Matrix'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;