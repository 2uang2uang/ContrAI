'use client';

import React, { useRef, useEffect } from 'react';
import { Bot, User as UserIcon } from 'lucide-react';
import { ChatMessage } from '@/types';
import { ReputationCard } from './ReputationCard';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-12 py-8 space-y-8">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
            <div className="w-16 h-16 bg-pink-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-pink-accent/20">
                <Bot className="w-8 h-8 text-pink-accent" />
            </div>
            <h2 className="font-display text-2xl text-grey-900 dark:text-grey-50 mb-2">How can I help you today?</h2>
            <p className="text-grey-500 dark:text-grey-400 max-w-md">
                I can analyze your on-chain reputation, track governance participation, or visualize your staking history.
            </p>
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {/* Avatar */}
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
            ${message.role === 'user' 
              ? 'bg-grey-200 dark:bg-grey-800 text-grey-600 dark:text-grey-50' 
              : 'bg-gradient-to-br from-pink-accent to-orange-500 text-white shadow-lg'}
          `}>
            {message.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
          </div>

          {/* Message Content */}
          <div className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]`}>
            {message.role === 'user' ? (
                <div className="bg-white dark:bg-grey-800 text-grey-900 dark:text-grey-50 px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm border border-grey-200 dark:border-grey-800">
                   <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {message.text && (
                         <div className="text-grey-800 dark:text-grey-100 text-sm leading-relaxed whitespace-pre-wrap">
                            {message.text}
                        </div>
                    )}
                    
                    {message.data && (
                        <div className="animate-[slideUp_0.3s_ease-out]">
                             <ReputationCard data={message.data} />
                        </div>
                    )}
                </div>
            )}
             <div className={`text-[10px] text-grey-400 dark:text-grey-500 mt-1.5 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-accent to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Bot size={14} className="text-white" />
          </div>
          <div className="flex items-center gap-1 h-8">
            <div className="w-1.5 h-1.5 bg-grey-400 dark:text-grey-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 bg-grey-400 dark:text-grey-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 bg-grey-400 dark:text-grey-400 rounded-full animate-bounce" />
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};
