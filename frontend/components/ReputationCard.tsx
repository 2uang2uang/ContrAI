'use client';

import React from 'react';
import { Shield, Vote, Coins, Activity, TrendingUp, Brain, AlertTriangle, Sparkles } from 'lucide-react';
import { ReputationData } from '@/types';

interface ReputationCardProps {
  data: any; // Sử dụng any tạm thời để linh hoạt nhận dữ liệu mới từ API
}

export const ReputationCard: React.FC<ReputationCardProps> = ({ data }) => {
  // Bóc tách dữ liệu linh hoạt (hỗ trợ cả cấu trúc cũ và cấu trúc AI mới)
  const scoreData = data.score?.totalScore !== undefined ? data.score : data;
  const onChainData = data.onChainData || data;

  const score = scoreData.totalScore ?? scoreData.score ?? 0;
  const rank = scoreData.rank || 'Unranked';
  const level = scoreData.level || 'Newcomer';
  
  // Lấy điểm thành phần mới từ AI (nếu có)
  const breakdown = scoreData.breakdown || {};
  const behavioralScore = breakdown.behavioral || 0;
  const sybilRisk = scoreData.sybilRisk;
  
  // Identity level
  const identityLevel = onChainData.identity?.isVerified 
    ? `Verified (${onChainData.identity.judgements})` 
    : onChainData.identity?.hasIdentity 
    ? 'Has Identity' 
    : 'No Identity';
  
  // Governance rating
  const governanceRating = onChainData.governance?.votesCount > 0 
    ? `${onChainData.governance.votesCount} votes` 
    : 'No participation';
  
  // Staking status
  const stakedDOT = onChainData.staking?.totalStaked 
    ? (parseFloat(onChainData.staking.totalStaked) / 1e10).toFixed(2) 
    : '0';
  const stakingStatus = parseFloat(stakedDOT) > 0 
    ? `${stakedDOT} DOT` 
    : 'Not staking';
  
  // Activity level
  const activityLevel = onChainData.activity?.transactionCount 
    ? `${onChainData.activity.transactionCount} txs` 
    : 'No activity';

  return (
    <div className="mt-4 mb-2 w-full max-w-2xl bg-white dark:bg-grey-900 border border-grey-200 dark:border-grey-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm">
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
            
            <div className="h-2 w-full bg-grey-100 dark:bg-grey-800 rounded-full mt-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-accent to-orange-500 rounded-full transition-all duration-1000" 
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
          
          <div className="hidden md:block w-px h-16 bg-grey-200 dark:bg-grey-800" />
          
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2 text-grey-700 dark:text-grey-200">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold">{level}</span>
             </div>
             <p className="text-xs text-grey-500 dark:text-grey-400">Current level</p>
          </div>
        </div>

        {/* CẢNH BÁO SYBIL RISK */}
        {sybilRisk && sybilRisk.score > 0.7 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-500 rounded-xl flex flex-col gap-2">
            <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Cảnh báo Rủi ro Sybil ({(sybilRisk.score * 100).toFixed(0)}%)
            </h4>
            <ul className="list-disc ml-6 space-y-1 text-xs text-red-700 dark:text-red-400">
              {sybilRisk.flaggedPatterns.map((pattern: string, idx: number) => (
                <li key={idx}>{pattern}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Grid Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-grey-50 dark:bg-grey-950 border border-grey-200 dark:border-grey-800 rounded-xl p-4 hover:border-grey-300 dark:hover:border-grey-700 transition-colors group">
            <div className="flex items-start justify-between">
              <div className="overflow-hidden">
                <p className="text-xs text-grey-500 dark:text-grey-400 mb-1">Identity</p>
                <p className="font-mono text-xs font-semibold text-grey-900 dark:text-grey-50 truncate">{identityLevel}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors shrink-0">
                <Shield className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-grey-50 dark:bg-grey-950 border border-grey-200 dark:border-grey-800 rounded-xl p-4 hover:border-grey-300 dark:hover:border-grey-700 transition-colors group">
            <div className="flex items-start justify-between">
              <div className="overflow-hidden">
                <p className="text-xs text-grey-500 dark:text-grey-400 mb-1">Governance</p>
                <p className="font-mono text-xs font-semibold text-grey-900 dark:text-grey-50 truncate">{governanceRating}</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors shrink-0">
                <Vote className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-grey-50 dark:bg-grey-950 border border-grey-200 dark:border-grey-800 rounded-xl p-4 hover:border-grey-300 dark:hover:border-grey-700 transition-colors group">
            <div className="flex items-start justify-between">
              <div className="overflow-hidden">
                <p className="text-xs text-grey-500 dark:text-grey-400 mb-1">Staking</p>
                <p className="font-mono text-xs font-semibold text-grey-900 dark:text-grey-50 truncate">{stakingStatus}</p>
              </div>
              <div className="p-2 bg-pink-accent/10 rounded-lg group-hover:bg-pink-accent/20 transition-colors shrink-0">
                <Coins className="w-4 h-4 text-pink-accent" />
              </div>
            </div>
          </div>

          <div className="bg-grey-50 dark:bg-grey-950 border border-grey-200 dark:border-grey-800 rounded-xl p-4 hover:border-grey-300 dark:hover:border-grey-700 transition-colors group">
            <div className="flex items-start justify-between">
              <div className="overflow-hidden">
                <p className="text-xs text-grey-500 dark:text-grey-400 mb-1">Activity</p>
                <p className="font-mono text-xs font-semibold text-grey-900 dark:text-grey-50 truncate">{activityLevel}</p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors shrink-0">
                <Activity className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              </div>
            </div>
          </div>

          {/* AI BEHAVIORAL BLOCK */}
          <div className="bg-grey-50 dark:bg-grey-950 border border-teal-200 dark:border-teal-800/50 rounded-xl p-4 hover:border-teal-400 dark:hover:border-teal-600 transition-colors group col-span-2 md:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mb-1">AI Behavioral Pattern</p>
                <p className="font-mono text-xl font-bold text-grey-900 dark:text-grey-50">
                  {behavioralScore} <span className="text-sm font-normal text-grey-500">/ 20 Pts</span>
                </p>
              </div>
              <div className="p-2 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
                <Brain className="w-5 h-5 text-teal-500 dark:text-teal-400" />
              </div>
            </div>
          </div>
        </div>

        {/* AI INSIGHTS & ANALYSIS */}
        {(scoreData.analysis || scoreData.insights) && (
          <div className="flex flex-col gap-3">
            {scoreData.analysis && (
              <div className="p-4 bg-[#0D1117] border border-grey-800 rounded-xl">
                <h4 className="text-xs font-semibold text-pink-accent mb-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> On-chain Analysis
                </h4>
                <p className="text-xs text-grey-300 leading-relaxed">
                  {scoreData.analysis}
                </p>
              </div>
            )}
            
            {scoreData.insights && (
              <div className="p-4 bg-purple-900/10 border border-purple-800/30 rounded-xl">
                <h4 className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-2">
                  <Brain className="w-3 h-3" /> Deep Insights
                </h4>
                <p className="text-xs text-purple-300/80 leading-relaxed">
                  {scoreData.insights}
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};