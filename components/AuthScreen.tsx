
import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { UI_TEXT, validateInviteCode, DEFAULT_GOOGLE_CLIENT_ID } from '../constants';
import { OpenAIIcon, GoogleIcon, DeepSeekIcon, GrokIcon, AnthropicIcon } from './Icon';

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
      setError("Authorization failed. Please try again.");
    }
  };

  useEffect(() => {
    if (step === 2 && (window as any).google) {
      google.accounts.id.initialize({
        client_id: DEFAULT_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        // Scopes: email, profile, and openid are included by default with GIS Sign-In.
      });
      google.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        { theme: "outline", size: "large", width: "100%", shape: "pill", text: "continue_with" }
      );
    }
  }, [step]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateInviteCode(inviteCode)) { 
      setStep(2); 
      setError(null); 
    } else { 
      setError(t.authErrorInvalidCode); 
    }
  };

  const handleManualNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) { 
      setStep(3); 
      setError(null); 
    }
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
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center mb-4 italic text-2xl font-black text-white animate-glow">N</div>
          <h1 className="text-xl font-black italic text-white uppercase tracking-tighter">{t.welcomeTitle}</h1>
        </div>

        <div className="glass-panel rounded-[2rem] p-8 shadow-3xl border-white/5 bg-nexus-900/40 backdrop-blur-3xl relative overflow-hidden min-h-[340px] flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nexus-accent/40 to-transparent animate-scan"></div>
          
          {error && <div className="mb-4 text-center text-red-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">{error}</div>}

          {step === 1 && (
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className="w-full bg-black/40 border border-white/10 text-white rounded-2xl px-6 py-4 text-center font-mono uppercase tracking-widest outline-none focus:border-cyan-500/30 transition-all" placeholder={t.invitePlaceholder} autoFocus />
              <button type="submit" disabled={!inviteCode} className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-20">{t.nextBtn}</button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="text-center">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">Initialize Identity</h3>
                <p className="text-[9px] text-gray-500 font-mono uppercase mb-6">Uplink requires biological verification</p>
              </div>
              
              <div id="google-login-btn" className="w-full flex justify-center"></div>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[8px] font-black text-gray-700 uppercase">Or Manual</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <form onSubmit={handleManualNameSubmit} className="space-y-4">
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-black/40 border border-white/10 text-white rounded-2xl px-6 py-3.5 text-center outline-none focus:border-cyan-500/30 transition-all text-xs font-bold" 
                  placeholder={t.namePlaceholder} 
                />
                <button type="submit" disabled={!name.trim()} className="w-full py-3.5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                  Manual Entry
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-3 animate-in slide-in-from-right-4 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-nexus-accent/20 flex items-center justify-center border border-white/10 overflow-hidden">
                  {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="text-nexus-accent font-black uppercase text-sm">{name[0] || '?'}</div>}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[150px]">{name}</span>
                  <span className="text-[8px] text-nexus-accent font-mono uppercase">Identity_Confirmed</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 pb-4">
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-nexus-accent transition-colors"><GoogleIcon /></div>
                    <input type="password" value={googleKey} onChange={(e) => setGoogleKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-xl pl-12 pr-4 py-3.5 text-[10px] outline-none font-mono focus:border-nexus-accent/30" placeholder={t.googleKeyPlaceholder} />
                 </div>
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-orange-400 transition-colors"><AnthropicIcon /></div>
                    <input type="password" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-xl pl-12 pr-4 py-3.5 text-[10px] outline-none font-mono focus:border-nexus-accent/30" placeholder={t.anthropicKeyPlaceholder} />
                 </div>
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-blue-500 transition-colors"><DeepSeekIcon /></div>
                    <input type="password" value={deepseekKey} onChange={(e) => setDeepseekKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-xl pl-12 pr-4 py-3.5 text-[10px] outline-none font-mono focus:border-nexus-accent/30" placeholder={t.deepseekKeyPlaceholder} />
                 </div>
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-white transition-colors"><GrokIcon /></div>
                    <input type="password" value={grokKey} onChange={(e) => setGrokKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-xl pl-12 pr-4 py-3.5 text-[10px] outline-none font-mono focus:border-nexus-accent/30" placeholder={t.grokKeyPlaceholder} />
                 </div>
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-emerald-500 transition-colors"><OpenAIIcon /></div>
                    <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-xl pl-12 pr-4 py-3.5 text-[10px] outline-none font-mono focus:border-nexus-accent/30" placeholder={t.openaiKeyPlaceholder} />
                 </div>
              </div>
              <button type="submit" className="w-full py-4 bg-nexus-accent text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-glow hover:bg-nexus-accent/90 transition-all sticky bottom-0 active:scale-95">{t.connectBtn}</button>
            </form>
          )}
          
          <div className="mt-8 flex justify-center gap-2">
             <div className={`h-1 rounded-full transition-all duration-300 ${step >= 1 ? 'w-6 bg-nexus-accent' : 'w-2 bg-white/5'}`}></div>
             <div className={`h-1 rounded-full transition-all duration-300 ${step >= 2 ? 'w-6 bg-nexus-accent' : 'w-2 bg-white/5'}`}></div>
             <div className={`h-1 rounded-full transition-all duration-300 ${step >= 3 ? 'w-6 bg-nexus-accent' : 'w-2 bg-white/5'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
