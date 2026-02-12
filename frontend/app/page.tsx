'use client';

import React, { useState, useEffect } from 'react';
import { LandingPage } from '@/components/LandingPage';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLaunch = () => {
    router.push('/dashboard');
  };

  return (
    <LandingPage 
      onLaunch={handleLaunch} 
      isDarkMode={isDarkMode} 
      toggleTheme={toggleTheme} 
    />
  );
}
