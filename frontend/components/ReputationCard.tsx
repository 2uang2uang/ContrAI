'use client';

import React from 'react';
import { Shield, Vote, Coins, Activity, TrendingUp } from 'lucide-react';
import { ReputationData } from '@/types';

interface ReputationCardProps {
  data: ReputationData;
}

export const ReputationCard: React.FC<ReputationCardProps> = ({ data }) => {
  // Calculate display values from raw data
  const score = data.score || 0;
  const rank = data.rank || 'Unranked';
  const level = data.level || 'Newcomer';
  
  // Identity level
  const identityLevel = data.identity?.isVerified 
    ? `Verified (${data.identity.judgements} judgements)` 
    : data.identity?.hasIdentity 
    ? 'Has Identity' 
    : 'No Identity';
  
  // Governance rating
  const governanceRating = data.governance?.votesCount > 0 
    ? `${data.governance.votesCount} votes` 
    : 'No participation';
  
  // Staking status
  const stakedDOT = data.staking?.totalStaked 
    ? (parseFloat(data.staking.totalStaked) / 1e10).toFixed(2) 
    : '0';
  const stakingStatus = parseFloat(stakedDOT) > 0 
    ? `${stakedDOT} DOT` 
    : 'Not staking';
  
  // Activity level
  const activityLevel = data.activity?.transactionCount 
    ? `${data.activity.transactionCount} transactions` 
    : 'No activity';

  return (
    <div className="mt-4 mb-2 w-full max-w-2xl bg-white dark:bg-grey-900 border border-grey-200 dark:border-grey-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm">
      {/* Header gradient line */}
      <div className="h-1 w-full bg-gradient-to-r from-pink-accent via-orange-500 to-yellow-500" />
      
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-8">
          {/* Main Score */}
          <div className="flex-1 w-full md:w-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-grey-500 dark:text-grey-400 uppercase tracking-widest">Reputation Score</h3>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-400/20">{rank}</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-bold text-grey-900 dark:text-grey-50 font-mono tracking-tighter">{score}</span>
              <span className="text-lg text-grey-400 dark:text-grey-500 mb-1.5 font-mono">/100</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 w-full bg-grey-100 dark:bg-grey-800 rounded-full mt-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-accent to-orange-500 rounded-full" 
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
          
          {/* Quick Stat */}
          <div className="hidden md:block w-px h-16 bg-grey-200 dark:bg-grey-800" />
          
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2 text-grey-700 dark:text-grey-200">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold">{level}</span>
             </div>
             <p className="text-xs text-grey-500 dark:text-grey-400">Current level</p>
          </div>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-grey-50 dark:bg-grey-950 border border-grey-200 dark:border-grey-800 rounded-xl p-4 hover:border-grey-300 dark:hover:border-grey-700 transition-colors group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-grey-500 dark:text-grey-400 mb-1">Identity</p>
                <p className="font-mono text-sm text-grey-900 dark:text-grey-50">{identityLevel}</p>
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
                <p className="font-mono text-sm text-grey-900 dark:text-grey-50">{governanceRating}</p>
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
                <p className="font-mono text-sm text-grey-900 dark:text-grey-50">{stakingStatus}</p>
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
                <p className="font-mono text-sm text-grey-900 dark:text-grey-50">{activityLevel}</p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                <Activity className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
