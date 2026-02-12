'use client';

import React from 'react';
import { Hexagon, Sun, Moon } from 'lucide-react';

interface NavbarProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isDarkMode, toggleTheme }) => {
  return (
    <nav className="h-16 border-b border-grey-200 dark:border-grey-800 bg-grey-50/80 dark:bg-grey-950/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Hexagon className="w-8 h-8 text-pink-accent fill-pink-accent/20" strokeWidth={1.5} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-grey-900 dark:text-grey-50">P</span>
          </div>
        </div>
        <span className="font-semibold text-lg tracking-tight text-grey-900 dark:text-grey-50">
          Polka<span className="text-pink-accent">Rep</span>
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-900/50">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Polkadot Mainnet
          <span className="text-grey-500 dark:text-grey-400 ml-1">#18,293,102</span>
        </div>

        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-grey-200 dark:hover:bg-grey-800 text-grey-600 dark:text-grey-50 transition-colors"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Luno Kit ConnectButton sẽ được thêm vào đây */}
      </div>
    </nav>
  );
};
