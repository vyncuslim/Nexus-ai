
import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, GlobeIcon, LogOutIcon, TrashIcon, 
  SettingsIcon, BrainIcon, GoogleIcon, 
  OpenAIIcon, AnthropicIcon, SearchIcon, ChevronDownIcon,
  LinkIcon, XIcon, ActivityIcon, HelpIcon, DeepSeekIcon, GrokIcon, CheckIcon, LabIcon, MemoryIcon
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
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
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
      <aside 
        style={{ width: window.innerWidth >= 1024 ? `${width}px` : '280px' }}
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 glass-panel border-r flex flex-col h-screen flex-shrink-0 shadow-2xl bg-nexus-950 transition-transform duration-300 ease-out
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
                <span className="text-[9px] text-nexus-accent font-mono tracking-widest leading-none">MOTHERSHIP</span>
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

          <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
            {/* Memory Archive Section */}
            <div className="px-2 mt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] flex items-center gap-2"><MemoryIcon /> Neural_Archive</span>
              </div>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  value={newMemory}
                  onChange={(e) => setNewMemory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitMemory()}
                  placeholder="Fact to remember..."
                  className="flex-1 bg-white/2 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none focus:border-nexus-accent/30"
                />
                <button 
                  onClick={submitMemory}
                  className="p-2 glass-panel rounded-xl text-nexus-accent border-white/10 hover:bg-white/5"
                >
                  <PlusIcon />
                </button>
              </div>
              <div className="space-y-1">
                {globalMemories.slice(0, 3).map(mem => (
                  <div key={mem.id} className="group flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                    <div className="w-1 h-1 rounded-full bg-nexus-accent/40 group-hover:bg-nexus-accent"></div>
                    <span className="text-[10px] text-gray-500 truncate flex-1 uppercase tracking-tight">{mem.content}</span>
                    <button onClick={() => onDeleteMemory(mem.id)} className="opacity-0 group-hover:opacity-100 text-[10px] text-red-500/50 hover:text-red-500">✕</button>
                  </div>
                ))}
                {globalMemories.length > 3 && (
                  <button onClick={() => setShowSettingsModal(true)} className="text-[9px] text-gray-600 hover:text-white mt-1 px-3 py-1 font-bold uppercase tracking-widest italic">+ {globalMemories.length - 3} More Logs</button>
                )}
              </div>
            </div>

            <div className="px-2 border-t border-white/5 pt-4">
               <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] px-2 mb-2 block">Terminal_History</span>
               <div className="space-y-1">
                {sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(session => (
                  <div 
                    key={session.id} onClick={() => onSelectSession(session.id)}
                    className={`group relative flex items-center px-4 py-3 rounded-2xl cursor-pointer transition-all border ${currentSessionId === session.id ? 'bg-nexus-accent/10 border-nexus-accent/20 text-white shadow-glow' : 'text-gray-500 hover:bg-white/5 border-transparent'}`}
                  >
                    <span className="truncate text-xs flex-1 font-bold uppercase tracking-tight">{session.title || 'NULL_SESSION'}</span>
                    <button onClick={(e) => onDeleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-black/40 border-t border-white/5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowSettingsModal(true)} className="flex items-center justify-center gap-2 p-2.5 glass-panel rounded-xl text-[10px] font-black text-gray-500 hover:text-white transition-all uppercase"><SettingsIcon /> {t.settings}</button>
              <button onClick={onToggleLanguage} className="flex items-center justify-center gap-2 p-2.5 glass-panel rounded-xl text-[10px] font-black text-gray-500 hover:text-white uppercase transition-all tracking-widest"><GlobeIcon /> {language}</button>
            </div>
            <div className="flex items-center justify-between p-3 glass-panel rounded-2xl border-white/10">
               <div className="flex items-center gap-3 min-w-0">
                 <div className="w-8 h-8 rounded-xl bg-nexus-accent/20 flex items-center justify-center border border-white/10 text-[10px] font-black text-nexus-accent uppercase">
                   {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-xl" /> : user.name[0]}
                 </div>
                 <div className="flex flex-col min-w-0 leading-tight">
                    <span className="text-xs font-black text-white truncate uppercase tracking-tighter">{user.name}</span>
                    <span className="text-[8px] text-gray-600 font-mono tracking-widest uppercase">Operator_Active</span>
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
           <div className="glass-panel w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative z-[111] max-h-[90vh] border border-white/10 animate-in zoom-in-95 duration-200">
              <div className="px-8 py-5 flex items-center justify-between border-b border-white/5 bg-white/2">
                <button onClick={() => setShowSettingsModal(false)} className="text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
                <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">Configuration</h2>
                <div className="w-10"></div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-nexus-950/40">
                 {/* Memory Core Management */}
                 <section>
                    <div className="px-2 mb-4 text-[10px] text-gray-600 uppercase font-black tracking-widest flex items-center gap-2">
                       <MemoryIcon /> Neural_Memory_Core
                    </div>
                    <div className="space-y-3 px-2">
                       <div className="flex items-center justify-between p-4 glass-panel rounded-2xl border-white/5 mb-4">
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-300">Active Recall Protocol</div>
                          <button 
                            onClick={() => setTempSettings({...tempSettings, useMemories: !tempSettings.useMemories})}
                            className={`w-12 h-6 rounded-full transition-all relative ${tempSettings.useMemories ? 'bg-nexus-accent shadow-glow' : 'bg-white/10'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${tempSettings.useMemories ? 'left-7' : 'left-1'}`}></div>
                          </button>
                       </div>
                       <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                          {globalMemories.map(mem => (
                            <div key={mem.id} className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center justify-between group">
                               <span className="text-[10px] text-gray-400 uppercase font-mono">{mem.content}</span>
                               <button onClick={() => onDeleteMemory(mem.id)} className="text-red-500/30 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                            </div>
                          ))}
                          {globalMemories.length === 0 && <div className="text-center py-4 text-[10px] text-gray-700 italic">No stored neural patterns</div>}
                       </div>
                    </div>
                 </section>

                 <section>
                    <div className="px-2 mb-4 text-[10px] text-gray-600 uppercase font-black tracking-widest flex items-center gap-2">
                       <ActivityIcon /> Appearance_Protocol
                    </div>
                    <div className="flex gap-4 px-2">
                      {(['cyan', 'purple', 'emerald'] as const).map(color => (
                        <button
                          key={color}
                          onClick={() => setTempSettings({ ...tempSettings, accentColor: color })}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${tempSettings.accentColor === color ? 'border-white scale-110 shadow-glow' : 'border-transparent opacity-40'}`}
                          style={{ backgroundColor: color === 'cyan' ? '#06b6d4' : color === 'purple' ? '#d946ef' : '#10b981' }}
                        />
                      ))}
                    </div>
                 </section>

                 <section>
                    <div className="px-2 mb-4 text-[10px] text-gray-600 uppercase font-black tracking-widest flex items-center gap-2">
                       <SettingsIcon /> Neural_Parameters
                    </div>
                    <div className="space-y-6 px-2">
                       <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-mono uppercase tracking-tighter">
                             <span className="text-gray-400">Temperature</span>
                             <span className="text-nexus-accent">{tempSettings.temperature.toFixed(1)}</span>
                          </div>
                          <input 
                            type="range" min="0" max="1" step="0.1" 
                            value={tempSettings.temperature}
                            onChange={(e) => setTempSettings({...tempSettings, temperature: parseFloat(e.target.value)})}
                            className="w-full accent-nexus-accent opacity-70 hover:opacity-100"
                          />
                       </div>
                       <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-mono uppercase tracking-tighter">
                             <span className="text-gray-400">Max Output Tokens</span>
                             <span className="text-nexus-accent">{tempSettings.maxTokens}</span>
                          </div>
                          <input 
                            type="range" min="256" max="8192" step="256" 
                            value={tempSettings.maxTokens}
                            onChange={(e) => setTempSettings({...tempSettings, maxTokens: parseInt(e.target.value)})}
                            className="w-full accent-nexus-accent opacity-70 hover:opacity-100"
                          />
                       </div>
                       
                       {/* Thinking Budget Config */}
                       <div className="space-y-2 border-t border-white/5 pt-4">
                          <div className="flex justify-between text-[10px] font-mono uppercase tracking-tighter">
                             <span className="text-gray-400">Thinking Budget (Gemini 3)</span>
                             <span className="text-nexus-accent">{tempSettings.thinkingBudget}</span>
                          </div>
                          <input 
                            type="range" min="0" max="16384" step="1024" 
                            value={tempSettings.thinkingBudget}
                            onChange={(e) => setTempSettings({...tempSettings, thinkingBudget: parseInt(e.target.value)})}
                            className="w-full accent-nexus-accent opacity-70 hover:opacity-100"
                          />
                          <p className="text-[8px] text-gray-700 italic px-1 uppercase tracking-tighter leading-none">Allocate tokens for internal reasoning chains. Set to 0 to disable thinking.</p>
                       </div>

                       <div className="flex items-center justify-between p-4 glass-panel rounded-2xl border-white/5">
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-300">Google Search Grounding</div>
                          <button 
                            onClick={() => setTempSettings({...tempSettings, useSearch: !tempSettings.useSearch})}
                            className={`w-12 h-6 rounded-full transition-all relative ${tempSettings.useSearch ? 'bg-nexus-accent shadow-glow' : 'bg-white/10'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${tempSettings.useSearch ? 'left-7' : 'left-1'}`}></div>
                          </button>
                       </div>
                    </div>
                 </section>

                 <section>
                    <div className="px-2 mb-4 text-[10px] text-gray-600 uppercase font-black tracking-widest flex items-center gap-2">
                       <LinkIcon /> Neural_Providers
                    </div>
                    <div className="space-y-3">
                      {[
                        { id: 'deepseek', name: 'DeepSeek AI', icon: <DeepSeekIcon />, key: tempKeys.deepseek, ph: "DeepSeek API Key" },
                        { id: 'grok', name: 'Grok xAI', icon: <GrokIcon />, key: tempKeys.grok, ph: "Grok API Key" },
                        { id: 'openai', name: 'OpenAI', icon: <OpenAIIcon />, key: tempKeys.openai, ph: "OpenAI API Key (sk-...)" },
                        { id: 'anthropic', name: 'Anthropic Claude', icon: <AnthropicIcon />, key: tempKeys.anthropic, ph: "Anthropic API Key" },
                      ].map(provider => (
                        <div key={provider.id} className="glass-panel rounded-2xl overflow-hidden border-white/5 transition-all">
                          <div 
                            onClick={() => setEditingProvider(editingProvider === provider.id ? null : provider.id)}
                            className="flex items-center gap-4 py-4 px-5 cursor-pointer active:bg-white/5"
                          >
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-nexus-accent border border-white/5">{provider.icon}</div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-300 font-black uppercase tracking-tighter">{provider.name}</div>
                              <div className="text-[8px] text-gray-600 font-mono tracking-widest mt-0.5">{provider.key ? 'ACTIVE_LINK' : 'OFFLINE'}</div>
                            </div>
                            <div className={`transition-transform duration-300 text-gray-700 ${editingProvider === provider.id ? 'rotate-180' : ''}`}><ChevronDownIcon /></div>
                          </div>
                          {editingProvider === provider.id && (
                            <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2">
                              <input 
                                type="password" 
                                value={provider.key || ''} 
                                onChange={(e) => setTempKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white font-mono focus:border-nexus-accent/50 outline-none shadow-inner"
                                placeholder={provider.ph}
                                autoFocus
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
                   onClick={handleSave}
                   disabled={isSaving}
                   className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 ${isSaving ? 'bg-emerald-500 text-black' : 'bg-nexus-accent text-black hover:scale-[1.02]'}`}
                 >
                   {isSaving ? <CheckIcon /> : 'Synchronize Core'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
