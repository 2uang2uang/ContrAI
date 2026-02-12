'use client';

import React from 'react';
import { MessageSquarePlus, MessageSquare, Bookmark, ChevronRight } from 'lucide-react';
import { ChatSession } from '@/types';

interface SidebarProps {
  sessions: ChatSession[];
  isOpen: boolean;
  onNewChat: () => void;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ sessions, isOpen, onNewChat }) => {
  return (
    <aside 
      className={`
        fixed left-0 top-16 bottom-0 z-40 bg-white dark:bg-grey-950 border-r border-grey-200 dark:border-grey-800 w-72 
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:w-72 flex flex-col
      `}
    >
      {/* User Profile Summary */}
      <div className="p-4 border-b border-grey-200 dark:border-grey-800">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-grey-100 dark:bg-grey-900 border border-grey-200 dark:border-grey-800 cursor-pointer hover:border-grey-300 dark:hover:border-grey-700 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-accent to-orange-500 flex items-center justify-center text-white font-bold text-xs">
            15F
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-grey-900 dark:text-grey-50 truncate font-mono">15F...Xy92</p>
            <p className="text-xs text-grey-500 dark:text-grey-400">Free Plan</p>
          </div>
          <ChevronRight className="w-4 h-4 text-grey-400 dark:text-grey-500" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-2 mx-2 mt-4 bg-grey-100 dark:bg-grey-900 rounded-lg p-1 border border-grey-200 dark:border-grey-800">
        <button className="flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium bg-white dark:bg-grey-800 text-grey-900 dark:text-grey-50 rounded shadow-sm">
          <MessageSquare className="w-3.5 h-3.5" />
          Chats
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-grey-500 dark:text-grey-400 hover:text-grey-900 dark:hover:text-grey-50 transition-colors">
          <Bookmark className="w-3.5 h-3.5" />
          Saved
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        <div className="px-2 pb-2 text-[10px] font-semibold text-grey-400 dark:text-grey-500 uppercase tracking-wider">Recent</div>
        {sessions.map((session) => (
          <button 
            key={session.id}
            className="w-full text-left p-3 rounded-lg hover:bg-grey-100 dark:hover:bg-grey-900 group transition-colors flex items-start gap-3"
          >
            <MessageSquare className="w-4 h-4 text-grey-400 dark:text-grey-500 mt-0.5 group-hover:text-pink-accent transition-colors" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-grey-900 dark:text-grey-50 truncate">{session.title}</span>
              </div>
              <p className="text-xs text-grey-500 dark:text-grey-400 truncate mt-0.5">{session.preview}</p>
            </div>
          </button>
        ))}
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-t border-grey-200 dark:border-grey-800">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-pink-accent hover:bg-pink-accent/90 text-white py-3 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </button>
      </div>
    </aside>
  );
};
