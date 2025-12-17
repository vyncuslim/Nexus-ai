import React, { useState, useRef } from 'react';
import { PlusIcon, GlobeIcon, LogOutIcon, TrashIcon, CameraIcon, UploadIcon, UserIcon, HelpIcon, UndoIcon, RedoIcon, SearchIcon, SettingsIcon, CheckCircleIcon, GoogleIcon, OpenAIIcon, BrainIcon } from './Icon';
import { ChatSession, User, Language, Persona } from '../types';
import { UI_TEXT, CONTACT_EMAIL, USER_GUIDE, PERSONAS } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  user: User;
  onUpdateUserAvatar: (base64: string) => void;
  onLinkGoogle: () => void;
  onLogout: () => void;
  language: Language;
  onToggleLanguage: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  currentPersonaId: string;
  onUpdatePersona: (personaId: string) => void;
  apiKeys: { google: string, openai: string, anthropic: string };
  onUpdateApiKeys: (keys: { google?: string, openai?: string, anthropic?: string }) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  sessions, 
  currentSessionId, 
  onNewChat, 
  onSelectSession, 
  onDeleteSession,
  user,
  onUpdateUserAvatar,
  onLinkGoogle,
  onLogout,
  language,
  onToggleLanguage,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  currentPersonaId,
  onUpdatePersona,
  apiKeys,
  onUpdateApiKeys
}) => {
  const t = UI_TEXT[language];
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Settings State
  const [tempKeys, setTempKeys] = useState(apiKeys);

  // Profile Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Resize image to safe storage limits (100x100 thumbnail)
        resizeImage(reader.result as string, (resized) => {
          onUpdateUserAvatar(resized);
          setShowProfileModal(false);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      resizeImage(dataUrl, (resized) => {
        onUpdateUserAvatar(resized);
        stopCamera();
        setShowProfileModal(false);
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const resizeImage = (base64Str: string, callback: (resized: string) => void) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 100;
      const MAX_HEIGHT = 100;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.8));
    };
  };

  const handleSaveSettings = () => {
    onUpdateApiKeys(tempKeys);
    setShowSettingsModal(false);
  }

  // Filter sessions based on Search Query
  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (session.title && session.title.toLowerCase().includes(q)) ||
      session.messages.some(m => m.text.toLowerCase().includes(q))
    );
  });

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

    filteredSessions.forEach(session => {
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
  }, [filteredSessions]);

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
    <>
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-nexus-900 border-r border-nexus-700 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0
          flex flex-col shadow-2xl
        `}
      >
        <div className="flex flex-col h-full">
          
          {/* Brand */}
          <div className="p-4 pb-0">
             <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-6 h-6 bg-gradient-to-tr from-nexus-accent to-purple-600 rounded-md shadow-lg shadow-blue-500/20"></div>
              <span className="text-lg font-bold tracking-tight text-white font-mono">NEXUS<span className="text-nexus-accent">_CORE</span></span>
            </div>

            <button 
              onClick={onNewChat}
              className="flex items-center justify-center gap-3 w-full px-4 py-2.5 bg-nexus-800 hover:bg-nexus-700 hover:shadow-lg border border-nexus-700 hover:border-nexus-accent/50 rounded-xl transition-all text-sm font-semibold text-white group mb-3"
            >
              <PlusIcon />
              {t.newChat}
              <span className="ml-auto text-[10px] text-gray-500 font-mono bg-nexus-900 px-1.5 rounded border border-nexus-700/50">Alt+N</span>
            </button>

            {/* Search Bar */}
            <div className="relative mb-2">
              <div className="absolute left-3 top-2.5 text-gray-500">
                <SearchIcon />
              </div>
              <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-nexus-900 border border-nexus-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-nexus-accent/50 transition-colors placeholder-gray-600"
              />
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
            {filteredSessions.length === 0 && (
               <div className="text-xs text-gray-600 px-2 italic mt-4 text-center">
                 {searchQuery ? 'No results found.' : 'No memory logs found.'}
               </div>
            )}

            {renderSessionGroup(t.today, groupedSessions.today)}
            {renderSessionGroup(t.yesterday, groupedSessions.yesterday)}
            {renderSessionGroup(t.previous7Days, groupedSessions.previous7Days)}
            {renderSessionGroup(t.older, groupedSessions.older)}
          </div>

          {/* Bottom Controls */}
          <div className="p-4 bg-nexus-900 border-t border-nexus-700 space-y-2">
            
            {/* History Controls */}
            <div className="flex gap-2 mb-2">
              <button 
                onClick={onUndo}
                disabled={!canUndo}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-nexus-800 rounded-lg transition-colors text-xs font-medium border border-transparent ${canUndo ? 'hover:bg-nexus-700 text-gray-400 hover:text-white hover:border-nexus-600' : 'opacity-50 cursor-not-allowed text-gray-600'}`}
                title={t.undo}
              >
                <UndoIcon />
                {t.undo}
              </button>
              <button 
                onClick={onRedo}
                disabled={!canRedo}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-nexus-800 rounded-lg transition-colors text-xs font-medium border border-transparent ${canRedo ? 'hover:bg-nexus-700 text-gray-400 hover:text-white hover:border-nexus-600' : 'opacity-50 cursor-not-allowed text-gray-600'}`}
                title={t.redo}
              >
                <RedoIcon />
                {t.redo}
              </button>
            </div>

            {/* Settings & Help */}
            <div className="flex gap-2 mb-2">
              <button 
                onClick={() => { setTempKeys(apiKeys); setShowSettingsModal(true); }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-nexus-800 hover:bg-nexus-700 text-gray-400 hover:text-white rounded-lg transition-colors text-xs font-medium border border-transparent hover:border-nexus-600"
                title={t.settings}
              >
                <SettingsIcon />
                {t.settings}
              </button>
              <button 
                onClick={() => setShowHelpModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-nexus-800 hover:bg-nexus-700 text-gray-400 hover:text-white rounded-lg transition-colors text-xs font-medium border border-transparent hover:border-nexus-600"
              >
                <HelpIcon />
                {t.userGuide}
              </button>
            </div>

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
            <div 
              className="flex items-center justify-between pt-2 border-t border-nexus-700/50 cursor-pointer hover:bg-nexus-800 rounded-lg p-2 transition-colors"
              onClick={() => setShowProfileModal(true)}
            >
               <div className="flex items-center gap-3 overflow-hidden">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-xs font-bold text-white shadow-inner overflow-hidden border border-nexus-600">
                   {user.avatar ? (
                     <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     user.name[0].toUpperCase()
                   )}
                 </div>
                 <div className="flex flex-col min-w-0">
                   <span className="text-sm font-medium text-white truncate">{user.name}</span>
                   <span className="text-[10px] text-gray-500 truncate font-mono">{user.email}</span>
                 </div>
               </div>
               <button 
                 onClick={(e) => { e.stopPropagation(); onLogout(); }}
                 className="p-2 text-gray-500 hover:text-white hover:bg-nexus-700 rounded-lg transition-colors"
                 title={t.logout}
               >
                 <LogOutIcon />
               </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-nexus-900 border border-nexus-700 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-nexus-700 flex justify-between items-center">
               <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 <SettingsIcon /> {t.settings}
               </h2>
               <button onClick={() => setShowSettingsModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
               {/* Account Integration */}
               <div>
                  <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider text-xs">Account Integrations</label>
                  <div className="space-y-2">
                    {/* Google */}
                    <div className="bg-nexus-800 rounded-xl p-4 border border-nexus-700 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-white/10 rounded-lg"><GoogleIcon /></div>
                         <div>
                           <div className="text-sm font-medium text-white">{t.googleLinked}</div>
                           <div className="text-xs text-gray-500">{user.email}</div>
                         </div>
                       </div>
                       {user.isGoogleLinked ? (
                         <span className="text-emerald-500 text-xs font-bold px-2 py-1 bg-emerald-900/20 rounded border border-emerald-500/30">CONNECTED</span>
                       ) : (
                         <button onClick={onLinkGoogle} className="text-xs bg-nexus-700 hover:bg-nexus-600 text-white px-3 py-1.5 rounded-lg border border-nexus-600 transition-colors">
                           {t.linkGoogle}
                         </button>
                       )}
                    </div>

                    {/* GitHub (Example) */}
                    <div className="bg-nexus-800 rounded-xl p-4 border border-nexus-700 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-white/10 rounded-lg">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                         </div>
                         <div>
                           <div className="text-sm font-medium text-white">GitHub Account</div>
                           <div className="text-xs text-gray-500">Not Connected</div>
                         </div>
                       </div>
                       <button onClick={() => alert('GitHub integration coming soon!')} className="text-xs bg-nexus-700 hover:bg-nexus-600 text-white px-3 py-1.5 rounded-lg border border-nexus-600 transition-colors">
                         Connect
                       </button>
                    </div>
                  </div>
               </div>

               {/* Persona Selection */}
               <div>
                  <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider text-xs">{t.persona}</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {PERSONAS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => onUpdatePersona(p.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${currentPersonaId === p.id ? 'bg-nexus-800 border-emerald-500 shadow-md' : 'bg-nexus-900 border-nexus-700 hover:bg-nexus-800'}`}
                      >
                        <div className={`mt-1 ${currentPersonaId === p.id ? 'text-emerald-500' : 'text-gray-600'}`}>
                          <CheckCircleIcon />
                        </div>
                        <div>
                          <div className={`font-bold text-sm ${currentPersonaId === p.id ? 'text-white' : 'text-gray-300'}`}>{p.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{p.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
               </div>

               {/* API Keys */}
               <div>
                  <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider text-xs">{t.apiKeys}</label>
                  <div className="space-y-3">
                     <div className="relative">
                       <div className="absolute left-3 top-3 text-gray-500"><GoogleIcon /></div>
                       <input 
                         type="password"
                         value={tempKeys.google}
                         onChange={(e) => setTempKeys({...tempKeys, google: e.target.value})}
                         className="w-full bg-nexus-950 border border-nexus-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono placeholder-gray-600 focus:border-emerald-500 focus:outline-none transition-colors"
                         placeholder="Google Gemini API Key"
                       />
                     </div>
                     <div className="relative">
                       <div className="absolute left-3 top-3 text-gray-500"><OpenAIIcon /></div>
                       <input 
                         type="password"
                         value={tempKeys.openai}
                         onChange={(e) => setTempKeys({...tempKeys, openai: e.target.value})}
                         className="w-full bg-nexus-950 border border-nexus-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono placeholder-gray-600 focus:border-emerald-500 focus:outline-none transition-colors"
                         placeholder="OpenAI API Key (sk-...)"
                       />
                     </div>
                     <div className="relative">
                       <div className="absolute left-3 top-3 text-gray-500">
                         <BrainIcon />
                       </div>
                       <input 
                         type="password"
                         value={tempKeys.anthropic}
                         onChange={(e) => setTempKeys({...tempKeys, anthropic: e.target.value})}
                         className="w-full bg-nexus-950 border border-nexus-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono placeholder-gray-600 focus:border-emerald-500 focus:outline-none transition-colors"
                         placeholder="Anthropic API Key (sk-ant-...)"
                       />
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-6 border-t border-nexus-700 flex justify-end gap-3">
               <button 
                 onClick={() => setShowSettingsModal(false)}
                 className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-nexus-800 transition-colors"
               >
                 {t.cancel}
               </button>
               <button 
                 onClick={handleSaveSettings}
                 className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg"
               >
                 {t.save}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-nexus-900 border border-nexus-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => { stopCamera(); setShowProfileModal(false); }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              ✕
            </button>
            
            <h2 className="text-xl font-bold text-white mb-6 text-center">{t.profile}</h2>
            
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-nexus-800 border-2 border-nexus-700 flex items-center justify-center overflow-hidden">
                 {isCameraActive ? (
                   <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                 ) : user.avatar ? (
                   <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-3xl text-gray-500 font-bold">{user.name[0].toUpperCase()}</span>
                 )}
              </div>

              <div className="flex gap-3 w-full">
                {isCameraActive ? (
                  <button 
                    onClick={takePhoto}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl flex items-center justify-center gap-2"
                  >
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={startCamera}
                      className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-2 rounded-xl border border-nexus-700 flex items-center justify-center gap-2 text-sm"
                    >
                      <CameraIcon />
                      {t.takePhoto}
                    </button>
                    <label className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-2 rounded-xl border border-nexus-700 flex items-center justify-center gap-2 cursor-pointer text-sm">
                      <UploadIcon />
                      {t.uploadPhoto}
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Guide Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-nexus-900 border border-nexus-700 rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[80vh]">
             <div className="p-6 border-b border-nexus-700 flex justify-between items-center bg-nexus-800/50 rounded-t-2xl">
               <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 <HelpIcon /> {t.userGuide}
               </h2>
               <button 
                 onClick={() => setShowHelpModal(false)}
                 className="text-gray-500 hover:text-white"
               >
                 ✕
               </button>
             </div>
             
             <div className="p-6 overflow-y-auto custom-scrollbar text-sm md:text-base space-y-6">
               {USER_GUIDE[language].map((item, index) => (
                 <div key={index} className="bg-nexus-800/30 p-4 rounded-xl border border-nexus-700/50">
                   <h3 className="text-emerald-400 font-bold mb-2 text-lg">{item.title}</h3>
                   <p className="text-gray-300 leading-relaxed">{item.content}</p>
                 </div>
               ))}
               
               <div className="mt-8 pt-4 border-t border-nexus-700 text-center">
                 <p className="text-gray-400 text-sm mb-2">{t.contactUs}</p>
                 <a href={`mailto:${CONTACT_EMAIL}`} className="text-nexus-accent hover:text-white font-mono text-lg font-bold">
                   {CONTACT_EMAIL}
                 </a>
               </div>
             </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;