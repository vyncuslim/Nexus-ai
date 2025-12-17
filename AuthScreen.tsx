import React, { useState } from 'react';
import { Language } from '../types';
import { UI_TEXT, validateInviteCode } from '../constants';
import { OpenAIIcon } from './Icon';

interface AuthScreenProps {
  onAuthSuccess: (inviteCode: string, name: string, keys: { openai?: string, google?: string }) => void;
  language: Language;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, language }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Invite, 2: Name, 3: Keys
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const t = UI_TEXT[language];

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateInviteCode(inviteCode)) {
      setError(null);
      setStep(2);
    } else {
      setError(t.authErrorInvalidCode);
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length > 0) {
      setStep(3);
    }
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validOpenAI = openaiKey.trim().startsWith('sk-');

    onAuthSuccess(inviteCode, name, {
      openai: validOpenAI ? openaiKey.trim() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-nexus-900 flex flex-col items-center justify-center z-50 p-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse-slow"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.5)] flex items-center justify-center">
              <span className="text-3xl font-bold text-white">N</span>
            </div>
          </div>
        </div>

        <div className="bg-nexus-800/50 backdrop-blur-xl border border-nexus-700 rounded-3xl p-8 shadow-2xl transition-all duration-300">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-white mb-1">
                {t.welcomeTitle}
              </h1>
              <p className="text-gray-400 text-xs uppercase tracking-widest">
                {step === 1 ? t.loginTitle : step === 2 ? t.joinNexus : "Credentials"}
              </p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs text-center animate-pulse">
                  {error}
                </div>
            )}

            {/* STEP 1: INVITE CODE */}
            {step === 1 && (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <input 
                  type="text" 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full bg-nexus-900/80 border border-nexus-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono placeholder-gray-600 text-sm text-center uppercase tracking-widest"
                  placeholder={t.invitePlaceholder}
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={!inviteCode}
                  className="w-full py-3.5 rounded-xl font-bold tracking-wide bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 transition-all"
                >
                  {t.nextBtn}
                </button>
              </form>
            )}

            {/* STEP 2: NAME */}
            {step === 2 && (
              <form onSubmit={handleNameSubmit} className="space-y-4">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-nexus-900/80 border border-nexus-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans placeholder-gray-600 text-sm text-center"
                  placeholder={t.namePlaceholder}
                  autoFocus
                />
                 <button 
                  type="submit"
                  disabled={!name.trim()}
                  className="w-full py-3.5 rounded-xl font-bold tracking-wide bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 transition-all"
                >
                  {t.nextBtn}
                </button>
              </form>
            )}

             {/* STEP 3: API KEYS */}
             {step === 3 && (
              <form onSubmit={handleKeySubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                     <span className="text-sm text-emerald-200">Google Gemini Connected</span>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-500"><OpenAIIcon /></div>
                    <input 
                      type="password" 
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      className="w-full bg-nexus-900/80 border border-nexus-700 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono placeholder-gray-600 text-sm"
                      placeholder={t.openaiKeyPlaceholder}
                    />
                  </div>
                </div>

                <p className="text-[10px] text-gray-500 text-center">
                  {t.optional}
                </p>
                 <button 
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold tracking-wide bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 transition-all"
                >
                  {t.connectBtn}
                </button>
              </form>
            )}

            <div className="mt-6 flex justify-center gap-1">
               <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-nexus-700'}`}></div>
               <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-nexus-700'}`}></div>
               <div className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-nexus-700'}`}></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;