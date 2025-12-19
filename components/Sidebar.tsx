
import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, GlobeIcon, LogOutIcon, TrashIcon, 
  SettingsIcon, BrainIcon, GoogleIcon, 
  OpenAIIcon, AnthropicIcon, SearchIcon, ChevronDownIcon,
  LinkIcon, XIcon, ActivityIcon, HelpIcon, DeepSeekIcon, GrokIcon, CheckIcon
} from './Icon';
import { ChatSession, User, Language } from '../types';
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
  width?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, sessions, currentSessionId, onNewChat, onSelectSession, onDeleteSession,
  user, onLogout, language, onToggleLanguage, apiKeys, onUpdateApiKeys, width = 260
}) => {
  const t = UI_TEXT[language];
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  
  // Local state for keys before saving
  const [localKeys, setLocalKeys] = useState(apiKeys);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalKeys(apiKeys);
  }, [apiKeys, showSettingsModal]);

  const handleSaveKeys = () => {
    setIsSaving(true);
    onUpdateApiKeys(localKeys);
    setTimeout(() => {
      setIsSaving(false);
      setEditingProvider(null);
    }, 800);
  };

  return (
    <>
      <aside 
        style={{ width: window.innerWidth >= 1024 ? `${width}px` : '280px' }}
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 glass-panel border-r flex flex-col h-screen flex-shrink-0 shadow-2xl bg-nexus-950/95 transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full relative z-10">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3 mb-6 group cursor-default">
              <div className="w-9 h-9 glass-panel rounded-xl flex items-center justify-center bg-gradient-to-tr from-nexus-accent/20 to-purple-500/20 border-white/10 shadow-lg">
                <BrainIcon />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black italic tracking-tighter text-white uppercase">NEXUS_OS</span>
                <span className="text-[9px] text-nexus-accent font-mono tracking-widest leading-none">CORE BRIDGE</span>
              </div>
            </div>

            <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 p-3 glass-panel rounded-2xl hover:bg-white/5 transition-all text-xs font-black text-white mb-4 border-white/10 tracking-widest uppercase">
              <PlusIcon /> {t.newChat}
            </button>

            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-700"><SearchIcon /></div>
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-800 focus:outline-none focus:border-nexus-accent/30 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(session => (
              <div 
                key={session.id} onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-center px-4 py-3 rounded-2xl cursor-pointer transition-all border ${currentSessionId === session.id ? 'bg-nexus-accent/10 border-nexus-accent/20 text-white shadow-glow' : 'text-gray-500 hover:bg-white/5 border-transparent'}`}
              >
                <span className="truncate text-xs flex-1 font-bold uppercase tracking-tight">{session.title || 'NULL_SIGNAL'}</span>
                <button onClick={(e) => onDeleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all">✕</button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-black/40 border-t border-white/5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowSettingsModal(true)} className="flex items-center justify-center gap-2 p-2.5 glass-panel rounded-xl text-[10px] font-black text-gray-500 hover:text-white transition-all uppercase"><SettingsIcon /> {t.settings}</button>
              <button onClick={onToggleLanguage} className="flex items-center justify-center gap-2 p-2.5 glass-panel rounded-xl text-[10px] font-black text-gray-500 hover:text-white uppercase transition-all tracking-widest"><GlobeIcon /> {language}</button>
            </div>
            <div className="flex items-center justify-between p-3 glass-panel rounded-2xl border-white/10">
               <div className="flex items-center gap-3 min-w-0">
                 <div className="w-8 h-8 rounded-xl bg-nexus-accent/20 flex items-center justify-center border border-white/10 text-[10px] font-black text-nexus-accent">
                   {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-xl" /> : user.name[0].toUpperCase()}
                 </div>
                 <div className="flex flex-col min-w-0 leading-tight">
                    <span className="text-xs font-black text-white truncate uppercase tracking-tighter">{user.name}</span>
                    <span className="text-[8px] text-gray-600 font-mono tracking-widest">OPERATOR</span>
                 </div>
               </div>
               <button onClick={onLogout} className="text-gray-700 hover:text-red-400 p-1 transition-colors"><LogOutIcon /></button>
            </div>
          </div>
        </div>
      </aside>

      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={() => setShowSettingsModal(false)}></div>
           <div className="glass-panel w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative z-[101] max-h-[90vh] border border-white/10 animate-in zoom-in-95 duration-200">
              <div className="px-8 py-5 flex items-center justify-between border-b border-white/5 bg-white/2">
                <button onClick={() => setShowSettingsModal(false)} className="text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Close</button>
                <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">Neural_Configuration</h2>
                <div className="w-10"></div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-nexus-950/40">
                 <section>
                    <div className="px-2 mb-4 text-[10px] text-gray-600 uppercase font-black tracking-widest flex items-center gap-2">
                       <LinkIcon /> Neural_Connectors
                    </div>
                    <div className="space-y-3">
                      {[
                        { id: 'deepseek', name: 'DeepSeek (V3/R1)', icon: <DeepSeekIcon />, key: localKeys.deepseek, ph: t.deepseekKeyPlaceholder },
                        { id: 'grok', name: 'Grok xAI (2.0)', icon: <GrokIcon />, key: localKeys.grok, ph: t.grokKeyPlaceholder },
                        { id: 'openai', name: 'OpenAI (GPT-4o)', icon: <OpenAIIcon />, key: localKeys.openai, ph: t.openaiKeyPlaceholder },
                        { id: 'anthropic', name: 'Claude (3.5)', icon: <AnthropicIcon />, key: localKeys.anthropic, ph: "Anthropic Key" },
                      ].map(p => (
                        <div key={p.id} className="glass-panel rounded-2xl overflow-hidden border-white/5 transition-all hover:border-white/10">
                          <div 
                            onClick={() => setEditingProvider(editingProvider === p.id ? null : p.id)}
                            className="flex items-center gap-4 py-4 px-5 cursor-pointer active:bg-white/5"
                          >
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-nexus-accent shadow-inner border border-white/5">{p.icon}</div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-300 font-black uppercase tracking-tighter">{p.name}</div>
                              <div className="text-[8px] text-gray-600 font-mono tracking-widest mt-0.5">{p.key ? 'ENCRYPTED_LINK_ACTIVE' : 'NO_SIGNAL_DETECTED'}</div>
                            </div>
                            <div className={`transition-transform duration-300 text-gray-700 ${editingProvider === p.id ? 'rotate-180' : ''}`}><ChevronDownIcon /></div>
                          </div>
                          {editingProvider === p.id && (
                            <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2">
                              <input 
                                type="password" 
                                value={p.key || ''} 
                                onChange={(e) => setLocalKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white font-mono focus:border-nexus-accent/50 outline-none shadow-inner"
                                placeholder={p.ph}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                 </section>
              </div>

              <div className="p-6 border-t border-white/5 bg-white/2 flex gap-3">
                 <button 
                   onClick={handleSaveKeys}
                   disabled={isSaving}
                   className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 ${isSaving ? 'bg-emerald-500 text-black' : 'bg-nexus-accent text-black hover:scale-[1.02]'}`}
                 >
                   {isSaving ? <><CheckIcon /> Saved_to_Core</> : 'Sync to Core'}
                 </button>
                 <button className="py-4 px-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-red-500/20 transition-all" onClick={onLogout}>
                    Wipe
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
