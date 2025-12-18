import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { UI_TEXT, validateInviteCode } from '../constants';
import { OpenAIIcon, GoogleIcon, BrainIcon, SettingsIcon } from './Icon';

declare const google: any;

interface AuthScreenProps {
  onAuthSuccess: (inviteCode: string, name: string, keys: { openai?: string, google?: string, anthropic?: string, googleClientId?: string }, avatar?: string) => void;
  language: Language;
  initialClientId?: string;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, language, initialClientId }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Invite, 2: Identity, 3: Keys
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [customClientId, setCustomClientId] = useState(initialClientId || "597221340810-08rd8e05gs8cvm32afrk8b5i0prl2n3m.apps.googleusercontent.com");
  const [showIdConfig, setShowIdConfig] = useState(false);
  
  const [openaiKey, setOpenaiKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGsiReady, setIsGsiReady] = useState(false);
  
  const t = UI_TEXT[language];

  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        setIsGsiReady(true);
        clearInterval(timer);
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateInviteCode(inviteCode)) {
      setError(null);
      setStep(2);
    } else {
      setError(t.authErrorInvalidCode);
    }
  };

  const handleManualNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) setStep(3);
  };

  const startGoogleAuth = () => {
    if (!isGsiReady) {
      setError("Google authentication service is initializing. Please wait...");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: customClientId,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.access_token) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              if (!res.ok) throw new Error("Profile fetch failed");
              const data = await res.json();
              setName(data.name || '');
              setAvatar(data.picture);
              setIsLoading(false);
              setStep(3);
            } catch (err) {
              console.error("Auth Fetch Error", err);
              setError("Authorized but failed to fetch profile details. Please enter name manually.");
              setIsLoading(false);
            }
          }
        },
        error_callback: (err: any) => {
            console.error("OAuth Request Error:", err);
            setIsLoading(false);
            if (err.type === 'popup_closed') {
                setError("Sign-In window was closed. Please try again and ensure popups are allowed for " + window.location.origin);
            } else if (err.type === 'popup_blocked_by_browser') {
                setError("Popup blocked by browser. Please allow popups for this site.");
            } else {
                setError(`Authorization failed. Check if ${window.location.origin} is authorized in Google Console for this Client ID.`);
            }
        }
      });
      client.requestAccessToken();
    } catch (e: any) {
      console.error("GIS Error", e);
      setError("Critical error: Could not start Google Sign-In.");
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuthSuccess(inviteCode, name, {
      openai: openaiKey.startsWith('sk-') ? openaiKey.trim() : undefined,
      google: googleKey.length > 5 ? googleKey.trim() : undefined,
      anthropic: anthropicKey.startsWith('sk-ant') ? anthropicKey.trim() : undefined,
      googleClientId: customClientId.trim()
    }, avatar);
  };

  return (
    <div className="fixed inset-0 bg-nexus-900 flex flex-col items-center justify-center z-50 p-4 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md transition-all duration-500">
        <div className="flex justify-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-blue-600 rounded-[2rem] shadow-2xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform cursor-default">
            <span className="text-4xl font-black text-white italic">N</span>
          </div>
        </div>

        <div className="bg-nexus-800/40 backdrop-blur-2xl border border-nexus-700/50 rounded-[2.5rem] p-10 shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">{t.welcomeTitle}</h1>
              <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-mono">
                {step === 1 ? "Auth Required" : step === 2 ? "Select Identity" : "Neural Keys"}
              </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-xs text-center font-medium leading-relaxed">
                  {error}
                </div>
            )}

            {step === 1 && (
              <form onSubmit={handleInviteSubmit} className="space-y-6">
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full bg-nexus-900 border border-nexus-700 text-white rounded-2xl px-6 py-4 focus:border-emerald-500 outline-none text-center font-mono text-base uppercase tracking-widest placeholder-gray-700"
                    placeholder={t.invitePlaceholder}
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={!inviteCode} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50">{t.nextBtn}</button>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {!showIdConfig ? (
                  <>
                    <button 
                      onClick={startGoogleAuth}
                      disabled={isLoading}
                      className="w-full py-4 bg-white text-gray-900 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isLoading ? <span className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span> : <GoogleIcon />}
                      <span className="text-sm">Sign in with Google</span>
                    </button>
                    <div className="flex items-center gap-4 py-2">
                        <div className="flex-1 h-px bg-nexus-700/50"></div>
                        <span className="text-[10px] text-gray-600 font-mono tracking-widest">OR</span>
                        <div className="flex-1 h-px bg-nexus-700/50"></div>
                    </div>
                    <form onSubmit={handleManualNameSubmit} className="space-y-4">
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-nexus-900 border border-nexus-700 text-white rounded-2xl px-6 py-4 focus:border-blue-500 outline-none text-center text-sm placeholder-gray-700"
                        placeholder={t.namePlaceholder}
                        autoFocus
                      />
                      <button type="submit" disabled={!name.trim()} className="w-full py-4 bg-nexus-700 text-white rounded-2xl font-bold hover:bg-nexus-600 transition-all active:scale-95">Proceed Manually</button>
                    </form>
                    <button onClick={() => setShowIdConfig(true)} className="w-full py-2 text-[10px] text-gray-500 hover:text-white flex items-center justify-center gap-2 transition-colors">
                      <SettingsIcon /> Troubleshooting / Change Client ID
                    </button>
                  </>
                ) : (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                     <p className="text-[10px] text-gray-500 text-center font-mono leading-relaxed px-4">Ensure this origin is added to your OAuth Client ID configuration in Google Cloud Console:<br/><span className="text-emerald-400">{window.location.origin}</span></p>
                     <input 
                        type="text" 
                        value={customClientId}
                        onChange={(e) => setCustomClientId(e.target.value)}
                        className="w-full bg-nexus-900 border border-nexus-700 text-white rounded-2xl px-5 py-4 focus:border-blue-500 outline-none text-xs font-mono placeholder-gray-800"
                        placeholder="your-id.apps.googleusercontent.com"
                        autoFocus
                      />
                      <div className="flex gap-3">
                        <button onClick={() => setShowIdConfig(false)} className="flex-1 py-3 text-[10px] text-gray-400 font-bold border border-nexus-700 rounded-xl hover:bg-nexus-800">BACK</button>
                        <button onClick={() => { setShowIdConfig(false); setError(null); }} className="flex-1 py-3 text-[10px] bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/10">CONFIRM</button>
                      </div>
                  </div>
                )}
              </div>
            )}

             {step === 3 && (
              <form onSubmit={handleFinalSubmit} className="space-y-6">
                <div className="space-y-3">
                  <div className="relative group">
                    <div className="absolute left-4 top-4 text-gray-600 group-focus-within:text-blue-500 transition-colors"><GoogleIcon /></div>
                    <input type="password" value={googleKey} onChange={(e) => setGoogleKey(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white rounded-2xl pl-12 pr-6 py-4 focus:border-emerald-500 outline-none font-mono text-xs placeholder-gray-700" placeholder={t.googleKeyPlaceholder} />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-4 text-gray-600 group-focus-within:text-blue-500 transition-colors"><OpenAIIcon /></div>
                    <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white rounded-2xl pl-12 pr-6 py-4 focus:border-emerald-500 outline-none font-mono text-xs placeholder-gray-700" placeholder={t.openaiKeyPlaceholder} />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 transition-all active:scale-95">{t.connectBtn}</button>
                <p className="text-[10px] text-gray-500 text-center font-mono opacity-60">Authentication keys are stored locally.</p>
              </form>
            )}

            <div className="mt-10 flex justify-center gap-1">
               <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'w-3 bg-nexus-700'}`}></div>
               <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'w-3 bg-nexus-700'}`}></div>
               <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? 'w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'w-3 bg-nexus-700'}`}></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;