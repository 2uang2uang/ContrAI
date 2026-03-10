'use client';

import React, { useState } from 'react';
import { Shield, Vote, Coins, Activity, RefreshCw, Loader2, Sparkles, AlertTriangle, Brain } from 'lucide-react';
import { getReputationScore, ReputationScore } from '@/services/reputationService';
import { useAccount } from '@luno-kit/react';

export const ReputationScoreDisplay: React.FC = () => {
  const { account } = useAccount();
  const [score, setScore] = useState<ReputationScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = async () => {
    if (!account?.address) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reputationScore = await getReputationScore(account.address);
      setScore(reputationScore);
    } catch (err) {
      console.error('Error fetching reputation:', err);
      setError('Failed to fetch reputation score. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="w-full max-w-2xl bg-white dark:bg-grey-900 border border-grey-200 dark:border-grey-800 rounded-2xl p-8 text-center">
        <Shield className="w-12 h-12 text-grey-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-grey-900 dark:text-grey-50 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-sm text-grey-500 dark:text-grey-400">
          Connect your Polkadot wallet to view your reputation score
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {!score && !loading && (
        <div className="bg-white dark:bg-grey-900 border border-grey-200 dark:border-grey-800 rounded-2xl p-8 text-center">
          <Shield className="w-12 h-12 text-pink-accent mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-grey-900 dark:text-grey-50 mb-2">
            Calculate Your Reputation
          </h3>
          <p className="text-sm text-grey-500 dark:text-grey-400 mb-6">
            Analyze your on-chain activities to get your reputation score
          </p>
          <button
            onClick={fetchScore}
            className="inline-flex items-center gap-2 bg-pink-accent hover:bg-pink-accent/90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Calculate Score
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-grey-900 border border-grey-200 dark:border-grey-800 rounded-2xl p-8 text-center">
          <Loader2 className="w-12 h-12 text-pink-accent mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-grey-900 dark:text-grey-50 mb-2">
            Analyzing On-Chain Data...
          </h3>
          <p className="text-sm text-grey-500 dark:text-grey-400">
            Fetching your identity, governance, staking, and activity data
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchScore}
            className="mt-4 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try Again
          </button>
        </div>
      )}

      {score && !loading && (
        <div className="bg-white dark:bg-grey-900 border border-grey-200 dark:border-grey-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-pink-accent via-orange-500 to-yellow-500" />
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-grey-900 dark:text-grey-50">
                Your Reputation Score
              </h3>
              <button
                onClick={fetchScore}
                disabled={loading}
                className="p-2 hover:bg-grey-100 dark:hover:bg-grey-800 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 text-grey-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-8">
              <div className="flex-1 w-full md:w-auto">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-grey-500 dark:text-grey-400 uppercase tracking-widest">
                    Total Score
                  </h3>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-400/20">
                    {score.rank}
                  </span>
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold text-grey-900 dark:text-grey-50 font-mono tracking-tighter">
                    {score.totalScore}
                  </span>
                  <span className="text-lg text-grey-400 dark:text-grey-500 mb-1.5 font-mono">/100</span>
                </div>
                
                <div className="h-2 w-full bg-grey-100 dark:bg-grey-800 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-accent to-orange-500 rounded-full transition-all duration-500" 
                    style={{ width: `${score.totalScore}%` }}
                  />
                </div>
              </div>
              
              <div className="hidden md:block w-px h-16 bg-grey-200 dark:bg-grey-800" />
              
              <div className="flex flex-col items-center gap-2 px-6 py-4 bg-grey-50 dark:bg-grey-950 rounded-xl border border-grey-200 dark:border-grey-800">
                <span className="text-2xl font-bold text-pink-accent">{score.level}</span>
                <span className="text-xs text-grey-500 dark:text-grey-400">Level</span>
              </div>
            </div>

            {/* SYBIL WARNING BADGE */}
            {score.sybilRisk && score.sybilRisk.score > 0.7 && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-500 rounded-xl flex flex-col gap-2">
                <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Cảnh báo rủi ro Sybil / Bot ({(score.sybilRisk.score * 100).toFixed(0)}%)
                </h4>
                <ul className="list-disc ml-6 space-y-1 text-sm text-red-700 dark:text-red-400">
                  {score.sybilRisk.flaggedPatterns.map((pattern, idx) => (
                    <li key={idx}>{pattern}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Breakdown Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-grey-50 dark:bg-grey-950 border border-grey-200 dark:border-grey-800 rounded-xl p-4 hover:border-grey-300 dark:hover:border-grey-700 transition-colors group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-grey-500 dark:text-grey-400 mb-1">Identity</p>
                    <p className="font-mono text-xl font-bold text-grey-900 dark:text-grey-50">
                      {score.breakdown.identity}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                    <Shield className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-grey-50 dark:bg-grey-950 border border-grey-200 dark:border-grey-800 rounded-xl p-4 hover:border-grey-300 dark:hover:border-grey-700 transition-colors group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-grey-500 dark:text-grey-400 mb-1">Governance</p>
                    <p className="font-mono text-xl font-bold text-grey-900 dark:text-grey-50">
                      {score.breakdown.governance}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                    <Vote className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="bg-grey-50 dark:bg-grey-950 border border-grey-200 dark:border-grey-800 rounded-xl p-4 hover:border-grey-300 dark:hover:border-grey-700 transition-colors group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-grey-500 dark:text-grey-400 mb-1">Staking</p>
                    <p className="font-mono text-xl font-bold text-grey-900 dark:text-grey-50">
                      {score.breakdown.staking}
                    </p>
                  </div>
                  <div className="p-2 bg-pink-accent/10 rounded-lg group-hover:bg-pink-accent/20 transition-colors">
                    <Coins className="w-4 h-4 text-pink-accent" />
                  </div>
                </div>
              </div>

              <div className="bg-grey-50 dark:bg-grey-950 border border-grey-200 dark:border-grey-800 rounded-xl p-4 hover:border-grey-300 dark:hover:border-grey-700 transition-colors group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-grey-500 dark:text-grey-400 mb-1">Activity</p>
                    <p className="font-mono text-xl font-bold text-grey-900 dark:text-grey-50">
                      {score.breakdown.activity}
                    </p>
                  </div>
                  <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                    <Activity className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                  </div>
                </div>
              </div>

              {/* BEHAVIORAL SCORE CARD */}
              <div className="bg-grey-50 dark:bg-grey-950 border border-teal-200 dark:border-teal-800/50 rounded-xl p-4 hover:border-teal-400 dark:hover:border-teal-600 transition-colors group col-span-2 md:col-span-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mb-1">AI Behavioral Pattern</p>
                    <p className="font-mono text-xl font-bold text-grey-900 dark:text-grey-50">
                      {score.breakdown.behavioral} <span className="text-sm font-normal text-grey-500">Pts</span>
                    </p>
                  </div>
                  <div className="p-2 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
                    <Brain className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Analysis & Insights (Cyberpunk-ish Vibe) */}
            <div className="mt-6 flex flex-col gap-4">
              {score.analysis && (
                <div className="p-5 bg-[#0D1117] border border-grey-800 rounded-xl text-left">
                  <h4 className="text-sm font-semibold text-pink-accent mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    On-chain Analysis
                  </h4>
                  <p className="text-sm text-grey-300 font-mono leading-relaxed">
                    {`> ${score.analysis}`}
                  </p>
                </div>
              )}

              {score.insights && (
                <div className="p-5 bg-[#0D1117] border border-purple-800/50 rounded-xl text-left">
                  <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Deep Insights
                  </h4>
                  <p className="text-xs text-purple-200 font-mono leading-relaxed">
                    {`> ${score.insights}`}
                  </p>
                </div>
              )}
            </div>

            {/* Strengths & Improvements */}
            {(score.strengths || score.improvements) && (
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                {score.strengths && score.strengths.length > 0 && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300 mb-2">
                      ✨ Điểm mạnh
                    </h4>
                    <ul className="space-y-1">
                      {score.strengths.map((strength, idx) => (
                        <li key={idx} className="text-xs text-emerald-700 dark:text-emerald-400">
                          • {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {score.improvements && score.improvements.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      🎯 Cần cải thiện
                    </h4>
                    <ul className="space-y-1">
                      {score.improvements.map((improvement, idx) => (
                        <li key={idx} className="text-xs text-blue-700 dark:text-blue-400">
                          • {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};