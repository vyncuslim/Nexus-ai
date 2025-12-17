import React, { useState } from 'react';
import { Language } from '../types';
import { UI_TEXT, validateInviteCode } from '../constants';
import { OpenAIIcon, GoogleIcon, BrainIcon } from './Icon';

declare const google: any;

interface AuthScreenProps {
  onAuthSuccess: (inviteCode: string, name: string, keys: { openai?: string, google?: string, anthropic?: string }, avatar?: string) => void;
  language: Language;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, language }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Invite, 2: Name, 3: Keys
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  
  const [openaiKey, setOpenaiKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleGoogleSignIn = () => {
    // 1. Validate Invite Code First
    if (!validateInviteCode(inviteCode)) {
      setError(t.authErrorInvalidCode);
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      // 2. Initialize OAuth 2.0 Code Flow
      const client = google.accounts.oauth2.initTokenClient({
        client_id: 'YOUR_CLIENT_ID', // In a real app, this comes from env. Using fallback for demo.
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.access_token) {
            try {
              // 3. Fetch User Info
              const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const userData = await userInfoResponse.json();
              
              // 4. Update State
              if (userData.name) setName(userData.name);
              if (userData.picture) setAvatar(userData.picture);
              
              // 5. Skip Name Step
              setIsLoading(false);
              setStep(3);
            } catch (err) {
              console.error("Failed to fetch user info", err);
              setError("Google Sign-In failed to retrieve user data.");
              setIsLoading(false);
            }
          }
        },
        error_callback: (err: any) => {
            console.error("Google Auth Error", err);
            setError("Google Sign-In was cancelled or failed.");
            setIsLoading(false);
        }
      });
      
      // 6. Trigger Flow
      client.requestAccessToken();

    } catch (e) {
      // Fallback for demo/dev environment where Google Client ID might not be set
      console.warn("Google Auth API not loaded or configured. Using mock.", e);
      setTimeout(() => {
        setName("Google User");
        setStep(3);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validOpenAI = openaiKey.trim().startsWith('sk-');
    const validGoogle = googleKey.trim().length > 0;
    const validAnthropic = anthropicKey.trim().startsWith('sk-ant');

    onAuthSuccess(inviteCode, name, {
      openai: validOpenAI ? openaiKey.trim() : undefined,
      google: validGoogle ? googleKey.trim() : undefined,
      anthropic: validAnthropic ? anthropicKey.trim() : undefined
    }, avatar);
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
              <div className="space-y-4">
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

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-nexus-700"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">OR</span>
                    <div className="flex-grow border-t border-nexus-700"></div>
                </div>

                <button 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl font-bold tracking-wide bg-white text-gray-800 shadow-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <GoogleIcon />
                  )}
                  <span className="text-sm">Sign in with Google</span>
                </button>
              </div>
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
                  {/* Google Input */}
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-500"><GoogleIcon /></div>
                    <input 
                      type="password" 
                      value={googleKey}
                      onChange={(e) => setGoogleKey(e.target.value)}
                      className="w-full bg-nexus-900/80 border border-nexus-700 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono placeholder-gray-600 text-sm"
                      placeholder={t.googleKeyPlaceholder}
                    />
                  </div>

                  {/* OpenAI Input */}
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

                  {/* Anthropic Input */}
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-500"><BrainIcon /></div>
                    <input 
                      type="password" 
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      className="w-full bg-nexus-900/80 border border-nexus-700 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono placeholder-gray-600 text-sm"
                      placeholder="Anthropic API Key (sk-ant-...)"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-gray-500 text-center">
                  {t.keysHelp}
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