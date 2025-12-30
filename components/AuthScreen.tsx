import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { UI_TEXT, validateInviteCode, DEFAULT_GOOGLE_CLIENT_ID } from '../constants';
import { GoogleIcon, OpenAIIcon, AnthropicIcon, DeepSeekIcon, GrokIcon } from './Icon';

declare const google: any;

interface AuthScreenProps {
  onAuthSuccess: (inviteCode: string, name: string, keys: { google?: string, openai?: string, anthropic?: string, deepseek?: string, grok?: string, googleClientId?: string }, avatar?: string) => void;
  language: Language;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, language }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [googleKey, setGoogleKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [grokKey, setGrokKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const t = UI_TEXT[language];

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleCredentialResponse = (response: any) => {
    const payload = parseJwt(response.credential);
    if (payload) {
      setName(payload.name || payload.email || 'Operator');
      setAvatar(payload.picture);
      setStep(3);
      setError(null);
    } else {
      setError("Authorization handshake failed.");
    }
  };

  useEffect(() => {
    if (step === 2 && (window as any).google) {
      google.accounts.id.initialize({
        client_id: DEFAULT_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      google.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        { theme: "outline", size: "large", width: "100%", shape: "pill", text: "continue_with" }
      );
    }
  }, [step]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateInviteCode(inviteCode)) { setStep(2); setError(null); } else { setError(t.authErrorInvalidCode); }
  };

  const handleManualNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) { setStep(3); setError(null); }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuthSuccess(inviteCode, name, {
      google: googleKey.trim() || undefined,
      openai: openaiKey.trim() || undefined,
      anthropic: anthropicKey.trim() || undefined,
      deepseek: deepseekKey.trim() || undefined,
      grok: grokKey.trim() || undefined
    }, avatar);
  };

  return (
    <div className="fixed inset-0 bg-nexus-950 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05)_0%,transparent_70%)]"></div>
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center mb-3 italic text-xl font-black text-white animate-glow">N</div>
          <h1 className="text-lg font-black italic text-white uppercase tracking-tighter">{t.welcomeTitle}</h1>
        </div>

        <div className="glass-panel rounded-[2rem] p-6 shadow-3xl border-white/5 bg-nexus-900/40 backdrop-blur-3xl relative overflow-hidden min-h-[300px] flex flex-col justify-center text-[10px]">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-nexus-accent/40 to-transparent animate-scan"></div>
          
          {error && <div className="mb-3 text-center text-red-400 font-bold uppercase tracking-widest animate-pulse">{error}</div>}

          {step === 1 && (
            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 text-center font-mono uppercase tracking-widest outline-none focus:border-cyan-500/30 transition-all text-[10px]" placeholder={t.invitePlaceholder} autoFocus />
              <button type="submit" disabled={!inviteCode} className="w-full py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.01] transition-all disabled:opacity-20">{t.nextBtn}</button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in slide-in-from-right-4">
              <div className="text-center">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Identity Handshake</h3>
                <p className="text-[8px] text-gray-500 font-mono uppercase tracking-widest opacity-60">Handshake Protocol Alpha</p>
              </div>
              
              <div id="google-login-btn" className="w-full flex justify-center scale-90"></div>
              
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-3 text-[7px] font-black text-gray-700 uppercase">Override</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <form onSubmit={handleManualNameSubmit} className="space-y-3">
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 text-center outline-none focus:border-cyan-500/30 transition-all text-[10px] font-bold" 
                  placeholder={t.namePlaceholder} 
                />
                <button type="submit" disabled={!name.trim()} className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                  Manual_Init
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-2 animate-in slide-in-from-right-4 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-nexus-accent/20 flex items-center justify-center border border-white/10 overflow-hidden shadow-glow">
                  {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="text-nexus-accent font-black uppercase text-xs">{name?.[0] || '?'}</div>}
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-white uppercase tracking-widest truncate max-w-[120px]">{name}</span>
                  <span className="text-[7px] text-nexus-accent font-mono uppercase tracking-widest">Signal_Stable</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 pb-3">
                 <input type="password" value={googleKey} onChange={(e) => setGoogleKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-lg px-3 py-2.5 outline-none font-mono focus:border-nexus-accent/30 placeholder-gray-800 text-[9px]" placeholder="Gemini_Uplink" />
                 <input type="password" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-lg px-3 py-2.5 outline-none font-mono focus:border-nexus-accent/30 placeholder-gray-800 text-[9px]" placeholder="Claude_Uplink" />
                 <input type="password" value={deepseekKey} onChange={(e) => setDeepseekKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-lg px-3 py-2.5 outline-none font-mono focus:border-nexus-accent/30 placeholder-gray-800 text-[9px]" placeholder="DeepSeek_Uplink" />
                 <input type="password" value={grokKey} onChange={(e) => setGrokKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-lg px-3 py-2.5 outline-none font-mono focus:border-nexus-accent/30 placeholder-gray-800 text-[9px]" placeholder="Grok_Uplink" />
                 <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-lg px-3 py-2.5 outline-none font-mono focus:border-nexus-accent/30 placeholder-gray-800 text-[9px]" placeholder="GPT_Uplink" />
              </div>
              <button type="submit" className="w-full py-3.5 bg-nexus-accent text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-glow hover:bg-nexus-accent/90 transition-all sticky bottom-0 active:scale-95">SYNC_NODE</button>
            </form>
          )}
          
          <div className="mt-6 flex justify-center gap-1.5">
             <div className={`h-0.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-4 bg-nexus-accent' : 'w-1.5 bg-white/5'}`}></div>
             <div className={`h-0.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-4 bg-nexus-accent' : 'w-1.5 bg-white/5'}`}></div>
             <div className={`h-0.5 rounded-full transition-all duration-300 ${step >= 3 ? 'w-4 bg-nexus-accent' : 'w-1.5 bg-white/5'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;