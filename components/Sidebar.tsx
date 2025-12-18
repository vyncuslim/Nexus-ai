import React, { useState } from 'react';
import { 
  PlusIcon, GlobeIcon, LogOutIcon, TrashIcon, 
  SettingsIcon, BrainIcon, GoogleIcon, 
  OpenAIIcon, AnthropicIcon, SearchIcon, CheckIcon, ChevronDownIcon
} from './Icon';
import { ChatSession, User, Language } from '../types';
import { UI_TEXT, PERSONAS } from '../constants';

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
  apiKeys: { google: string, openai: string, anthropic: string };
  onUpdateApiKeys: (keys: { google?: string, openai?: string, anthropic?: string }) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, currentSessionId, onNewChat, onSelectSession, onDeleteSession,
  user, onLogout, language, onToggleLanguage,
  currentPersonaId, onUpdatePersona, apiKeys, onUpdateApiKeys
}) => {
  const t = UI_TEXT[language];
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProvider, setEditingProvider] = useState<string | null>(null);

  const handleKeyChange = (provider: 'google' | 'openai' | 'anthropic', value: string) => {
    onUpdateApiKeys({ [provider]: value });
  };

  return (
    <>
      <aside className="w-56 glass-panel border-r flex flex-col h-screen flex-shrink-0 z-30 shadow-xl bg-nexus-950/60 transition-all duration-300">
        <div className="flex flex-col h-full backdrop-blur-3xl">
          {/* Compact Logo */}
          <div className="p-3 border-b border-white/5">
            <div className="flex items-center gap-2 mb-3 group cursor-default">
              <div className="w-6 h-6 glass-panel rounded-lg flex items-center justify-center bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 shadow-lg border-cyan-500/10">
                <BrainIcon />
              </div>
              <span className="text-sm font-black italic tracking-tighter text-white">NEXUS<span className="text-cyan-400 font-mono">_V2</span></span>
            </div>

            <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 p-2 glass-panel rounded-lg hover:bg-white/5 transition-all text-[10px] font-bold text-white mb-3 group border-white/10">
              <PlusIcon /> {t.newChat}
            </button>

            <div className="relative">
              <div className="absolute left-2.5 top-2.5 text-gray-600 scale-75"><SearchIcon /></div>
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full bg-white/5 border border-white/5 rounded-md pl-7 pr-2 py-1.5 text-[10px] text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/20 transition-all"
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {sessions.length > 0 && (
              <>
                <div className="px-2 py-1 text-[8px] font-black text-gray-600 uppercase tracking-widest opacity-50">LOGS</div>
                {sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(session => (
                  <div 
                    key={session.id} onClick={() => onSelectSession(session.id)}
                    className={`group relative flex items-center px-2 py-1.5 rounded-md cursor-pointer transition-all border ${currentSessionId === session.id ? 'bg-cyan-500/5 border-cyan-500/20 text-white shadow-sm' : 'text-gray-500 hover:bg-white/5 border-transparent hover:text-gray-300'}`}
                  >
                    <span className="truncate text-[10px] flex-1 font-medium">{session.title || 'Mothership Log...'}</span>
                    <button onClick={(e) => onDeleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all text-[10px]">✕</button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Small Footer Dock */}
          <div className="p-2 bg-black/10 border-t border-white/5 space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => setShowSettingsModal(true)} className="flex items-center justify-center gap-1 p-1.5 glass-panel rounded-md text-[9px] font-bold text-gray-500 hover:text-white transition-all"><SettingsIcon /> {t.settings}</button>
              <button onClick={onToggleLanguage} className="flex items-center justify-center gap-1 p-1.5 glass-panel rounded-md text-[9px] font-bold text-gray-500 hover:text-white transition-all uppercase"><GlobeIcon /> {language}</button>
            </div>
            
            <div className="flex items-center justify-between p-1.5 glass-panel rounded-lg hover:bg-white/5 transition-all cursor-pointer group">
               <div className="flex items-center gap-2 min-w-0">
                 <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500/10 to-purple-500/10 flex items-center justify-center border border-white/5 text-[9px] font-black">
                   {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-md" /> : user.name[0].toUpperCase()}
                 </div>
                 <div className="flex flex-col min-w-0">
                   <span className="text-[10px] font-bold text-white truncate">{user.name}</span>
                   <span className="text-[7px] text-gray-600 font-mono truncate">ID_{user.id.slice(0, 5)}</span>
                 </div>
               </div>
               <button onClick={onLogout} className="text-gray-700 hover:text-red-400 p-1"><LogOutIcon /></button>
            </div>
          </div>
        </div>
      </aside>

      {/* iPhone Style Settings Modal - REVISED FOR INTERACTIVITY */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSettingsModal(false)}></div>
           <div className="iphone-modal w-full max-w-[340px] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative z-[101] max-h-[80vh] border border-white/10">
              
              {/* iOS Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/2">
                <button onClick={() => setShowSettingsModal(false)} className="text-cyan-500 text-sm font-medium hover:opacity-70 transition-opacity">Done</button>
                <h2 className="text-sm font-bold text-white uppercase tracking-tighter">Settings</h2>
                <div className="w-10"></div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[#0f1423]">
                 
                 {/* Group: API Nodes - CLICK TO EXPAND EDIT */}
                 <div>
                    <div className="px-3 mb-1.5 text-[9px] text-gray-500 uppercase font-bold tracking-widest">NEURAL CONNECTORS</div>
                    <div className="iphone-group bg-white/[0.03] ring-1 ring-white/5">
                      {[
                        { id: 'google', name: 'Google Gemini', icon: <GoogleIcon />, key: apiKeys.google },
                        { id: 'openai', name: 'OpenAI GPT-4', icon: <OpenAIIcon />, key: apiKeys.openai },
                        { id: 'anthropic', name: 'Claude AI', icon: <AnthropicIcon />, key: apiKeys.anthropic },
                      ].map(p => (
                        <div key={p.id} className="border-b border-white/5 last:border-none">
                          <div 
                            onClick={() => setEditingProvider(editingProvider === p.id ? null : p.id)}
                            className="iphone-row hover:bg-white/[0.03] cursor-pointer"
                          >
                            <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-cyan-400 scale-90">{p.icon}</div>
                            <div className="flex-1 text-[12px] text-gray-200 font-medium">{p.name}</div>
                            <div className={`text-[10px] font-bold flex items-center gap-1 ${p.key ? 'text-emerald-400' : 'text-gray-600'}`}>
                              {p.key ? 'ON' : 'OFF'} <div className={`transition-transform duration-200 ${editingProvider === p.id ? 'rotate-180' : ''}`}><ChevronDownIcon /></div>
                            </div>
                          </div>
                          {editingProvider === p.id && (
                            <div className="px-4 pb-4 pt-1 animate-in slide-in-from-top-2 duration-200">
                              <input 
                                type="password" 
                                value={p.key} 
                                autoFocus
                                onChange={(e) => handleKeyChange(p.id as any, e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white font-mono placeholder-gray-700 focus:border-cyan-500/30 outline-none"
                                placeholder={`Enter ${p.name} Key...`}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* Group: Intelligence Persona */}
                 <div>
                    <div className="px-3 mb-1.5 text-[9px] text-gray-500 uppercase font-bold tracking-widest">AI PERSONALITY</div>
                    <div className="iphone-group bg-white/[0.03] ring-1 ring-white/5">
                      {PERSONAS.map(p => (
                        <div key={p.id} onClick={() => onUpdatePersona(p.id)} className="iphone-row hover:bg-white/[0.03] cursor-pointer">
                          <div className="flex-1">
                            <div className="text-[12px] text-gray-200">{p.name}</div>
                          </div>
                          {currentPersonaId === p.id && <div className="text-cyan-500 scale-75"><CheckIcon /></div>}
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* Group: System */}
                 <div>
                    <div className="iphone-group bg-white/[0.03] ring-1 ring-white/5">
                      <div className="iphone-row text-red-400/80 active:text-red-400 cursor-pointer justify-center" onClick={onLogout}>
                        <div className="text-[12px] font-bold">Wipe Local Core Data</div>
                      </div>
                    </div>
                    <div className="mt-4 text-center text-[8px] text-gray-700 font-mono tracking-widest">OS_BUILD_NEXUS_2.1.0_PRO</div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;