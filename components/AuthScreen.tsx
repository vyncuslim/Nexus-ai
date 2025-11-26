import React, { useState } from 'react';
import { User, Language } from '../types';
import { UI_TEXT } from '../constants';

interface AuthScreenProps {
  onAuth: (email: string, isLoginMode: boolean, name?: string) => string | null;
  language: Language;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuth, language }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const t = UI_TEXT[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (email.trim()) {
      const resultError = onAuth(email.trim(), isLogin, isLogin ? undefined : name.trim());
      if (resultError) {
        setError(resultError);
      }
    }
  };

  const switchMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-nexus-900 flex flex-col items-center justify-center z-50 p-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nexus-accent/10 rounded-full blur-[100px] animate-pulse-slow"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-tr from-nexus-accent to-purple-600 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.5)] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-nexus-800/50 backdrop-blur-xl border border-nexus-700 rounded-3xl p-1 shadow-2xl transition-all duration-300">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 mb-2 bg-nexus-900/50 rounded-2xl">
             <button 
               onClick={() => switchMode(true)}
               className={`py-3 rounded-xl text-sm font-semibold transition-all ${isLogin ? 'bg-nexus-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
             >
               {t.signIn}
             </button>
             <button 
               onClick={() => switchMode(false)}
               className={`py-3 rounded-xl text-sm font-semibold transition-all ${!isLogin ? 'bg-nexus-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
             >
               {t.signUp}
             </button>
          </div>

          <div className="p-6 pt-2">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-white mb-1">
                {isLogin ? t.welcomeBack : t.joinNexus}
              </h1>
              <p className="text-gray-400 text-xs">
                {isLogin ? t.loginSubtitle : t.loginTitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs text-center animate-pulse">
                  {error}
                </div>
              )}

              {!isLogin && (
                <div>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-nexus-900/80 border border-nexus-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-nexus-accent focus:ring-1 focus:ring-nexus-accent transition-all font-sans placeholder-gray-600 text-sm"
                    placeholder={t.namePlaceholder}
                    required
                  />
                </div>
              )}
              
              <div>
                <input 
                  type="email" 
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-nexus-900/80 border border-nexus-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-nexus-accent focus:ring-1 focus:ring-nexus-accent transition-all font-mono placeholder-gray-600 text-sm"
                  placeholder={t.emailPlaceholder}
                  autoFocus
                  required
                />
              </div>
              
              <button 
                type="submit"
                disabled={!email.trim() || (!isLogin && !name.trim())}
                className={`
                  w-full py-3.5 rounded-xl font-bold tracking-wide transition-all transform duration-200 mt-2
                  ${(email.trim() && (isLogin || name.trim()))
                    ? 'bg-gradient-to-r from-nexus-accent to-blue-600 text-white shadow-lg hover:scale-[1.02] hover:shadow-blue-500/30' 
                    : 'bg-nexus-700 text-gray-500 cursor-not-allowed'}
                `}
              >
                {isLogin ? t.connectBtn : t.createBtn}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-600 font-mono">
            SECURE CONNECTION // PROTOCOL V2.0 // EST. 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;