"use client";
import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Shield, Award, Hexagon } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  address: string;
  score: number;
  trend: 'up' | 'down' | 'neutral';
  badges: string[];
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, address: '15F...Xy92', score: 985, trend: 'up', badges: ['Governance Whale', 'Early Adopter'] },
  { rank: 2, address: '12B...Zp11', score: 942, trend: 'up', badges: ['Active Voter'] },
  { rank: 3, address: '18C...Qw44', score: 890, trend: 'neutral', badges: ['Validator'] },
  { rank: 4, address: '19D...Er55', score: 875, trend: 'down', badges: [] },
  { rank: 5, address: '11A...Ty66', score: 850, trend: 'up', badges: ['Council Member'] },
  { rank: 6, address: '14E...Ui77', score: 820, trend: 'neutral', badges: ['Active Voter'] },
  { rank: 7, address: '17G...Op88', score: 795, trend: 'down', badges: [] },
  { rank: 8, address: '16H...As99', score: 780, trend: 'up', badges: ['Early Adopter'] },
  { rank: 9, address: '13I...Df00', score: 760, trend: 'neutral', badges: [] },
  { rank: 10, address: '10J...Gh11', score: 745, trend: 'up', badges: ['Validator'] },
];

const Leaderboard: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-grey-50 dark:bg-grey-950">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif text-grey-900 dark:text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-brand-pink" />
              Reputation Leaderboard
            </h1>
            <p className="text-grey-500 dark:text-grey-400 mt-2 font-sans">
              Top participants in the Polkadot ecosystem ranked by on-chain reputation score.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-grey-900 px-4 py-2 rounded-lg border border-grey-200 dark:border-grey-800 shadow-sm">
            <Shield className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium text-grey-900 dark:text-white">Global Ranking</span>
          </div>
        </div>

        <div className="bg-white dark:bg-grey-900 rounded-2xl border border-grey-200 dark:border-grey-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-grey-50 dark:bg-grey-950/50 border-b border-grey-200 dark:border-grey-800">
                  <th className="py-4 px-6 text-xs font-semibold text-grey-500 dark:text-grey-400 uppercase tracking-wider">Rank</th>
                  <th className="py-4 px-6 text-xs font-semibold text-grey-500 dark:text-grey-400 uppercase tracking-wider">Participant</th>
                  <th className="py-4 px-6 text-xs font-semibold text-grey-500 dark:text-grey-400 uppercase tracking-wider">Reputation Score</th>
                  <th className="py-4 px-6 text-xs font-semibold text-grey-500 dark:text-grey-400 uppercase tracking-wider">Badges</th>
                  <th className="py-4 px-6 text-xs font-semibold text-grey-500 dark:text-grey-400 uppercase tracking-wider text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-200 dark:divide-grey-800">
                {MOCK_LEADERBOARD.map((entry) => (
                  <tr 
                    key={entry.address} 
                    className="hover:bg-grey-50 dark:hover:bg-grey-800/50 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-grey-100 dark:bg-grey-800 text-sm font-bold text-grey-900 dark:text-white">
                        {entry.rank === 1 ? <Trophy className="w-4 h-4 text-yellow-500" /> : 
                         entry.rank === 2 ? <Trophy className="w-4 h-4 text-grey-400" /> : 
                         entry.rank === 3 ? <Trophy className="w-4 h-4 text-amber-600" /> : 
                         entry.rank}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-pink to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                          {entry.address.substring(0, 2)}
                        </div>
                        <span className="font-mono text-sm font-medium text-grey-900 dark:text-white group-hover:text-brand-pink transition-colors">
                          {entry.address}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Hexagon className="w-4 h-4 text-brand-pink fill-brand-pink/20" />
                        <span className="font-bold text-grey-900 dark:text-white">{entry.score}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-2">
                        {entry.badges.map(badge => (
                          <span key={badge} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-grey-100 dark:bg-grey-800 text-grey-700 dark:text-grey-300 border border-grey-200 dark:border-grey-700">
                            <Award className="w-3 h-3" />
                            {badge}
                          </span>
                        ))}
                        {entry.badges.length === 0 && (
                          <span className="text-xs text-grey-400 dark:text-grey-600">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end">
                        {entry.trend === 'up' && <TrendingUp className="w-5 h-5 text-emerald-500" />}
                        {entry.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
                        {entry.trend === 'neutral' && <Minus className="w-5 h-5 text-grey-400" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
