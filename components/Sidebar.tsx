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
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, sessions, currentSessionId, onNewChat, onSelectSession, onDeleteSession,
  user, onLogout, language, onToggleLanguage, apiKeys, onUpdateApiKeys, onUpdateUserProfile, appSettings, onUpdateSettings,
  globalMemories, onAddMemory, onDeleteMemory
}) => {
  const t = UI_TEXT[language];
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSettings, setTempSettings] = useState<AppSettings>(appSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCodes, setActiveCodes] = useState<string[]>([]);

  useEffect(() => {
    if (showSettingsModal) {
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
  }, [showSettingsModal, appSettings]);

  const handleSave = () => {
    setIsSaving(true);
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
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 glass-panel border-r flex flex-col h-screen flex-shrink-0 shadow-2xl bg-nexus-950 transition-all duration-300 ease-out w-48 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full relative z-10 text-[10px]">
          <div className="p-3 border-b border-white/5">
            <div className="flex items-center gap-2 mb-4 group cursor-default">
              <div className="w-6 h-6 glass-panel rounded-lg flex items-center justify-center bg-gradient-to-tr from-nexus-accent/20 to-purple-500/20 border-white/10 shadow-lg text-nexus-accent"><BrainIcon /></div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-black italic tracking-tighter text-white uppercase">NEXUS</span>
                <span className="text-[7px] text-nexus-accent font-mono tracking-widest uppercase opacity-60">HUB_V2</span>
              </div>
            </div>
            <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 p-2.5 glass-panel rounded-xl hover:bg-white/5 transition-all font-black text-white mb-3 border-white/10 tracking-widest uppercase"><PlusIcon /> {t.newChat}</button>
            <div className="relative">
              <div className="absolute left-2.5 top-2.5 text-gray-700 scale-75"><SearchIcon /></div>
              <input type="text" placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg pl-8 pr-2 py-1.5 text-[10px] text-white placeholder-gray-800 focus:outline-none focus:border-nexus-accent/30" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
            <div onClick={() => onUpdateSettings({ ...appSettings, isAgentMode: !appSettings.isAgentMode })} className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${appSettings.isAgentMode ? 'bg-nexus-purple/10 border-nexus-purple/40 shadow-glow text-nexus-purple' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/5'}`}>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2"><AgentIcon /><span className="font-black uppercase tracking-widest text-[9px]">Agent_Mode</span></div>
                 <div className={`w-1.5 h-1.5 rounded-full ${appSettings.isAgentMode ? 'bg-nexus-purple shadow-glow animate-pulse' : 'bg-gray-800'}`}></div>
               </div>
            </div>

            <div className="pt-2">
               <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.2em] px-2 mb-2 block">Uplinks</span>
               <div className="space-y-0.5">
                {sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(session => (
                  <div key={session.id} onClick={() => onSelectSession(session.id)} className={`group relative flex items-center px-2 py-1.5 rounded-lg cursor-pointer transition-all border ${currentSessionId === session.id ? 'bg-nexus-accent/10 border-nexus-accent/20 text-white shadow-glow' : 'text-gray-500 hover:bg-white/5 border-transparent'}`}>
                    <span className="truncate flex-1 font-bold uppercase tracking-tight">{session.title || 'UNNAMED'}</span>
                    <button onClick={(e) => onDeleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all text-[8px]">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-black/40 border-t border-white/5 space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => setShowSettingsModal(true)} className="flex items-center justify-center gap-1.5 p-2 glass-panel rounded-lg font-black text-gray-500 hover:text-white uppercase transition-all hover:bg-white/5"><SettingsIcon /> {t.settings}</button>
              <button onClick={onToggleLanguage} className="flex items-center justify-center gap-1.5 p-2 glass-panel rounded-lg font-black text-gray-500 hover:text-white uppercase transition-all hover:bg-white/5"><GlobeIcon /> {language}</button>
            </div>
            <div className="flex items-center justify-between p-2 glass-panel rounded-xl border-white/10">
               <div className="flex items-center gap-2 min-w-0">
                 <div className="w-5 h-5 rounded-lg bg-nexus-accent/20 flex items-center justify-center border border-white/10 text-[9px] font-black text-nexus-accent uppercase overflow-hidden">
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name[0]}
                 </div>
                 <div className="flex flex-col min-w-0 leading-tight">
                    <span className="font-black text-white truncate uppercase tracking-tighter">{user.name}</span>
                 </div>
               </div>
               <button onClick={onLogout} className="text-gray-700 hover:text-red-400 p-1 transition-colors"><LogOutIcon /></button>
            </div>
          </div>
        </div>
      </aside>

      {showSettingsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowSettingsModal(false)}></div>
           <div className="glass-panel w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl flex flex-col relative z-[111] max-h-[85vh] border border-white/10 animate-in zoom-in-95 duration-300 text-[10px]">
              
              <div className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-black/20">
                <div className="flex flex-col">
                  <h2 className="font-black text-white uppercase tracking-[0.2em]">Matrix_Core</h2>
                  <span className="text-[7px] font-mono text-gray-600 tracking-widest uppercase">Params_Module_v2.5</span>
                </div>
                <button onClick={() => setShowSettingsModal(false)} className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
                  <XIcon />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-nexus-950/40">
                 <section>
                    <div className="flex items-center gap-2 mb-3">
                       <div className="w-1 h-3.5 bg-amber-500 rounded-full"></div>
                       <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-1.5"><CommandIcon /> Access_Control</h3>
                    </div>
                    <div className="p-3 iphone-group bg-white/[0.02] border border-white/5 space-y-2.5">
                       <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-black text-gray-500 uppercase tracking-widest text-[8px]">Active_Token</span>
                            <span className="text-nexus-accent font-mono text-[9px]">{user.inviteCode}</span>
                          </div>
                          <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${user.isOwner ? 'bg-nexus-purple text-white' : 'bg-gray-800 text-gray-500'}`}>
                             {user.isOwner ? 'Owner' : 'Operator'}
                          </div>
                       </div>
                       
                       {user.isOwner && (
                         <div className="pt-2.5 border-t border-white/5 space-y-2.5">
                            <div className="flex items-center justify-between">
                               <span className="text-gray-600 uppercase tracking-widest font-bold text-[8px]">Invite_Registry</span>
                               <button onClick={generateCode} className="text-nexus-accent font-black uppercase hover:underline text-[8px]">+ Gen</button>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                               {activeCodes.map(code => (
                                 <div key={code} className="flex items-center justify-between p-1.5 bg-black/40 rounded-lg border border-white/5 group">
                                    <span className="font-mono text-gray-400 text-[8px]">{code}</span>
                                    <button onClick={() => revokeCode(code)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:scale-110 transition-all text-[8px]">✕</button>
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}
                    </div>
                 </section>

                 <section>
                    <div className="flex items-center gap-2 mb-3">
                       <div className="w-1 h-3.5 bg-nexus-emerald rounded-full"></div>
                       <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-1.5"><AgentIcon /> Agent_Profile</h3>
                    </div>
                    <div className="p-3 iphone-group bg-white/[0.02] border border-white/5 space-y-2.5">
                       <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                         {(['general', 'researcher', 'developer'] as const).map((type) => (
                           <button 
                             key={type} 
                             onClick={() => setTempSettings({ ...tempSettings, agentType: type })}
                             className={`py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${tempSettings.agentType === type ? 'bg-nexus-accent text-black shadow-glow' : 'text-gray-600 hover:text-gray-400'}`}
                           >
                             {type}
                           </button>
                         ))}
                       </div>
                       <p className="text-[7px] text-gray-700 font-mono italic uppercase px-1 leading-tight">Configures logic constraints and specialized system instructions.</p>
                    </div>
                 </section>

                 <section>
                    <div className="flex items-center gap-2 mb-3">
                       <div className="w-1 h-3.5 bg-nexus-purple rounded-full"></div>
                       <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-1.5"><ActivityIcon /> Engine_Params</h3>
                    </div>
                    <div className="p-3 iphone-group bg-white/[0.02] border border-white/5 space-y-4">
                       <div className="space-y-1.5">
                          <div className="flex justify-between font-mono uppercase tracking-widest text-[8px]">
                            <span className="text-gray-500">Think_Budget</span>
                            <span className="text-nexus-accent">{tempSettings.thinkingBudget}</span>
                          </div>
                          <input 
                            type="range" min="0" max="32768" step="1024" 
                            value={tempSettings.thinkingBudget} 
                            onChange={(e) => setTempSettings({...tempSettings, thinkingBudget: parseInt(e.target.value)})}
                            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-nexus-accent" 
                          />
                       </div>

                       <div className="flex items-center justify-between pt-1">
                          <div className="flex flex-col">
                            <span className="font-black text-gray-400 uppercase tracking-widest text-[8px]">Grounding</span>
                            <span className="text-[7px] text-gray-700 font-mono">SEARCH_PROTO</span>
                          </div>
                          <button 
                            onClick={() => setTempSettings({...tempSettings, useSearch: !tempSettings.useSearch})}
                            className={`w-8 h-4 rounded-full relative transition-all duration-300 ${tempSettings.useSearch ? 'bg-nexus-accent shadow-glow' : 'bg-white/10'}`}
                          >
                             <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-300 ${tempSettings.useSearch ? 'translate-x-4.5' : 'translate-x-0.5'}`}></div>
                          </button>
                       </div>
                    </div>
                 </section>
              </div>

              <div className="p-5 border-t border-white/5 bg-black/20">
                 <button 
                   onClick={handleSave} 
                   disabled={isSaving} 
                   className={`w-full py-3 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${isSaving ? 'bg-emerald-500 text-black shadow-glow' : 'bg-nexus-accent text-black hover:scale-[1.01] active:scale-95'}`}
                 >
                   {isSaving ? 'SYNCING...' : 'SYNC_MATRIX'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;