
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Role, AIProvider } from '../types';
import { RobotIcon, UserIcon, CopyIcon, CheckIcon, SpeakerIcon, StopIcon, XIcon, GlobeIcon, LinkIcon, GitHubIcon, BrainIcon, ChevronDownIcon, ActivityIcon, AgentIcon } from './Icon';
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
      });
    }
  };
  return (
    <div className="relative group my-4">
      <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleCopy} className="p-2 bg-nexus-900 text-gray-400 hover:text-nexus-accent hover:bg-black rounded-xl border border-white/10 shadow-xl backdrop-blur-md transition-all">
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
      <div className="absolute left-4 top-3 text-[9px] font-mono text-gray-700 select-none uppercase tracking-widest opacity-60">Source_Code</div>
      <pre className="block bg-black/60 pt-9 pb-4 px-5 rounded-[1.25rem] text-xs font-mono overflow-x-auto border border-white/5 custom-scrollbar">
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
  const [showThought, setShowThought] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => { if (audioSourceRef.current) try { audioSourceRef.current.stop(); } catch(e) {} };
  }, []);

  const toggleSpeech = async () => {
    if (isSpeaking) {
      if (audioSourceRef.current) try { audioSourceRef.current.stop(); } catch(e) {}
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
      source.onended = () => setIsSpeaking(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const parseAgentContent = (text: string) => {
    const thoughtMatch = text.match(/<thought>([\s\S]*?)<\/thought>/);
    const planMatch = text.match(/<plan>([\s\S]*?)<\/plan>/);
    const thought = thoughtMatch ? thoughtMatch[1].trim() : null;
    const plan = planMatch ? planMatch[1].trim().split('\n').filter(s => s.trim()) : null;
    const cleanText = text
      .replace(/<thought>[\s\S]*?<\/thought>/, '')
      .replace(/<plan>[\s\S]*?<\/plan>/, '')
      .trim();
    return { thought, plan, cleanText };
  };

  const { thought, plan, cleanText } = parseAgentContent(message.text);

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
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="text-white font-black">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="bg-white/5 px-2 py-0.5 rounded-lg text-xs font-mono text-nexus-accent border border-white/5">{part.slice(1, -1)}</code>;
          }
          if (part.startsWith('[') && part.includes('](')) {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) return <a key={i} href={match[2]} target="_blank" className="text-nexus-accent hover:underline">{match[1]}</a>;
          }
          return <span key={i} className="text-gray-300/90">{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden border
          ${isUser ? 'bg-nexus-accent border-white/10 shadow-lg' : isError ? 'bg-red-500/20 border-red-500/30' : 'bg-nexus-900 border-white/5 shadow-xl'}
        `}>
          {isUser ? <div className="text-black"><UserIcon /></div> : <div className="text-white">{plan ? <AgentIcon /> : <RobotIcon />}</div>}
        </div>

        <div className={`
          relative px-6 py-5 rounded-[2rem] shadow-2xl border transition-all duration-300
          ${isUser ? 'bg-nexus-accent text-gray-950 rounded-tr-sm border-transparent' : 'bg-nexus-900/60 text-gray-100 rounded-tl-sm border-white/5 backdrop-blur-3xl'}
          ${plan ? 'ring-1 ring-nexus-purple/30' : ''}
        `}>
          <div className="flex justify-between items-center mb-4">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isUser ? 'text-black/50' : 'text-gray-600'}`}>
              {isUser ? 'Neural_Signal' : plan ? 'Agent_Execution' : 'Nexus_Response'}
            </span>
            {!isUser && !isError && (
              <button onClick={toggleSpeech} disabled={isLoadingAudio} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-600 hover:text-white transition-colors">
                {isLoadingAudio ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin block"></span> : isSpeaking ? <StopIcon /> : <SpeakerIcon />}
              </button>
            )}
          </div>

          {plan && (
             <div className="mb-6 space-y-3">
                <div className="flex items-center gap-2 text-nexus-purple text-[10px] font-black uppercase tracking-widest border-b border-nexus-purple/10 pb-2">
                   <ActivityIcon /> Operational_Mission_Plan
                </div>
                <div className="grid grid-cols-1 gap-2">
                   {plan.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-nexus-purple/5 border border-nexus-purple/10 rounded-2xl group animate-in slide-in-from-left-2" style={{ animationDelay: `${idx * 100}ms` }}>
                         <div className="w-5 h-5 flex-shrink-0 rounded-full bg-nexus-purple/20 text-nexus-purple flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                         <div className="text-xs text-gray-400 font-medium py-0.5 leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</div>
                      </div>
                   ))}
                </div>
             </div>
          )}
          
          {thought && (
            <div className="mb-4 overflow-hidden rounded-2xl border border-white/5 bg-black/20">
              <button onClick={() => setShowThought(!showThought)} className="w-full flex items-center justify-between px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-nexus-accent transition-colors">
                <div className="flex items-center gap-2"><BrainIcon /> Neural_Analysis_Chain</div>
                <div className={`transition-transform duration-300 ${showThought ? 'rotate-180' : ''}`}><ChevronDownIcon /></div>
              </button>
              {showThought && <div className="px-4 pb-4 animate-in slide-in-from-top-2 text-[10px] text-gray-500 font-mono leading-relaxed italic border-t border-white/5 pt-3">{thought}</div>}
            </div>
          )}

          <div className="text-sm md:text-base selection:bg-nexus-accent/40 leading-relaxed">
            {formatText(cleanText || (isError ? message.text : ""))}
          </div>

          {message.groundingMetadata?.groundingChunks && (
            <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
               {message.groundingMetadata.groundingChunks.map((chunk, idx) => chunk.web && (
                 <a key={idx} href={chunk.web.uri} target="_blank" className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-nexus-accent/30 transition-all group">
                    <div className="p-2 rounded-xl bg-nexus-accent/10 text-nexus-accent border border-white/5 group-hover:scale-110 transition-transform"><LinkIcon /></div>
                    <div className="flex-1 min-w-0">
                       <div className="text-xs font-bold text-gray-300 truncate">{chunk.web.title}</div>
                       <div className="text-[9px] text-gray-600 truncate font-mono uppercase tracking-tighter mt-0.5">{new URL(chunk.web.uri).hostname}</div>
                    </div>
                 </a>
               ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
