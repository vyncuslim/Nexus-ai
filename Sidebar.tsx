import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, GlobeIcon, LogOutIcon, TrashIcon, 
  SettingsIcon, BrainIcon, GoogleIcon, 
  OpenAIIcon, AnthropicIcon, SearchIcon, ChevronDownIcon,
  LinkIcon, XIcon, ActivityIcon, DeepSeekIcon, GrokIcon, CheckIcon, AgentIcon, MemoryIcon
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

  const KeyInput = ({ icon, provider, value, onChange, placeholder }: any) => (
    <div className="relative group">
      <div className="absolute left-4 top-3.5 text-gray-700 group-focus-within:text-nexus-accent transition-colors">{icon}</div>
      <input 
        type="password" 
        value={value} 
        onChange={onChange}
        className="w-full bg-black/40 border border-white/5 text-white rounded-2xl pl-12 pr-4 py-3 focus:border-nexus-accent/40 outline-none font-mono text-[11px] placeholder-gray-800" 
        placeholder={placeholder} 
      />
    </div>
  );

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
                    <button onClick={(e) => onDeleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-black/40 border-t border-white/5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowSettingsModal(true)} className="flex items-center justify-center gap-2 p-2.5 glass-panel rounded-xl text-[10px] font-black text-gray-500 hover:text-white uppercase transition-all"><SettingsIcon /> {t.settings}</button>
              <button onClick={onToggleLanguage} className="flex items-center justify-center gap-2 p-2.5 glass-panel rounded-xl text-[10px] font-black text-gray-500 hover:text-white uppercase transition-all"><GlobeIcon /> {language}</button>
            </div>
            <div className="flex items-center justify-between p-3 glass-panel rounded-2xl border-white/10">
               <div className="flex items-center gap-3 min-w-0">
                 <div className="w-8 h-8 rounded-xl bg-nexus-accent/20 flex items-center justify-center border border-white/10 text-[10px] font-black text-nexus-accent uppercase">{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-xl" /> : user.name[0]}</div>
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
           <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={() => setShowSettingsModal(false)}></div>
           <div className="glass-panel w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl flex flex-col relative z-[111] max-h-[85vh] border border-white/10 animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Matrix_Control</h2>
                <button onClick={() => setShowSettingsModal(false)} className="text-gray-600 hover:text-white text-xs">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-nexus-950/40">
                 <section>
                    <div className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-4 flex items-center gap-2"><LinkIcon /> API_UPLINKS</div>
                    <div className="space-y-3">
                       <KeyInput icon={<GoogleIcon />} value={tempKeys.google} onChange={(e: any) => setTempKeys({...tempKeys, google: e.target.value})} placeholder={t.googleKeyPlaceholder} />
                       <KeyInput icon={<DeepSeekIcon />} value={tempKeys.deepseek} onChange={(e: any) => setTempKeys({...tempKeys, deepseek: e.target.value})} placeholder={t.deepseekKeyPlaceholder} />
                       <KeyInput icon={<GrokIcon />} value={tempKeys.grok} onChange={(e: any) => setTempKeys({...tempKeys, grok: e.target.value})} placeholder={t.grokKeyPlaceholder} />
                       <KeyInput icon={<AnthropicIcon />} value={tempKeys.anthropic} onChange={(e: any) => setTempKeys({...tempKeys, anthropic: e.target.value})} placeholder={t.anthropicKeyPlaceholder} />
                       <KeyInput icon={<OpenAIIcon />} value={tempKeys.openai} onChange={(e: any) => setTempKeys({...tempKeys, openai: e.target.value})} placeholder={t.openaiKeyPlaceholder} />
                    </div>
                 </section>

                 <section>
                    <div className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-4 flex items-center gap-2"><ActivityIcon /> PARAMS</div>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-3 bg-white/2 rounded-2xl border border-white/5">
                          <span className="text-[10px] font-bold text-gray-300">Grounding</span>
                          <button onClick={() => setTempSettings({...tempSettings, useSearch: !tempSettings.useSearch})} className={`w-10 h-5 rounded-full relative transition-all ${tempSettings.useSearch ? 'bg-nexus-accent shadow-glow' : 'bg-white/10'}`}>
                             <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${tempSettings.useSearch ? 'left-6' : 'left-1'}`}></div>
                          </button>
                       </div>
                    </div>
                 </section>
              </div>
              <div className="p-6 border-t border-white/5 bg-white/2">
                 <button onClick={handleSave} disabled={isSaving} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 ${isSaving ? 'bg-emerald-500 text-black' : 'bg-nexus-accent text-black shadow-lg hover:scale-[1.02]'}`}>
                   {isSaving ? <CheckIcon /> : 'Sync_Core'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;