
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Role, AIProvider } from '../types';
import { RobotIcon, UserIcon, CopyIcon, CheckIcon, SpeakerIcon, StopIcon, XIcon, GlobeIcon, LinkIcon, GitHubIcon } from './Icon';
import { generateSpeech } from '../services/geminiService';
import { playAudioContent } from '../utils/audio';

interface MessageBubbleProps {
  message: ChatMessage;
  apiContext?: {
    apiKey: string;
    provider: AIProvider;
  };
}

const CodeBlock: React.FC<{ content: string }> = ({ content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    }
  };

  return (
    <div className="relative group my-4">
      <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleCopy}
          className="p-2 bg-nexus-900 text-gray-400 hover:text-nexus-accent hover:bg-black rounded-xl border border-white/10 shadow-xl backdrop-blur-md transition-all active:scale-95"
          title="Copy to clipboard"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
      <div className="absolute left-4 top-3 text-[10px] font-mono text-gray-600 select-none uppercase tracking-widest opacity-40">Code_Fragment</div>
      <pre className="block bg-black/60 pt-9 pb-4 px-5 rounded-[1.25rem] text-xs sm:text-sm font-mono overflow-x-auto border border-white/5 shadow-inner custom-scrollbar">
        <code className="text-gray-200">{content}</code>
      </pre>
    </div>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, apiContext }) => {
  const isUser = message.role === Role.USER;
  const isError = message.isError;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [ttsError, setTtsError] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  const toggleSpeech = async () => {
    setTtsError(false);
    if (isSpeaking) {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e) {}
        audioSourceRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }
    if (!apiContext?.apiKey) return;

    setIsLoadingAudio(true);
    try {
      const base64Audio = await generateSpeech(message.text, apiContext.apiKey, apiContext.provider);
      const source = await playAudioContent(base64Audio);
      audioSourceRef.current = source;
      setIsSpeaking(true);
      source.onended = () => {
        setIsSpeaking(false);
        audioSourceRef.current = null;
      };
    } catch (err) {
      console.error("Neural Synthesis Failure", err);
      setTtsError(true);
      setTimeout(() => setTtsError(false), 3000);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const formatText = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```|\[.*?\]\(.*?\)|https?:\/\/[^\s]+|\*\*.*?\*\*|`.*?`)/g);
    return (
        <span className="whitespace-pre-wrap leading-relaxed break-words font-medium">
            {parts.map((part, i) => {
                if (!part) return null;
                if (part.startsWith('```') && part.endsWith('```')) {
                    let content = part.slice(3, -3);
                    content = content.replace(/^[a-zA-Z0-9+#-]+\n/, ''); 
                    return <CodeBlock key={i} content={content.trim()} />;
                }
                if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                    const match = part.match(/\[(.*?)\]\((.*?)\)/);
                    if (match) {
                        return <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-nexus-accent underline-offset-4 decoration-nexus-accent/30 hover:underline">{match[1]}</a>;
                    }
                }
                if (part.match(/^https?:\/\//)) {
                    return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-nexus-accent hover:underline truncate inline-block max-w-full align-bottom">{part}</a>;
                }
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="text-white font-black">{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('`') && part.endsWith('`')) {
                    return <code key={i} className="bg-white/5 px-2 py-0.5 rounded-lg text-xs font-mono text-nexus-accent border border-white/5">{part.slice(1, -1)}</code>;
                }
                return <span key={i} className="text-gray-300/90">{part}</span>;
            })}
        </span>
    );
  };

  const hasSources = message.groundingMetadata?.groundingChunks && message.groundingMetadata.groundingChunks.length > 0;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex max-w-[90%] md:max-w-[85%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        <div className={`
          flex-shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center overflow-hidden border
          ${isUser ? 'bg-nexus-accent border-white/10 shadow-lg shadow-nexus-accent/20' : isError ? 'bg-red-500/20 border-red-500/30' : 'bg-white/5 border-white/10'}
          transition-transform hover:scale-110
        `}>
          {isUser ? <div className="text-black"><UserIcon /></div> : <div className="text-white"><RobotIcon /></div>}
        </div>

        <div className={`
          relative px-6 py-4 rounded-[1.75rem] shadow-2xl border transition-all duration-300
          ${isUser 
            ? 'bg-nexus-accent text-gray-950 rounded-tr-sm border-transparent' 
            : isError 
              ? 'bg-red-950/40 text-red-200 border-red-500/40 rounded-tl-sm backdrop-blur-md' 
              : 'bg-nexus-900/60 text-gray-100 rounded-tl-sm border-white/5 backdrop-blur-2xl'}
        `}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isUser ? 'text-black/60' : 'text-gray-500'}`}>{isUser ? 'Uplink' : 'Nexus_Response'}</span>
            {!isUser && !isError && message.text && (
               <button 
                 onClick={toggleSpeech}
                 disabled={isLoadingAudio}
                 className={`p-1.5 rounded-xl transition-all ${isSpeaking ? 'bg-nexus-accent/20 text-nexus-accent shadow-glow' : 'text-gray-600 hover:text-white hover:bg-white/5'}`}
               >
                 {isLoadingAudio ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span> : isSpeaking ? <StopIcon /> : <SpeakerIcon />}
               </button>
            )}
          </div>
          
          <div className="text-sm md:text-base selection:bg-nexus-accent/40">
            {formatText(message.text)}
          </div>

          {message.attachment && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 shadow-2xl group/attachment">
              {message.attachment.type === 'image' && <img src={message.attachment.url} alt="Output" className="w-full h-auto max-h-[500px] object-contain bg-black" />}
              {message.attachment.type === 'video' && <video controls src={message.attachment.url} className="w-full max-h-[500px] bg-black" />}
            </div>
          )}

           {hasSources && (
             <div className="mt-6 pt-5 border-t border-white/5">
               <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                 <GlobeIcon /> Verified_Knowledge_Sources
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {message.groundingMetadata?.groundingChunks?.map((chunk, idx) => {
                   if (!chunk.web) return null;
                   const isGitHub = chunk.web.uri.includes('github.com');
                   return (
                     <a 
                       key={idx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-nexus-accent/30 transition-all group/link"
                     >
                       <div className={`p-2 rounded-xl ${isGitHub ? 'bg-black text-white' : 'bg-nexus-accent/10 text-nexus-accent'} group-hover/link:scale-105 transition-transform border border-white/5`}>
                         {isGitHub ? <GitHubIcon /> : <LinkIcon />}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="text-xs font-bold text-gray-300 truncate group-hover/link:text-white">{chunk.web.title}</div>
                         <div className="text-[9px] text-gray-600 truncate font-mono tracking-tighter mt-0.5">{new URL(chunk.web.uri).hostname}</div>
                       </div>
                     </a>
                   );
                 })}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
