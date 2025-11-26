import React from 'react';
import { ChatMessage, Role } from '../types';
import { RobotIcon, UserIcon } from './Icon';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const isError = message.isError;

  // Basic formatting for code blocks and bold text (lightweight solution)
  const formatText = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const content = part.slice(3, -3).replace(/^[a-z]+\n/, ''); // Strip lang identifier roughly
        return (
          <pre key={index} className="bg-nexus-900 p-3 rounded-md overflow-x-auto my-2 border border-nexus-700">
            <code className="text-sm font-mono text-gray-300">{content}</code>
          </pre>
        );
      }
      return <span key={index} className="whitespace-pre-wrap leading-relaxed">{part}</span>;
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser ? 'bg-nexus-accent' : isError ? 'bg-red-600' : 'bg-emerald-600'}
          shadow-lg
        `}>
          {isUser ? <UserIcon /> : <RobotIcon />}
        </div>

        {/* Bubble */}
        <div className={`
          relative px-4 py-3 rounded-2xl shadow-sm border
          ${isUser 
            ? 'bg-nexus-700 text-white rounded-tr-sm border-transparent' 
            : isError 
              ? 'bg-red-900/20 text-red-200 border-red-500/50 rounded-tl-sm' 
              : 'bg-nexus-800 text-gray-100 rounded-tl-sm border-nexus-700'}
        `}>
          {/* Label */}
          <div className="text-xs font-semibold opacity-50 mb-1 flex justify-between">
            <span>{isUser ? 'You' : 'Nexus'}</span>
            {isError && <span className="text-red-400 ml-2">ERROR</span>}
          </div>
          
          <div className="text-sm md:text-base">
            {formatText(message.text)}
          </div>

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