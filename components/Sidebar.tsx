import React from 'react';
import { PlusIcon, GlobeIcon, LogOutIcon, TrashIcon } from './Icon';
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
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  sessions, 
  currentSessionId, 
  onNewChat, 
  onSelectSession, 
  onDeleteSession,
  user,
  onLogout,
  language,
  onToggleLanguage
}) => {
  const t = UI_TEXT[language];

  // Group sessions by date
  const groupedSessions = React.useMemo(() => {
    const groups: { [key: string]: ChatSession[] } = {
      today: [],
      yesterday: [],
      previous7Days: [],
      older: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    sessions.forEach(session => {
      const date = new Date(session.updatedAt);
      if (date >= today) {
        groups.today.push(session);
      } else if (date >= yesterday) {
        groups.yesterday.push(session);
      } else if (date >= lastWeek) {
        groups.previous7Days.push(session);
      } else {
        groups.older.push(session);
      }
    });

    return groups;
  }, [sessions]);

  const renderSessionGroup = (groupTitle: string, groupSessions: ChatSession[]) => {
    if (groupSessions.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="px-3 pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">
          {groupTitle}
        </div>
        <div className="space-y-1">
          {groupSessions.map(session => (
            <div 
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`
                group relative flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 border border-transparent
                ${currentSessionId === session.id 
                  ? 'bg-nexus-800 border-nexus-700 text-white shadow-md' 
                  : 'text-gray-400 hover:bg-nexus-800/50 hover:text-gray-200'}
              `}
            >
              <span className="truncate text-sm flex-1 pr-6 font-medium">
                {session.title || (language === 'zh' ? '新对话' : 'New Chat')}
              </span>
              
              <button
                onClick={(e) => onDeleteSession(session.id, e)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all"
                title="Delete"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-nexus-900 border-r border-nexus-700 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
        flex flex-col shadow-2xl
      `}
    >
      <div className="flex flex-col h-full">
        
        {/* Brand Area */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-tr from-nexus-accent to-purple-600 rounded-lg shadow-lg shadow-blue-500/20 animate-pulse-slow"></div>
            <span className="text-xl font-bold tracking-tight text-white font-mono">NEXUS<span className="text-nexus-accent">_CORE</span></span>
          </div>

          <button 
            onClick={onNewChat}
            className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-nexus-800 hover:bg-nexus-700 hover:shadow-lg border border-nexus-700 hover:border-nexus-accent/50 rounded-xl transition-all text-sm font-semibold text-white group"
          >
            <PlusIcon />
            {t.newChat}
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
          {sessions.length === 0 && (
             <div className="text-xs text-gray-600 px-2 italic mt-4 text-center">
               No memory logs found.
             </div>
          )}

          {renderSessionGroup(t.today, groupedSessions.today)}
          {renderSessionGroup(t.yesterday, groupedSessions.yesterday)}
          {renderSessionGroup(t.previous7Days, groupedSessions.previous7Days)}
          {renderSessionGroup(t.older, groupedSessions.older)}
        </div>

        {/* Bottom Controls */}
        <div className="p-4 bg-nexus-900 border-t border-nexus-700 space-y-3">
          
          {/* Language Toggle */}
          <button 
            onClick={onToggleLanguage}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-nexus-800 text-gray-400 hover:text-white transition-colors text-xs font-medium border border-transparent hover:border-nexus-700"
          >
            <div className="flex items-center gap-2">
              <GlobeIcon />
              {t.language}
            </div>
            <span className="bg-nexus-800 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono border border-nexus-700">
              {language}
            </span>
          </button>

          {/* User Profile */}
          <div className="flex items-center justify-between pt-2 border-t border-nexus-700/50">
             <div className="flex items-center gap-3 overflow-hidden">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                 {user.name[0].toUpperCase()}
               </div>
               <div className="flex flex-col min-w-0">
                 <span className="text-sm font-medium text-white truncate">{user.name}</span>
                 <span className="text-[10px] text-gray-500 truncate font-mono">{user.email}</span>
               </div>
             </div>
             <button 
               onClick={onLogout}
               className="p-2 text-gray-500 hover:text-white hover:bg-nexus-800 rounded-lg transition-colors"
               title={t.logout}
             >
               <LogOutIcon />
             </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;