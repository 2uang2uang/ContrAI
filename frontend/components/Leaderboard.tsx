"use client";
import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Shield, Award, Hexagon, Loader2, RefreshCw } from 'lucide-react';
import { getLeaderboard, LeaderboardEntry } from '@/lib/supabase';

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLeaderboard(10);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="container mx-auto px-6 lg:px-12 py-16">
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
          <div className="flex items-center gap-3">
            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              className="flex items-center gap-2 bg-white dark:bg-grey-900 px-4 py-2 rounded-lg border border-grey-200 dark:border-grey-800 shadow-sm hover:bg-grey-50 dark:hover:bg-grey-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-grey-600 dark:text-grey-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium text-grey-900 dark:text-white hidden sm:inline">Refresh</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-grey-900 px-4 py-2 rounded-lg border border-grey-200 dark:border-grey-800 shadow-sm">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-grey-900 dark:text-white">Global Ranking</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-grey-900 rounded-2xl border border-grey-200 dark:border-grey-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-brand-pink animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Trophy className="w-12 h-12 text-grey-300 dark:text-grey-700 mb-4" />
              <p className="text-grey-500 dark:text-grey-400">No leaderboard data available yet</p>
              <p className="text-xs text-grey-400 dark:text-grey-500 mt-2">Calculate some reputation scores to see rankings</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-grey-50 dark:bg-grey-950/50 border-b border-grey-200 dark:border-grey-800">
                    <th className="py-4 px-6 text-xs font-semibold text-grey-500 dark:text-grey-400 uppercase tracking-wider">Rank</th>
                    <th className="py-4 px-6 text-xs font-semibold text-grey-500 dark:text-grey-400 uppercase tracking-wider">Participant</th>
                    <th className="py-4 px-6 text-xs font-semibold text-grey-500 dark:text-grey-400 uppercase tracking-wider">Score</th>
                    <th className="py-4 px-6 text-xs font-semibold text-grey-500 dark:text-grey-400 uppercase tracking-wider">Level</th>
                    <th className="py-4 px-6 text-xs font-semibold text-grey-500 dark:text-grey-400 uppercase tracking-wider">Badges</th>
                    <th className="py-4 px-6 text-xs font-semibold text-grey-500 dark:text-grey-400 uppercase tracking-wider text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grey-200 dark:divide-grey-800">
                  {leaderboard.map((entry) => (
                    <tr 
                      key={entry.address} 
                      className="hover:bg-grey-50 dark:hover:bg-grey-800/50 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-grey-100 dark:bg-grey-800 text-sm font-bold text-grey-900 dark:text-white">
                          {entry.position === 1 ? <Trophy className="w-4 h-4 text-yellow-500" /> : 
                           entry.position === 2 ? <Trophy className="w-4 h-4 text-grey-400" /> : 
                           entry.position === 3 ? <Trophy className="w-4 h-4 text-amber-600" /> : 
                           entry.position}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-pink to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {entry.address.substring(0, 2)}
                          </div>
                          <span className="font-mono text-sm font-medium text-grey-900 dark:text-white group-hover:text-brand-pink transition-colors">
                            {entry.address.length > 20 
                              ? `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`
                              : entry.address
                            }
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Hexagon className="w-4 h-4 text-brand-pink fill-brand-pink/20" />
                          <span className="font-bold text-grey-900 dark:text-white">{entry.total_score}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-pink/10 text-brand-pink border border-brand-pink/20">
                          {entry.level}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-2">
                          {entry.badges && entry.badges.length > 0 ? (
                            entry.badges.slice(0, 2).map(badge => (
                              <span key={badge} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-grey-100 dark:bg-grey-800 text-grey-700 dark:text-grey-300 border border-grey-200 dark:border-grey-700">
                                <Award className="w-3 h-3" />
                                {badge}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-grey-400 dark:text-grey-600">-</span>
                          )}
                          {entry.badges && entry.badges.length > 2 && (
                            <span className="text-xs text-grey-400 dark:text-grey-500">+{entry.badges.length - 2}</span>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
