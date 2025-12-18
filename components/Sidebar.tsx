
import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, GlobeIcon, LogOutIcon, TrashIcon, 
  SettingsIcon, BrainIcon, GoogleIcon, 
  OpenAIIcon, AnthropicIcon, SearchIcon, CheckIcon, ChevronDownIcon,
  LinkIcon, XIcon, ActivityIcon
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
  
  // 模拟授权码列表
  const [managedCodes, setManagedCodes] = useState<{code: string, status: 'active' | 'revoked'}[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('nexus_auth_registry');
    if (stored) {
      setManagedCodes(JSON.parse(stored));
    } else {
      // 初始默认数据
      const initial = [
        { code: 'NEXUS-0001', status: 'active' as const },
        { code: 'NEXUS-0002', status: 'active' as const },
      ];
      setManagedCodes(initial);
      localStorage.setItem('nexus_auth_registry', JSON.stringify(initial));
    }
  }, []);

  const handleKeyChange = (provider: 'google' | 'openai' | 'anthropic', value: string) => {
    onUpdateApiKeys({ [provider]: value });
  };

  const generateNewCode = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newCode = { code: `NEXUS-${rand}`, status: 'active' as const };
    const updated = [...managedCodes, newCode];
    setManagedCodes(updated);
    localStorage.setItem('nexus_auth_registry', JSON.stringify(updated));
  };

  const revokeCode = (codeToRevoke: string) => {
    const updated = managedCodes.map(c => c.code === codeToRevoke ? { ...c, status: 'revoked' as const } : c);
    setManagedCodes(updated);
    localStorage.setItem('nexus_auth_registry', JSON.stringify(updated));
  };

  return (
    <>
      {/* 恢复标准宽度的侧边栏 (w-64) */}
      <aside className="w-64 glass-panel border-r flex flex-col h-screen flex-shrink-0 z-30 shadow-2xl bg-nexus-950/90 transition-all duration-300">
        <div className="flex flex-col h-full backdrop-blur-3xl">
          {/* Logo 区 */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3 mb-4 group cursor-default">
              <div className="w-8 h-8 glass-panel rounded-xl flex items-center justify-center bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 shadow-lg border-cyan-500/10 group-hover:scale-105 transition-transform">
                <BrainIcon />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black italic tracking-tighter text-white uppercase">NEXUS_OS</span>
                <span className="text-[10px] text-cyan-500 font-mono tracking-widest leading-none">V2.1 PRO</span>
              </div>
            </div>

            <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 p-2.5 glass-panel rounded-xl hover:bg-white/5 transition-all text-sm font-bold text-white mb-3 border-white/10 group">
              <PlusIcon /> {t.newChat}
            </button>

            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-500"><SearchIcon /></div>
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/30 transition-all"
              />
            </div>
          </div>

          {/* 会话流 */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <div className="px-3 py-1 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] opacity-50">Memory Logs</div>
            {sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(session => (
              <div 
                key={session.id} onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-center px-4 py-2.5 rounded-xl cursor-pointer transition-all border ${currentSessionId === session.id ? 'bg-cyan-500/10 border-cyan-500/20 text-white shadow-sm ring-1 ring-cyan-500/10' : 'text-gray-400 hover:bg-white/5 border-transparent hover:text-gray-200'}`}
              >
                <span className="truncate text-sm flex-1 font-medium">{session.title || 'Mothership Log...'}</span>
                <button onClick={(e) => onDeleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity">✕</button>
              </div>
            ))}
          </div>

          {/* 底部 Dock */}
          <div className="p-4 bg-black/20 border-t border-white/5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowSettingsModal(true)} className="flex items-center justify-center gap-2 p-2 glass-panel rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"><SettingsIcon /> {t.settings}</button>
              <button onClick={onToggleLanguage} className="flex items-center justify-center gap-2 p-2 glass-panel rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all uppercase"><GlobeIcon /> {language}</button>
            </div>
            
            <div className="flex items-center justify-between p-2.5 glass-panel rounded-xl hover:bg-white/5 transition-all cursor-pointer group">
               <div className="flex items-center gap-3 min-w-0">
                 <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 text-xs font-black shadow-inner">
                   {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-xl" /> : user.name[0].toUpperCase()}
                 </div>
                 <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-white truncate">{user.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{user.isAdmin ? 'OWNER_ACCESS' : 'USER_ACCESS'}</span>
                 </div>
               </div>
               <button onClick={onLogout} className="text-gray-600 hover:text-red-400 p-1 transition-colors"><LogOutIcon /></button>
            </div>
          </div>
        </div>
      </aside>

      {/* 标准尺寸的设置弹窗 */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowSettingsModal(false)}></div>
           <div className="iphone-modal w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative z-[101] max-h-[85vh] border border-white/10 animate-in zoom-in-95 duration-200">
              
              <div className="px-8 py-5 flex items-center justify-between border-b border-white/5 bg-white/2">
                <button onClick={() => setShowSettingsModal(false)} className="text-cyan-500 text-sm font-bold hover:opacity-70 transition-opacity">Done</button>
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Core Configuration</h2>
                <div className="w-10"></div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#050811]">
                 
                 {/* 访问授权管理 (新功能) */}
                 <section>
                    <div className="px-2 mb-2 text-[10px] text-gray-500 uppercase font-black tracking-widest flex items-center gap-2">
                       <ActivityIcon /> {t.accessManagement}
                    </div>
                    <div className="iphone-group bg-white/[0.03] border border-white/5 p-4 space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300 font-medium">{t.currentCode}</span>
                          <span className="text-sm font-mono text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-lg border border-cyan-400/20">
                            {user.inviteCode || 'N/A'}
                          </span>
                       </div>

                       {user.isAdmin && (
                         <div className="pt-4 border-t border-white/5 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                               <span className="text-xs font-black text-gray-500 uppercase tracking-tighter">{t.manageCodes}</span>
                               <button 
                                 onClick={generateNewCode}
                                 className="text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white px-3 py-1 rounded-full font-bold transition-all border border-emerald-500/30"
                               >
                                 + {t.generateNew}
                               </button>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                               {managedCodes.map((item, idx) => (
                                 <div key={idx} className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5 group">
                                    <div className="flex flex-col">
                                       <span className={`text-sm font-mono font-bold ${item.status === 'revoked' ? 'text-gray-600 line-through' : 'text-white'}`}>{item.code}</span>
                                       <span className={`text-[9px] uppercase font-black ${item.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>
                                         {item.status === 'active' ? t.active : t.revoked}
                                       </span>
                                    </div>
                                    {item.status === 'active' && item.code !== 'NEXUS-0001' && (
                                       <button 
                                         onClick={() => revokeCode(item.code)}
                                         className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                         title={t.revoke}
                                       >
                                         <TrashIcon />
                                       </button>
                                    )}
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}
                    </div>
                 </section>

                 {/* 神经连接器 */}
                 <section>
                    <div className="px-2 mb-2 text-[10px] text-gray-500 uppercase font-black tracking-widest flex items-center gap-2">
                       <LinkIcon /> {t.apiKeys}
                    </div>
                    <div className="iphone-group bg-white/[0.03] border border-white/5">
                      {[
                        { id: 'google', name: 'Google Gemini', icon: <GoogleIcon />, key: apiKeys.google },
                        { id: 'openai', name: 'OpenAI GPT-4', icon: <OpenAIIcon />, key: apiKeys.openai },
                        { id: 'anthropic', name: 'Claude AI', icon: <AnthropicIcon />, key: apiKeys.anthropic },
                      ].map(p => (
                        <div key={p.id} className="border-b border-white/5 last:border-none">
                          <div 
                            onClick={() => setEditingProvider(editingProvider === p.id ? null : p.id)}
                            className="flex items-center gap-4 py-4 px-5 hover:bg-white/[0.05] cursor-pointer active:bg-white/[0.1] transition-all"
                          >
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-cyan-400 shadow-inner">{p.icon}</div>
                            <div className="flex-1 text-sm text-gray-200 font-bold">{p.name}</div>
                            <div className={`text-[10px] font-black px-2 py-1 rounded-lg transition-colors border ${p.key ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-gray-500 bg-white/5 border-white/5'}`}>
                              {p.key ? 'ON' : 'OFF'}
                            </div>
                            <div className={`transition-transform duration-300 text-gray-600 ${editingProvider === p.id ? 'rotate-180' : ''}`}><ChevronDownIcon /></div>
                          </div>
                          {editingProvider === p.id && (
                            <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-1">
                              <input 
                                type="password" 
                                value={p.key} 
                                autoFocus
                                autoComplete="off"
                                onChange={(e) => handleKeyChange(p.id as any, e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-cyan-500/50 outline-none placeholder-gray-800 shadow-inner"
                                placeholder={`Enter ${p.name} Key...`}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                 </section>

                 {/* 智能人格 */}
                 <section>
                    <div className="px-2 mb-2 text-[10px] text-gray-500 uppercase font-black tracking-widest flex items-center gap-2">
                       <BrainIcon /> {t.persona}
                    </div>
                    <div className="iphone-group bg-white/[0.03] border border-white/5">
                      {PERSONAS.map(p => (
                        <div key={p.id} onClick={() => onUpdatePersona(p.id)} className="flex items-center gap-4 py-3.5 px-5 hover:bg-white/[0.05] cursor-pointer active:bg-white/[0.1] transition-all">
                          <div className="flex-1 text-sm text-gray-300 font-medium">{p.name}</div>
                          {currentPersonaId === p.id && <div className="text-cyan-500"><CheckIcon /></div>}
                        </div>
                      ))}
                    </div>
                 </section>

                 {/* 操作 */}
                 <div className="pt-4 pb-8 space-y-4">
                    <button 
                      className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-red-500/20 transition-all active:scale-95"
                      onClick={onLogout}
                    >
                      {t.wipeData}
                    </button>
                    <div className="text-center text-[10px] text-gray-700 font-mono tracking-widest">BUILD_v2.1.0_ENTERPRISE_CORE</div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
