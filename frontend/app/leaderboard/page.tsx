"use client";

import React, { useState, useEffect } from 'react';
import Leaderboard from '../../components/Leaderboard';
import { Navbar } from '@/components/Navbar';

export default function LeaderboardPage() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="min-h-screen bg-grey-50 dark:bg-grey-950 text-grey-900 dark:text-white selection:bg-brand-pink/30 transition-colors duration-300">
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <Leaderboard />
    </div>
  );
}
