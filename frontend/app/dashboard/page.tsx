'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { Send, Menu, Sparkles, TrendingUp, Vote, Shield, LayoutDashboard } from 'lucide-react';
import { ChatMessage, ChatSession } from '@/types';
import { ReputationScoreDisplay } from '@/components/ReputationScoreDisplay';
import { useAccount } from '@luno-kit/react';

const MOCK_SESSIONS: ChatSession[] = [
  { id: '1', title: 'Governance Analysis', timestamp: new Date(), preview: 'Vote #192 participation details...' },
  { id: '2', title: 'Staking Rewards', timestamp: new Date(), preview: 'Validator performance check...' },
  { id: '3', title: 'Identity Verification', timestamp: new Date(), preview: 'On-chain registrar status...' },
];

const SUGGESTIONS = [
  { 
    label: 'My Reputation', 
    icon: Shield, 
    query: 'Show my reputation status and score',
    action: 'calculate-reputation' // Action type
  },
  { 
    label: 'Governance', 
    icon: Vote, 
    query: 'What are the active referenda?',
    action: 'show-governance'
  },
  { 
    label: 'Staking', 
    icon: TrendingUp, 
    query: 'Analyze my staking rewards',
    action: 'show-staking'
  },
  { 
    label: 'Overview', 
    icon: LayoutDashboard, 
    query: 'Give me a summary of my account',
    action: 'show-overview'
  },
];

export default function Dashboard() {
  const { account } = useAccount();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showReputationScore, setShowReputationScore] = useState(false);
  const [testAddress, setTestAddress] = useState('');
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleSendMessage = async (text: string, isReputationQuery = false) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

      // Sử dụng testAddress nếu có, nếu không thì dùng account.address
      const addressToUse = testAddress.trim() || account?.address;

      if (!addressToUse) {
        throw new Error('Please connect your wallet or enter a test address');
      }

      // Nếu là reputation query và có wallet connected
      if (isReputationQuery && addressToUse) {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: addressToUse,
            query: text,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response from backend');
        }

        const data = await response.json();

        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: data.response,
          data: data.onChainData,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        // Regular chat - cũng gọi backend
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: addressToUse,
            query: text,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response from backend');
        }

        const data = await response.json();

        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: data.response,
          data: data.onChainData,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: error instanceof Error ? error.message : "I'm having trouble connecting to the network. Please try again later.",
          timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowReputationScore(false);
    setSidebarOpen(false);
  };

  const handleSuggestionClick = async (suggestion: typeof SUGGESTIONS[0]) => {
    const isReputationQuery = suggestion.action === 'calculate-reputation';
    await handleSendMessage(suggestion.query, isReputationQuery);
  };

  return (
    <div className="min-h-screen bg-grey-50 dark:bg-grey-950 text-grey-900 dark:text-grey-50 font-sans flex flex-col overflow-hidden transition-colors duration-300">
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      <div className="flex flex-1 relative overflow-hidden">
        {sidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-30 lg:hidden"
                onClick={() => setSidebarOpen(false)}
            />
        )}

        <Sidebar 
          sessions={MOCK_SESSIONS} 
          isOpen={sidebarOpen}
          onNewChat={handleNewChat}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 flex flex-col relative w-full h-[calc(100vh-64px)]">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-grey-200 dark:border-grey-800 bg-white/50 dark:bg-grey-950/40 backdrop-blur-sm z-20">
                <button 
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 -ml-2 text-grey-500 dark:text-grey-400 hover:text-grey-900 dark:hover:text-grey-50"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center text-sm font-mono text-grey-500 dark:text-grey-400">
                    <span className="hover:text-grey-900 dark:hover:text-grey-50 cursor-pointer transition-colors">Dashboard</span>
                    <span className="mx-2">/</span>
                    <span className="text-pink-accent bg-pink-accent/10 px-2 py-0.5 rounded border border-pink-accent/20">Interactive Reputation Assistant</span>
                </div>
            </div>

            <ChatInterface messages={messages} isLoading={isLoading} />

            {/* Reputation Score Display - hiển thị khi showReputationScore = true */}
            {showReputationScore && messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center p-6">
                <ReputationScoreDisplay />
              </div>
            )}

            

            <div className="p-4 sm:p-6 bg-grey-50 dark:bg-grey-950 border-t border-grey-200 dark:border-grey-800 z-20 transition-colors duration-300">
                <div className="max-w-4xl mx-auto space-y-4">
                    {/* Test Address Input */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">🧪 TEST MODE</span>
                        </div>
                        <input
                            type="text"
                            value={testAddress}
                            onChange={(e) => setTestAddress(e.target.value)}
                            placeholder="Nhập địa chỉ ví để test (để trống = dùng ví đã kết nối)"
                            className="w-full bg-white dark:bg-grey-900 text-grey-900 dark:text-grey-50 placeholder-grey-400 dark:placeholder-grey-500 px-3 py-2 rounded-lg border border-yellow-300 dark:border-yellow-700 focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 text-xs font-mono"
                        />
                        {testAddress && (
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-yellow-700 dark:text-yellow-400">
                                    Đang test với: {testAddress.slice(0, 8)}...{testAddress.slice(-6)}
                                </span>
                                <button
                                    onClick={() => setTestAddress('')}
                                    className="text-xs text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 underline"
                                >
                                    Xóa
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-accent to-orange-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                        <div className="relative flex items-center bg-white dark:bg-grey-900 rounded-xl border border-grey-200 dark:border-grey-800 focus-within:border-grey-300 dark:focus-within:border-grey-700 transition-colors shadow-sm">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                                placeholder="Ask about your on-chain reputation..."
                                className="w-full bg-transparent text-grey-900 dark:text-grey-50 placeholder-grey-400 dark:placeholder-grey-500 px-4 py-4 focus:outline-none text-sm sm:text-base font-medium"
                                disabled={isLoading}
                            />
                            <div className="pr-2">
                                <button 
                                    onClick={() => handleSendMessage(input)}
                                    disabled={!input.trim() || isLoading}
                                    className="p-2.5 rounded-lg bg-grey-900 dark:bg-grey-50 text-white dark:text-grey-900 hover:bg-grey-700 dark:hover:bg-grey-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-linear">
                        {SUGGESTIONS.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-grey-900 border border-grey-200 dark:border-grey-800 hover:border-pink-accent/50 hover:bg-grey-100 dark:hover:bg-grey-800 transition-all whitespace-nowrap group shadow-sm"
                            >
                                <suggestion.icon className="w-3.5 h-3.5 text-grey-400 dark:text-grey-500 group-hover:text-pink-accent transition-colors" />
                                <span className="text-xs font-medium text-grey-600 dark:text-grey-300 group-hover:text-grey-900 dark:group-hover:text-grey-50">{suggestion.label}</span>
                            </button>
                        ))}
                    </div>
                    
                    <div className="text-center">
                        <p className="text-[10px] text-grey-400 dark:text-grey-500 font-mono">
                            Powered by Gemini 3 Flash • Polkadot Ecosystem Data
                        </p>
                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
