import React, { useState, useRef } from 'react';
import { 
  PlusIcon, GlobeIcon, LogOutIcon, TrashIcon, CameraIcon, 
  UploadIcon, UserIcon, HelpIcon, UndoIcon, RedoIcon, 
  SearchIcon, SettingsIcon, CheckCircleIcon, GoogleIcon, 
  OpenAIIcon, BrainIcon, CheckIcon, LinkIcon
} from './Icon';
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
  googleClientId: string;
  onUpdateApiKeys: (keys: { google?: string, openai?: string, anthropic?: string, googleClientId?: string }) => void;
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
  googleClientId,
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
  const [tempClientId, setTempClientId] = useState(googleClientId);

  // Profile Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
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
      const MAX_SIZE = 120;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
      } else {
        if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
      }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.8));
    };
  };

  const handleSaveSettings = () => {
    onUpdateApiKeys({ ...tempKeys, googleClientId: tempClientId });
    setShowSettingsModal(false);
  };

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (session.title && session.title.toLowerCase().includes(q)) ||
           session.messages.some(m => m.text.toLowerCase().includes(q));
  });

  const groupedSessions = React.useMemo(() => {
    const groups: { [key: string]: ChatSession[] } = { today: [], yesterday: [], previous7Days: [], older: [] };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);

    filteredSessions.forEach(session => {
      const date = new Date(session.updatedAt);
      if (date >= today) groups.today.push(session);
      else if (date >= yesterday) groups.yesterday.push(session);
      else if (date >= lastWeek) groups.previous7Days.push(session);
      else groups.older.push(session);
    });
    return groups;
  }, [filteredSessions]);

  const renderSessionGroup = (groupTitle: string, groupSessions: ChatSession[]) => {
    if (groupSessions.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="px-3 pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">{groupTitle}</div>
        <div className="space-y-1">
          {groupSessions.map(session => (
            <div 
              key={session.id} onClick={() => onSelectSession(session.id)}
              className={`group relative flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 border border-transparent ${currentSessionId === session.id ? 'bg-nexus-800 border-nexus-700 text-white shadow-md' : 'text-gray-400 hover:bg-nexus-800/50 hover:text-gray-200'}`}
            >
              <span className="truncate text-sm flex-1 pr-6 font-medium">{session.title || (language === 'zh' ? '新对话' : 'New Chat')}</span>
              <button onClick={(e) => onDeleteSession(session.id, e)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all"><TrashIcon /></button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-nexus-900 border-r border-nexus-700 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col shadow-2xl`}>
        <div className="flex flex-col h-full">
          <div className="p-4 pb-0">
             <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-6 h-6 bg-gradient-to-tr from-nexus-accent to-purple-600 rounded-md shadow-lg"></div>
              <span className="text-lg font-bold tracking-tight text-white font-mono">NEXUS<span className="text-nexus-accent">_CORE</span></span>
            </div>
            <button onClick={onNewChat} className="flex items-center justify-center gap-3 w-full px-4 py-2.5 bg-nexus-800 hover:bg-nexus-700 border border-nexus-700 rounded-xl transition-all text-sm font-semibold text-white mb-3 group">
              <PlusIcon /> {t.newChat} <span className="ml-auto text-[10px] text-gray-500 font-mono bg-nexus-900 px-1.5 rounded border border-nexus-700/50">Alt+N</span>
            </button>
            <div className="relative mb-2">
              <div className="absolute left-3 top-2.5 text-gray-500"><SearchIcon /></div>
              <input type="text" placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-nexus-accent/50 transition-colors placeholder-gray-600" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
            {renderSessionGroup(t.today, groupedSessions.today)}
            {renderSessionGroup(t.yesterday, groupedSessions.yesterday)}
            {renderSessionGroup(t.previous7Days, groupedSessions.previous7Days)}
            {renderSessionGroup(t.older, groupedSessions.older)}
          </div>
          <div className="p-4 bg-nexus-900 border-t border-nexus-700 space-y-2">
            <div className="flex gap-2">
              <button onClick={onUndo} disabled={!canUndo} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-nexus-800 rounded-lg text-xs font-medium border border-transparent ${canUndo ? 'hover:bg-nexus-700 text-gray-400 hover:text-white' : 'opacity-50 text-gray-600 cursor-not-allowed'}`}><UndoIcon /> {t.undo}</button>
              <button onClick={onRedo} disabled={!canRedo} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-nexus-800 rounded-lg text-xs font-medium border border-transparent ${canRedo ? 'hover:bg-nexus-700 text-gray-400 hover:text-white' : 'opacity-50 text-gray-600 cursor-not-allowed'}`}><RedoIcon /> {t.redo}</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setTempKeys(apiKeys); setTempClientId(googleClientId); setShowSettingsModal(true); }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-nexus-800 hover:bg-nexus-700 text-gray-400 hover:text-white rounded-lg transition-colors text-xs font-medium border border-transparent hover:border-nexus-600"><SettingsIcon /> {t.settings}</button>
              <button onClick={() => setShowHelpModal(true)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-nexus-800 hover:bg-nexus-700 text-gray-400 hover:text-white rounded-lg transition-colors text-xs font-medium border border-transparent hover:border-nexus-600"><HelpIcon /> {t.userGuide}</button>
            </div>
            <button onClick={onToggleLanguage} className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-nexus-800 text-gray-400 hover:text-white transition-colors text-xs font-medium border border-transparent hover:border-nexus-700">
              <div className="flex items-center gap-2"><GlobeIcon /> {t.language}</div>
              <span className="bg-nexus-800 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono border border-nexus-700">{language}</span>
            </button>
            <div className="flex items-center justify-between pt-2 border-t border-nexus-700/50 cursor-pointer hover:bg-nexus-800 rounded-lg p-2 transition-colors" onClick={() => setShowProfileModal(true)}>
               <div className="flex items-center gap-3 overflow-hidden">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-xs font-bold text-white shadow-inner overflow-hidden border border-nexus-600">
                   {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : user.name[0].toUpperCase()}
                 </div>
                 <div className="flex flex-col min-w-0">
                   <span className="text-sm font-medium text-white truncate">{user.name}</span>
                   <span className="text-[10px] text-gray-500 truncate font-mono">{user.email}</span>
                 </div>
               </div>
               <button onClick={(e) => { e.stopPropagation(); onLogout(); }} className="p-2 text-gray-500 hover:text-white hover:bg-nexus-700 rounded-lg transition-colors"><LogOutIcon /></button>
            </div>
          </div>
        </div>
      </aside>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-nexus-900 border border-nexus-700 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-nexus-700 flex justify-between items-center">
               <h2 className="text-xl font-bold text-white flex items-center gap-2"><SettingsIcon /> {t.settings}</h2>
               <button onClick={() => setShowSettingsModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
               <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">Integrations</label>
                  <div className="bg-nexus-800 rounded-xl p-4 border border-nexus-700 flex items-center justify-between shadow-inner">
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-nexus-900 rounded-lg"><GoogleIcon /></div>
                       <div>
                         <div className="text-sm font-bold text-white">{t.linkGoogle}</div>
                         <div className="text-[10px] text-gray-500 font-mono">
                           {user.isGoogleLinked ? 'CONNECTED' : 'NOT LINKED'}
                         </div>
                       </div>
                     </div>
                     {user.isGoogleLinked ? (
                       <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/20">ACTIVE</span>
                     ) : (
                       <button 
                         onClick={onLinkGoogle} 
                         className="px-4 py-1.5 bg-nexus-accent hover:bg-nexus-accentHover text-white text-xs font-bold rounded-lg transition-all shadow-lg"
                       >
                         {t.linkGoogle}
                       </button>
                     )}
                  </div>
               </div>

               <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">{t.persona}</label>
                  <div className="grid grid-cols-1 gap-2">
                    {PERSONAS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => onUpdatePersona(p.id)}
                        className={`text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${currentPersonaId === p.id ? 'bg-nexus-800 border-nexus-accent shadow-md' : 'bg-nexus-900 border-nexus-700 hover:bg-nexus-800'}`}
                      >
                        <div className={`mt-0.5 ${currentPersonaId === p.id ? 'text-nexus-accent' : 'text-gray-700'}`}>
                          <CheckCircleIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-bold ${currentPersonaId === p.id ? 'text-white' : 'text-gray-400'}`}>{p.name}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{p.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
               </div>

               <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">{t.apiKeys}</label>
                  <div className="space-y-3">
                    <div className="relative group">
                      <div className="absolute left-3 top-3 text-gray-500 group-focus-within:text-nexus-accent"><GoogleIcon /></div>
                      <input 
                        type="password"
                        value={tempKeys.google}
                        onChange={(e) => setTempKeys({...tempKeys, google: e.target.value})}
                        className="w-full bg-nexus-950 border border-nexus-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono placeholder-gray-700 focus:border-nexus-accent focus:outline-none transition-all"
                        placeholder="Google API Key"
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute left-3 top-3 text-gray-500 group-focus-within:text-nexus-accent"><OpenAIIcon /></div>
                      <input 
                        type="password"
                        value={tempKeys.openai}
                        onChange={(e) => setTempKeys({...tempKeys, openai: e.target.value})}
                        className="w-full bg-nexus-950 border border-nexus-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono placeholder-gray-700 focus:border-nexus-accent focus:outline-none transition-all"
                        placeholder="OpenAI API Key (sk-...)"
                      />
                    </div>
                  </div>
               </div>

               <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">Advanced Configuration</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-3 text-gray-500 group-focus-within:text-nexus-accent"><LinkIcon /></div>
                    <input 
                      type="text"
                      value={tempClientId}
                      onChange={(e) => setTempClientId(e.target.value)}
                      className="w-full bg-nexus-950 border border-nexus-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono placeholder-gray-700 focus:border-nexus-accent focus:outline-none transition-all"
                      placeholder="Google OAuth Client ID"
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 mt-2 px-1">Required for real Google Account linkage (e.g. your-client-id.apps.googleusercontent.com).</p>
               </div>
            </div>

            <div className="p-6 border-t border-nexus-700 flex justify-end gap-3 bg-nexus-800/20">
               <button onClick={() => setShowSettingsModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-nexus-800 transition-all">{t.cancel}</button>
               <button onClick={handleSaveSettings} className="px-6 py-2 rounded-lg text-sm font-bold bg-nexus-accent hover:bg-nexus-accentHover text-white transition-all shadow-lg shadow-blue-500/10">{t.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-nexus-900 border border-nexus-700 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative text-center">
            <button onClick={() => { stopCamera(); setShowProfileModal(false); }} className="absolute top-6 right-6 text-gray-600 hover:text-white transition-colors">✕</button>
            <h2 className="text-xl font-bold text-white mb-8">{t.profile}</h2>
            <div className="flex flex-col items-center gap-8">
              <div className="w-28 h-28 rounded-full bg-nexus-800 border-2 border-nexus-700 flex items-center justify-center overflow-hidden shadow-inner ring-4 ring-nexus-accent/10">
                 {isCameraActive ? (
                   <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                 ) : user.avatar ? (
                   <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-4xl text-gray-600 font-bold">{user.name[0].toUpperCase()}</span>
                 )}
              </div>
              <div className="flex gap-3 w-full">
                {isCameraActive ? (
                  <button onClick={takePhoto} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-red-500/20">CAPTURE</button>
                ) : (
                  <>
                    <button onClick={startCamera} className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-2.5 rounded-xl border border-nexus-700 flex items-center justify-center gap-2 text-xs font-bold transition-all"><CameraIcon />{t.takePhoto}</button>
                    <label className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-2.5 rounded-xl border border-nexus-700 flex items-center justify-center gap-2 cursor-pointer text-xs font-bold transition-all">
                      <UploadIcon />{t.uploadPhoto}
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
             <div className="p-6 border-b border-nexus-700 flex justify-between items-center bg-nexus-800/30">
               <h2 className="text-xl font-bold text-white flex items-center gap-2"><HelpIcon /> {t.userGuide}</h2>
               <button onClick={() => setShowHelpModal(false)} className="text-gray-600 hover:text-white transition-colors">✕</button>
             </div>
             <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
               {USER_GUIDE[language].map((item, index) => (
                 <div key={index} className="p-5 rounded-2xl bg-nexus-800/20 border border-nexus-700/50 hover:bg-nexus-800/40 transition-colors">
                   <h3 className="text-nexus-accent font-bold mb-2 flex items-center gap-2"><CheckCircleIcon /> {item.title}</h3>
                   <p className="text-gray-400 text-sm leading-relaxed">{item.content}</p>
                 </div>
               ))}
               <div className="mt-8 pt-8 border-t border-nexus-700 text-center">
                 <p className="text-gray-500 text-xs mb-3">{t.contactUs}</p>
                 <a href={`mailto:${CONTACT_EMAIL}`} className="text-nexus-accent hover:text-white font-mono text-lg font-bold transition-colors">{CONTACT_EMAIL}</a>
               </div>
             </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;