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
      {/* 永久固定的窄版侧边栏 */}
      <aside className="w-48 glass-panel border-r flex flex-col h-screen flex-shrink-0 z-30 shadow-xl bg-nexus-950/80 transition-all duration-300">
        <div className="flex flex-col h-full backdrop-blur-3xl">
          {/* Logo 区 */}
          <div className="p-3 border-b border-white/5">
            <div className="flex items-center gap-2 mb-3 group cursor-default">
              <div className="w-5 h-5 glass-panel rounded-md flex items-center justify-center bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 shadow-lg border-cyan-500/10">
                <BrainIcon />
              </div>
              <span className="text-[12px] font-black italic tracking-tighter text-white">NEXUS<span className="text-cyan-400 font-mono">_V2</span></span>
            </div>

            <button onClick={onNewChat} className="w-full flex items-center justify-center gap-1.5 p-1.5 glass-panel rounded-lg hover:bg-white/5 transition-all text-[9px] font-bold text-white mb-2 group border-white/10">
              <PlusIcon /> {t.newChat}
            </button>

            <div className="relative">
              <div className="absolute left-2.5 top-2 text-gray-600 scale-75"><SearchIcon /></div>
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full bg-white/5 border border-white/5 rounded-md pl-6 pr-2 py-1 text-[9px] text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/20"
              />
            </div>
          </div>

          {/* 历史记录列表 */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            <div className="px-2 py-1 text-[7px] font-black text-gray-600 uppercase tracking-widest opacity-50">HISTORY</div>
            {sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(session => (
              <div 
                key={session.id} onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-center px-2 py-1 rounded-md cursor-pointer transition-all border ${currentSessionId === session.id ? 'bg-cyan-500/10 border-cyan-500/20 text-white' : 'text-gray-500 hover:bg-white/5 border-transparent hover:text-gray-300'}`}
              >
                <span className="truncate text-[10px] flex-1 font-medium">{session.title || 'Log...'}</span>
                <button onClick={(e) => onDeleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 text-[9px]">✕</button>
              </div>
            ))}
          </div>

          {/* 底部功能栏 */}
          <div className="p-2 bg-black/10 border-t border-white/5 space-y-1.5">
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => setShowSettingsModal(true)} className="flex items-center justify-center gap-1 p-1.5 glass-panel rounded-md text-[8px] font-bold text-gray-500 hover:text-white"><SettingsIcon /> {t.settings}</button>
              <button onClick={onToggleLanguage} className="flex items-center justify-center gap-1 p-1.5 glass-panel rounded-md text-[8px] font-bold text-gray-500 hover:text-white uppercase"><GlobeIcon /> {language}</button>
            </div>
            
            <div className="flex items-center justify-between p-1.5 glass-panel rounded-lg hover:bg-white/5 transition-all cursor-pointer group">
               <div className="flex items-center gap-1.5 min-w-0">
                 <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-500/10 to-purple-500/10 flex items-center justify-center border border-white/5 text-[8px] font-black">
                   {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-md" /> : user.name[0].toUpperCase()}
                 </div>
                 <span className="text-[10px] font-bold text-white truncate">{user.name}</span>
               </div>
               <button onClick={onLogout} className="text-gray-700 hover:text-red-400"><LogOutIcon /></button>
            </div>
          </div>
        </div>
      </aside>

      {/* iPhone 风格设置弹窗 */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowSettingsModal(false)}></div>
           <div className="iphone-modal w-full max-w-[320px] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col relative z-[101] max-h-[75vh] border border-white/10">
              
              {/* iOS 顶部标题栏 */}
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/5 bg-white/2">
                <button onClick={() => setShowSettingsModal(false)} className="text-cyan-500 text-xs font-semibold hover:opacity-70 transition-opacity">Done</button>
                <h2 className="text-[11px] font-black text-white uppercase tracking-tight">Bridge Config</h2>
                <div className="w-10"></div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-[#0a0f1e]">
                 
                 {/* API 连接器 - 修复点击问题 */}
                 <div>
                    <div className="px-2 mb-1.5 text-[8px] text-gray-500 uppercase font-black tracking-widest">Neural Connectors</div>
                    <div className="iphone-group bg-white/[0.02] border border-white/5">
                      {[
                        { id: 'google', name: 'Google Gemini', icon: <GoogleIcon />, key: apiKeys.google },
                        { id: 'openai', name: 'OpenAI GPT-4', icon: <OpenAIIcon />, key: apiKeys.openai },
                        { id: 'anthropic', name: 'Claude AI', icon: <AnthropicIcon />, key: apiKeys.anthropic },
                      ].map(p => (
                        <div key={p.id} className="border-b border-white/5 last:border-none">
                          <div 
                            onClick={() => setEditingProvider(editingProvider === p.id ? null : p.id)}
                            className="iphone-row flex items-center gap-3 py-3 px-4 hover:bg-white/[0.04] cursor-pointer active:bg-white/[0.06] transition-all"
                          >
                            <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-cyan-400 scale-75">{p.icon}</div>
                            <div className="flex-1 text-[11px] text-gray-200 font-bold">{p.name}</div>
                            <div className={`text-[9px] font-black px-1.5 py-0.5 rounded transition-colors ${p.key ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500 bg-white/5'}`}>
                              {p.key ? 'ON' : 'OFF'}
                            </div>
                          </div>
                          {editingProvider === p.id && (
                            <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-1">
                              <input 
                                type="password" 
                                value={p.key} 
                                autoFocus
                                autoComplete="off"
                                onChange={(e) => handleKeyChange(p.id as any, e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white font-mono focus:border-cyan-500/30 outline-none placeholder-gray-800"
                                placeholder={`Paste ${p.name} Key...`}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* 智能人格选择 */}
                 <div>
                    <div className="px-2 mb-1.5 text-[8px] text-gray-500 uppercase font-black tracking-widest">Personality</div>
                    <div className="iphone-group bg-white/[0.02] border border-white/5">
                      {PERSONAS.map(p => (
                        <div key={p.id} onClick={() => onUpdatePersona(p.id)} className="iphone-row flex items-center gap-3 py-2.5 px-4 hover:bg-white/[0.04] cursor-pointer">
                          <div className="flex-1 text-[11px] text-gray-300 font-medium">{p.name}</div>
                          {currentPersonaId === p.id && <div className="text-cyan-500 scale-75"><CheckIcon /></div>}
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* 系统操作 */}
                 <div>
                    <div className="iphone-group bg-white/[0.02] border border-white/5">
                      <div className="iphone-row text-red-400/80 active:text-red-400 cursor-pointer justify-center py-3" onClick={onLogout}>
                        <div className="text-[11px] font-black uppercase">Wipe Local Core</div>
                      </div>
                    </div>
                    <div className="mt-4 text-center text-[7px] text-gray-700 font-mono tracking-widest">NEXUS_OS_BUILD_v2.1.0</div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;