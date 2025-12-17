import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Role, AIProvider } from '../types';
import { RobotIcon, UserIcon, CopyIcon, CheckIcon, SpeakerIcon, StopIcon, XIcon, GlobeIcon, LinkIcon } from './Icon';
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
    <div className="relative group my-3">
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleCopy}
          className="p-1.5 bg-nexus-800 text-gray-400 hover:text-emerald-400 hover:bg-nexus-700 rounded-lg border border-nexus-700 shadow-lg backdrop-blur-sm transition-all"
          title="Copy code"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
      <pre className="block bg-nexus-950/50 p-4 rounded-xl text-xs sm:text-sm font-mono overflow-x-auto border border-nexus-700/50 shadow-inner custom-scrollbar">
        <code>{content}</code>
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

  // Stop audio if component unmounts
  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  const toggleSpeech = async () => {
    // Reset error state on new attempt
    setTtsError(false);

    if (isSpeaking) {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e) {}
        audioSourceRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }

    if (!apiContext?.apiKey) {
      alert("Please login with an API Key to use TTS.");
      return;
    }

    setIsLoadingAudio(true);
    try {
      // 1. Generate Audio
      const base64Audio = await generateSpeech(message.text, apiContext.apiKey, apiContext.provider);
      
      // 2. Play Audio
      const source = await playAudioContent(base64Audio);
      audioSourceRef.current = source;
      setIsSpeaking(true);
      
      source.onended = () => {
        setIsSpeaking(false);
        audioSourceRef.current = null;
      };

    } catch (err) {
      console.error("TTS Error", err);
      setTtsError(true);
      // clear error visual after 3 seconds
      setTimeout(() => setTtsError(false), 3000);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Basic formatting for code blocks, bold text, and links
  const formatText = (text: string) => {
    // Regex matches:
    // 1. Code blocks: ```...```
    // 2. Links: [text](url)
    // 3. Raw URLs: http...
    // 4. Bold: **text**
    // 5. Inline code: `text`
    const parts = text.split(/(```[\s\S]*?```|\[.*?\]\(.*?\)|https?:\/\/[^\s]+|\*\*.*?\*\*|`.*?`)/g);
    
    return (
        <span className="whitespace-pre-wrap leading-relaxed break-words">
            {parts.map((part, i) => {
                if (!part) return null;

                // Code Block
                if (part.startsWith('```') && part.endsWith('```')) {
                    let content = part.slice(3, -3);
                    // Attempt to strip language identifier (e.g. "javascript\n")
                    content = content.replace(/^[a-zA-Z0-9+#]+\n/, ''); 
                    return <CodeBlock key={i} content={content.trim()} />;
                }
                
                // Link: [text](url)
                if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                    const match = part.match(/\[(.*?)\]\((.*?)\)/);
                    if (match) {
                        return <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-nexus-accent hover:underline">{match[1]}</a>;
                    }
                }

                // Raw URL
                if (part.match(/^https?:\/\//)) {
                    return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-nexus-accent hover:underline">{part}</a>;
                }

                // Bold
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                }

                // Inline Code
                if (part.startsWith('`') && part.endsWith('`')) {
                    return <code key={i} className="bg-nexus-900/50 px-1.5 py-0.5 rounded text-xs font-mono text-nexus-accent/80 border border-nexus-700/30">{part.slice(1, -1)}</code>;
                }

                return <span key={i}>{part}</span>;
            })}
        </span>
    );
  };

  const hasSources = message.groundingMetadata?.groundingChunks && message.groundingMetadata.groundingChunks.length > 0;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden
          ${isUser ? 'bg-nexus-accent' : isError ? 'bg-red-600' : 'bg-emerald-600'}
          shadow-lg
        `}>
          {isUser ? <UserIcon /> : <RobotIcon />}
        </div>

        {/* Bubble */}
        <div className={`
          relative px-4 py-3 rounded-2xl shadow-sm border group flex flex-col min-w-0
          ${isUser 
            ? 'bg-nexus-700 text-white rounded-tr-sm border-transparent' 
            : isError 
              ? 'bg-red-900/20 text-red-200 border-red-500/50 rounded-tl-sm' 
              : 'bg-nexus-800 text-gray-100 rounded-tl-sm border-nexus-700'}
        `}>
          {/* Label Header */}
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold opacity-50">{isUser ? 'You' : 'Nexus'}</span>
            
            <div className="flex items-center gap-2">
               {isError && <span className="text-red-400 text-xs ml-2">ERROR</span>}
               
               {/* TTS Button (Only for Model) */}
               {!isUser && !isError && message.text && (
                 <button 
                   onClick={toggleSpeech}
                   disabled={isLoadingAudio}
                   className={`
                     p-1 rounded-md transition-all duration-200 flex items-center justify-center
                     ${ttsError 
                        ? 'text-red-400 bg-red-900/20' 
                        : isSpeaking 
                            ? 'text-nexus-accent bg-nexus-900/50 ring-1 ring-nexus-accent/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                            : 'text-gray-500 hover:text-white hover:bg-nexus-700'}
                   `}
                   title={ttsError ? "TTS Failed" : isSpeaking ? "Stop" : "Read Aloud"}
                   aria-label={isSpeaking ? "Stop reading" : "Read aloud"}
                 >
                   {isLoadingAudio ? (
                     <span className="block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                   ) : ttsError ? (
                     <XIcon /> 
                   ) : isSpeaking ? (
                     <StopIcon />
                   ) : (
                     <SpeakerIcon />
                   )}
                 </button>
               )}
            </div>
          </div>
          
          <div className="text-sm md:text-base">
            {formatText(message.text)}
          </div>

          {/* Attachments */}
          {message.attachment && (
            <div className="mt-3 rounded-lg overflow-hidden border border-nexus-700 shadow-md">
              {message.attachment.type === 'image' && (
                <img src={message.attachment.url} alt="Generated content" className="w-full h-auto max-h-96 object-contain bg-black/50" />
              )}
              {message.attachment.type === 'video' && (
                <video controls src={message.attachment.url} className="w-full max-h-96 bg-black/50" />
              )}
            </div>
          )}

           {/* Sources (Grounding) */}
           {hasSources && (
             <div className="mt-4 pt-3 border-t border-nexus-700/50">
               <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                 <GlobeIcon />
                 Sources
               </div>
               <div className="grid grid-cols-1 gap-2">
                 {message.groundingMetadata?.groundingChunks?.map((chunk, idx) => {
                   if (!chunk.web) return null;
                   return (
                     <a 
                       key={idx} 
                       href={chunk.web.uri} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center gap-3 p-2 rounded-lg bg-nexus-900/50 hover:bg-nexus-700 border border-nexus-700/50 hover:border-nexus-600 transition-all group/link"
                     >
                       <div className="p-1.5 rounded-full bg-nexus-800 text-nexus-accent/70 group-hover/link:text-nexus-accent group-hover/link:bg-nexus-700/50">
                         <LinkIcon />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="text-xs font-medium text-gray-300 truncate group-hover/link:text-white">
                           {chunk.web.title}
                         </div>
                         <div className="text-[10px] text-gray-500 truncate font-mono">
                           {new URL(chunk.web.uri).hostname}
                         </div>
                       </div>
                     </a>
                   );
                 })}
               </div>
             </div>
           )}

          {/* Timestamp (Hidden by default, shown on hover) */}
          <div className="absolute -bottom-5 left-0 w-full text-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;