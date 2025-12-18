
import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, GlobeIcon, LogOutIcon, TrashIcon, 
  SettingsIcon, BrainIcon, GoogleIcon, 
  OpenAIIcon, AnthropicIcon, SearchIcon, ChevronDownIcon,
  LinkIcon, XIcon, ActivityIcon, HelpIcon, DeepSeekIcon, GrokIcon
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
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, currentSessionId, onNewChat, onSelectSession, onDeleteSession,
  user, onLogout, language, onToggleLanguage, apiKeys, onUpdateApiKeys
}) => {
  const t = UI_TEXT[language];
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLegalView, setShowLegalView] = useState<'privacy' | 'terms' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  
  const handleKeyChange = (provider: string, value: string) => {
    onUpdateApiKeys({ [provider]: value });
  };

  return (
    <>
      <aside className="w-64 glass-panel border-r flex flex-col h-screen flex-shrink-0 z-30 shadow-2xl bg-nexus-950/90 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col h-full backdrop-blur-3xl relative z-10">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3 mb-4 group cursor-default">
              <div className="w-8 h-8 glass-panel rounded-xl flex items-center justify-center bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 shadow-lg border-cyan-500/10 transition-transform duration-300">
                <BrainIcon />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black italic tracking-tighter text-white uppercase transition-all">NEXUS_OS</span>
                <span className="text-[10px] text-cyan-500 font-mono tracking-widest leading-none">V2.5 PRO</span>
              </div>
            </div>

            <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 p-2.5 glass-panel rounded-xl hover:bg-white/5 transition-all text-sm font-bold text-white mb-3 border-white/10 group">
              <PlusIcon /> <span className="group-hover:translate-x-0.5 transition-transform">{t.newChat}</span>
            </button>

            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-600"><SearchIcon /></div>
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/30 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(session => (
              <div 
                key={session.id} onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-center px-4 py-2.5 rounded-xl cursor-pointer transition-all border ${currentSessionId === session.id ? 'bg-cyan-500/10 border-cyan-500/20 text-white shadow-glow' : 'text-gray-500 hover:bg-white/5 border-transparent hover:text-gray-300'}`}
              >
                <span className="truncate text-sm flex-1 font-medium">{session.title || 'Signal Trace...'}</span>
                <button onClick={(e) => onDeleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all">✕</button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-black/20 border-t border-white/5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowSettingsModal(true)} className="flex items-center justify-center gap-2 p-2 glass-panel rounded-xl text-xs font-bold text-gray-500 hover:text-white transition-all"><SettingsIcon /> {t.settings}</button>
              <button onClick={onToggleLanguage} className="flex items-center justify-center gap-2 p-2 glass-panel rounded-xl text-xs font-bold text-gray-500 hover:text-white uppercase transition-all"><GlobeIcon /> {language}</button>
            </div>
            <div className="flex items-center justify-between p-2.5 glass-panel rounded-xl hover:bg-white/5 transition-all cursor-pointer group shadow-glow">
               <div className="flex items-center gap-3 min-w-0">
                 <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 text-xs font-black">
                   {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-xl" /> : user.name[0].toUpperCase()}
                 </div>
                 <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{user.name}</span>
                    <span className="text-[10px] text-gray-600 font-mono tracking-tighter uppercase">OPERATOR</span>
                 </div>
               </div>
               <button onClick={onLogout} className="text-gray-700 hover:text-red-400 p-1 transition-colors"><LogOutIcon /></button>
            </div>
          </div>
        </div>
      </aside>

      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowSettingsModal(false)}></div>
           <div className="iphone-modal w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative z-[101] max-h-[85vh] border border-white/10 animate-in zoom-in-95 duration-200">
              <div className="px-8 py-5 flex items-center justify-between border-b border-white/5 bg-white/2">
                <button onClick={() => setShowSettingsModal(false)} className="text-nexus-accent text-sm font-bold hover:opacity-70 transition-opacity">Done</button>
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Neural Configuration</h2>
                <div className="w-10"></div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#050811]">
                 <section>
                    <div className="px-2 mb-2 text-[10px] text-gray-600 uppercase font-black tracking-widest flex items-center gap-2">
                       <LinkIcon /> Neural_Connectors
                    </div>
                    <div className="iphone-group bg-white/[0.03] border border-white/5">
                      {[
                        { id: 'deepseek', name: 'DeepSeek', icon: <DeepSeekIcon />, key: apiKeys.deepseek, ph: t.deepseekKeyPlaceholder },
                        { id: 'grok', name: 'Grok (xAI)', icon: <GrokIcon />, key: apiKeys.grok, ph: t.grokKeyPlaceholder },
                        { id: 'openai', name: 'OpenAI GPT', icon: <OpenAIIcon />, key: apiKeys.openai, ph: t.openaiKeyPlaceholder },
                        { id: 'anthropic', name: 'Claude AI', icon: <AnthropicIcon />, key: apiKeys.anthropic, ph: "Claude API Key" },
                      ].map(p => (
                        <div key={p.id} className="border-b border-white/5 last:border-none">
                          <div 
                            onClick={() => setEditingProvider(editingProvider === p.id ? null : p.id)}
                            className="flex items-center gap-4 py-4 px-5 hover:bg-white/[0.05] cursor-pointer transition-all active:bg-white/10"
                          >
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-cyan-400 shadow-inner">{p.icon}</div>
                            <div className="flex-1 text-xs text-gray-300 font-bold">{p.name}</div>
                            <div className={`text-[9px] font-black px-2 py-1 rounded-lg border ${p.key ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-gray-700 bg-white/5 border-transparent'}`}>
                              {p.key ? 'LINKED' : 'OFFLINE'}
                            </div>
                            <div className={`transition-transform duration-300 text-gray-700 ${editingProvider === p.id ? 'rotate-180' : ''}`}><ChevronDownIcon /></div>
                          </div>
                          {editingProvider === p.id && (
                            <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-1">
                              <input 
                                type="password" 
                                value={p.key} 
                                onChange={(e) => handleKeyChange(p.id, e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-cyan-500/50 outline-none shadow-inner"
                                placeholder={p.ph}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                 </section>

                 <section>
                    <div className="px-2 mb-2 text-[10px] text-gray-600 uppercase font-black tracking-widest flex items-center gap-2">
                       <HelpIcon /> Protocol_Compliance
                    </div>
                    <div className="iphone-group bg-white/[0.03] border border-white/5 px-5 py-2">
                       <button onClick={() => setShowLegalView('privacy')} className="w-full text-left py-3 text-xs text-gray-400 hover:text-white border-b border-white/5 transition-colors">Privacy Policy</button>
                       <button onClick={() => setShowLegalView('terms')} className="w-full text-left py-3 text-xs text-gray-400 hover:text-white transition-colors">Terms of Service</button>
                    </div>
                 </section>

                 <div className="pt-4 pb-8">
                    <button className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-red-500/20 transition-all active:scale-95" onClick={onLogout}>
                      {t.wipeData}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showLegalView && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-nexus-950/95 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200">
           <div className="max-w-2xl w-full h-[80vh] flex flex-col bg-nexus-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-white/2">
                 <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">
                   {showLegalView === 'privacy' ? 'Privacy Protocol' : 'Operational Terms'}
                 </h3>
                 <button onClick={() => setShowLegalView(null)} className="p-2 text-gray-500 hover:text-white transition-colors"><XIcon /></button>
              </div>
              <div className="flex-1 p-8 overflow-y-auto text-sm text-gray-400 leading-relaxed custom-scrollbar prose prose-invert">
                 {showLegalView === 'privacy' ? (
                   <div className="space-y-6">
                     <p>NEXUS-AI uses local storage and optional Google Sign-In to manage your session. We do not sell or share user data with third parties.</p>
                     <p className="pt-6 border-t border-white/5 text-[10px] font-mono tracking-widest">ENCRYPTED_CONTACT: vyncuslim121@gmail.com</p>
                   </div>
                 ) : (
                   <div className="space-y-6">
                     <p className="font-bold text-cyan-400">By using NEXUS-AI, you agree to use the service responsibly.</p>
                     <p>The service is provided on an "as is" basis without warranties of any kind.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
