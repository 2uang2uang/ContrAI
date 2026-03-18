"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import {
    Send,
    Menu,
    Sparkles,
    TrendingUp,
    Vote,
    Shield,
    LayoutDashboard,
} from "lucide-react";
import { ChatMessage } from "@/types";
import { useAccount } from "wagmi";

const SUGGESTIONS = [
    {
        label: "My Reputation",
        icon: Shield,
        query: "Show my reputation status and score",
        action: "calculate-reputation",
    },
    {
        label: "Governance",
        icon: Vote,
        query: "What are the active referenda?",
        action: "show-governance",
    },
    {
        label: "Staking",
        icon: TrendingUp,
        query: "Analyze my staking rewards",
        action: "show-staking",
    },
    {
        label: "Overview",
        icon: LayoutDashboard,
        query: "Give me a summary of my account",
        action: "show-overview",
    },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
    const { address } = useAccount();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [showReputationScore, setShowReputationScore] = useState(false);
    const [testAddress, setTestAddress] = useState("");
    
    const [sessions, setSessions] = useState<any[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const fetchSessions = useCallback(async (walletAddress: string) => {
        try {
            const response = await fetch(`${API_URL}/api/chat/sessions/${walletAddress}`);
            if (response.ok) {
                const sessionsData = await response.json();
                const formattedSessions = sessionsData.map((s: any) => ({
                    id: s.id,
                    title: s.title,
                    timestamp: new Date(s.updated_at),
                    preview: ""
                }));
                setSessions(formattedSessions);
            }
        } catch {}
    }, []);

    useEffect(() => {
        const addressToUse = testAddress.trim() || address;
        if (addressToUse) {
            fetchSessions(addressToUse);
        }
    }, [address, testAddress, fetchSessions]);

    const loadSessionMessages = async (sessionId: string) => {
        setCurrentSessionId(sessionId);
        setIsLoading(true);
        setMessages([]);
        
        try {
            const response = await fetch(`${API_URL}/api/chat/messages/${sessionId}/messages`);
            if (response.ok) {
                const dbMessages = await response.json();
                const formattedMessages = dbMessages.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    text: m.content,
                    data: m.metadata && Object.keys(m.metadata).length > 0 ? m.metadata : undefined,
                    timestamp: new Date(m.created_at)
                }));
                setMessages(formattedMessages);
            }
        } catch {} finally {
            setIsLoading(false);
            setSidebarOpen(false);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            text: text,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const addressToUse = testAddress.trim() || address;

            if (!addressToUse) {
                throw new Error("Please connect your wallet or enter a test address");
            }

            const response = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    address: addressToUse,
                    query: text,
                    sessionId: currentSessionId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response from backend");
            }

            const data = await response.json();

            if (data.sessionId && !currentSessionId) {
                setCurrentSessionId(data.sessionId);
                fetchSessions(addressToUse);
            }

            const botMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "model",
                text: data.response,
                data: data.onChainData,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "model",
                text: error instanceof Error
                        ? error.message
                        : "I'm having trouble connecting to the network. Please try again later.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setCurrentSessionId(null);
        setShowReputationScore(false);
        setSidebarOpen(false);
    };

    const handleSuggestionClick = async (suggestion: (typeof SUGGESTIONS)[0]) => {
        setShowReputationScore(false);
        await handleSendMessage(suggestion.query);
    };

    return (
        <div className="min-h-screen bg-grey-50 dark:bg-grey-950 text-grey-900 dark:text-grey-50 font-sans flex flex-col overflow-hidden transition-colors duration-300 pt-16">
            <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

            <div className="flex flex-1 relative overflow-hidden">
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <Sidebar
                    sessions={sessions}
                    isOpen={sidebarOpen}
                    onNewChat={handleNewChat}
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onSelectSession={loadSessionMessages}
                />

                <main className="flex-1 flex flex-col relative w-full lg:ml-72">
                
                    <div className="flex-1 overflow-y-auto pb-32">
                        <ChatInterface messages={messages} isLoading={isLoading} />
                    </div>
                    
                    <div className="fixed bottom-0 left-0 right-0 lg:left-72 p-4 sm:p-6 bg-grey-50/95 dark:bg-grey-950/95 backdrop-blur-md border-t border-grey-200 dark:border-grey-800 z-20 transition-colors duration-300">
                        <div className="max-w-4xl mx-auto space-y-4">
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-accent to-orange-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                                <div className="relative flex items-center bg-white dark:bg-grey-900 rounded-xl border border-grey-200 dark:border-grey-800 focus-within:border-grey-300 dark:focus-within:border-grey-700 transition-colors shadow-sm">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage(input)}
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
                                            {isLoading ? (
                                                <Sparkles className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
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
                                        <span className="text-xs font-medium text-grey-600 dark:text-grey-300 group-hover:text-grey-900 dark:group-hover:text-grey-50">
                                            {suggestion.label}
                                        </span>
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