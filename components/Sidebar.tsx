import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, GlobeIcon, LogOutIcon, TrashIcon, 
  SettingsIcon, BrainIcon, GoogleIcon, 
  OpenAIIcon, AnthropicIcon, SearchIcon, ChevronDownIcon,
  LinkIcon, XIcon, ActivityIcon, DeepSeekIcon, GrokIcon, CheckIcon, AgentIcon, MemoryIcon, CommandIcon
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

  const KeyInput = ({ icon, label, value, onChange, placeholder }: any) => (
    <div className="space-y-1.5 group">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</span>
      </div>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-nexus-accent transition-colors">{icon}</div>
        <input 
          type="password" 
          value={value || ''} 
          onChange={onChange}
          className="w-full bg-black/40 border border-white/5 text-white rounded-2xl pl-12 pr-4 py-3.5 focus:border-nexus-accent/40 outline-none font-mono text-[11px] placeholder-gray-800 transition-all" 
          placeholder={placeholder} 
        />
      </div>
    </div>
  );

  return (
    <>
      <aside style={{ width: window.innerWidth >= 1024 ? `${width}px` : '280px' }} className={`fixed lg:relative inset-y-0 left-0 z-50 glass-panel border-r flex flex-col h-screen flex-shrink-0 shadow-2xl bg-nexus-950 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full relative z-10">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3 mb-6 group cursor-default">
              <div className="w-9 h-9 glass-panel rounded-xl flex items-center justify-center bg-gradient-to-tr from-nexus-accent/20 to-purple-500/20 border-white/10 shadow-lg"><BrainIcon /></div>
              <div className