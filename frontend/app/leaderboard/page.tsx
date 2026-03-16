import React from 'react';
import Leaderboard from '../../components/Leaderboard';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-grey-50 dark:bg-grey-950 text-grey-900 dark:text-white selection:bg-brand-pink/30">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <Leaderboard />
      </div>
    </div>
  );
}
