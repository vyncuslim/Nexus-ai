import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { UI_TEXT, validateInviteCode } from '../constants';
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
      <div className="relative z-10 w-full max-w-sm transition-all duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center mb-4 italic text-2xl font-black text-white animate-glow">N</div>
          <h1 className="text-xl font-black italic text-white uppercase tracking-tighter">{t.welcomeTitle}</h1>
          <p className="text-[8px] font-mono text-gray-600 tracking-[0.5em] mt-2 uppercase">Mothership_V2.5</p>
        </div>

        <div className="glass-panel rounded-[2.5rem] p-8 shadow-3xl border-white/5 bg-nexus-900/40 backdrop-blur-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-nexus-accent/40 to-transparent animate-scan"></div>
          
          {error && <div className="mb-4 text-center text-red-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">{error}</div>}

          {step === 1 && (
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className="w-full bg-black/40 border border-white/10 text-white rounded-2xl px-6 py-4 text-center font-mono uppercase tracking-widest outline-none focus:border-nexus-accent/30 transition-all" placeholder={t.invitePlaceholder} autoFocus />
              <button type="submit" disabled={!inviteCode} className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 shadow-lg">{t.nextBtn}</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleManualNameSubmit} className="space-y-4 animate-in slide-in-from-right-4">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white rounded-2xl px-6 py-4 text-center outline-none focus:border-nexus-accent/30 transition-all" placeholder={t.namePlaceholder} autoFocus />
              <button type="submit" disabled={!name.trim()} className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg">Proceed_To_Link</button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-3 animate-in slide-in-from-right-4 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
              <div className="grid grid-cols-1 gap-3 pb-4">
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-nexus-accent transition-colors"><GoogleIcon /></div>
                    <input type="password" value={googleKey} onChange={(e) => setGoogleKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-xl pl-12 pr-4 py-3.5 text-[10px] outline-none font-mono focus:border-nexus-accent/30" placeholder={t.googleKeyPlaceholder} />
                 </div>
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-orange-400 transition-colors"><AnthropicIcon /></div>
                    <input type="password" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-xl pl-12 pr-4 py-3.5 text-[10px] outline-none font-mono focus:border-nexus-accent/30" placeholder={t.anthropicKeyPlaceholder} />
                 </div>
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-emerald-500 transition-colors"><OpenAIIcon /></div>
                    <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-xl pl-12 pr-4 py-3.5 text-[10px] outline-none font-mono focus:border-nexus-accent/30" placeholder={t.openaiKeyPlaceholder} />
                 </div>
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-blue-500 transition-colors"><DeepSeekIcon /></div>
                    <input type="password" value={deepseekKey} onChange={(e) => setDeepseekKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-xl pl-12 pr-4 py-3.5 text-[10px] outline-none font-mono focus:border-nexus-accent/30" placeholder={t.deepseekKeyPlaceholder} />
                 </div>
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-white transition-colors"><GrokIcon /></div>
                    <input type="password" value={grokKey} onChange={(e) => setGrokKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white rounded-xl pl-12 pr-4 py-3.5 text-[10px] outline-none font-mono focus:border-nexus-accent/30" placeholder={t.grokKeyPlaceholder} />
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