import React, { useState, useRef } from 'react';
import { PlusIcon, GlobeIcon, LogOutIcon, TrashIcon, CameraIcon, UploadIcon, UserIcon } from './Icon';
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
  onUpdateUserAvatar: (base64: string) => void;
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
  onUpdateUserAvatar,
  onLogout,
  language,
  onToggleLanguage
}) => {
  const t = UI_TEXT[language];
  const [showProfileModal, setShowProfileModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

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
          
          {/* Brand Area */}
          <div className="p-6 pb-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-tr from-nexus-accent to-purple-600 rounded-lg shadow-lg shadow-blue-500/20"></div>
              <span className="text-xl font-bold tracking-tight text-white font-mono">NEXUS<span className="text-nexus-accent">_CORE</span></span>
            </div>

            <button 
              onClick={onNewChat}
              className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-nexus-800 hover:bg-nexus-700 hover:shadow-lg border border-nexus-700 hover:border-nexus-accent/50 rounded-xl transition-all text-sm font-semibold text-white group"
            >
              <PlusIcon />
              {t.newChat}
              <span className="ml-auto text-[10px] text-gray-500 font-mono bg-nexus-900 px-1.5 rounded border border-nexus-700/50">Alt+N</span>
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
              {/* Current Avatar Big */}
              <div className="w-24 h-24 rounded-full bg-nexus-800 border-2 border-nexus-700 flex items-center justify-center overflow-hidden">
                 {isCameraActive ? (
                   <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                 ) : user.avatar ? (
                   <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-3xl text-gray-500 font-bold">{user.name[0].toUpperCase()}</span>
                 )}
              </div>

              {/* Actions */}
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
    </>
  );
};

export default Sidebar;