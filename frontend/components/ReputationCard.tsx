'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Vote, Coins, Activity, TrendingUp, Brain, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { getMintSignature, getReputationScore } from '@/services/reputationService';

interface ReputationCardProps {
  data: any; 
}

export const ReputationCard: React.FC<ReputationCardProps> = ({ data }) => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [reputationData, setReputationData] = useState(data);

  useEffect(() => {
    const fetchData = async () => {
      if (!data && address) {
        setLoading(true);
        try {
          const scoreResult = await getReputationScore(address);
          setReputationData(scoreResult);
        } catch {} finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [address, data]);

  const currentData = reputationData || data;
  if (!currentData) {
    if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-accent" /></div>;
    return null;
  }

  const scoreData = currentData.score?.totalScore !== undefined ? currentData.score : currentData;
  const onChainData = currentData.onChainData || currentData;

  const score = scoreData?.totalScore ?? scoreData?.score ?? 0;
  const rank = scoreData?.rank || 'Unranked';
  const level = scoreData?.level || 'Newcomer';
  
  const breakdown = scoreData?.breakdown || {};
  const behavioralScore = breakdown?.behavioral || 0;
  const sybilRisk = scoreData?.sybilRisk;
  
  const identityLevel = onChainData?.identity?.isVerified 
    ? `Verified (${onChainData?.identity?.judgements})` 
    : onChainData?.identity?.hasIdentity 
    ? 'Has Identity' 
    : 'No Identity';
  
  const governanceRating = onChainData?.governance?.votesCount > 0 
    ? `${onChainData.governance.votesCount} votes` 
    : 'No participation';
  
  const stakedDOT = onChainData?.staking?.totalStaked 
    ? (parseFloat(onChainData.staking.totalStaked) / 1e10).toFixed(2) 
    : '0';
  const stakingStatus = parseFloat(stakedDOT) > 0 
    ? `${stakedDOT} DOT` 
    : 'Not staking';
  
  const activityLevel = onChainData?.activity?.transactionCount 
    ? `${onChainData.activity.transactionCount} txs` 
    : 'No activity';

  const getTierFromScore = (totalScore: number): { name: string; value: number } => {
    if (totalScore >= 97) return { name: 'Diamond', value: 5 }; 
    if (totalScore >= 90) return { name: 'Gold', value: 4 };    
    if (totalScore >= 75) return { name: 'Silver', value: 3 };  
    if (totalScore >= 50) return { name: 'Bronze', value: 2 };  
    return { name: 'Stone', value: 1 };                         
  };

  const registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || ""; 
  const handleMint = async () => {
    if (!score || !address) return;
    setLoading(true);

    try {
      const ethereum = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const evmAddress = await signer.getAddress();

      const currentBlock = await provider.getBlockNumber();
      const compositePct = score * 100;

      // 1. Lấy chữ ký từ backend
      const { signature } = await getMintSignature(evmAddress, compositePct, currentBlock);

      const registryAbi = [
        "function submitScore(address wallet, uint256 compositePct, uint256 governancePct, uint256 economicPct, uint256 identityPct, uint256 socialPct, uint256 snapshotBlock, bytes signature) external"
      ];

      const registryContract = new ethers.Contract(registryAddress, registryAbi, signer);

      // 2. Thực thi giao dịch on-chain
      const tx = await registryContract.submitScore(
        evmAddress,
        compositePct,
        0, 0, 0, 0,
        currentBlock,
        signature
      );

      await tx.wait();
      alert("🎉 Congratulations! You have successfully verified your reputation score and minted your badge!");

    } catch (err: any) {
      alert(`Error: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 mb-2 w-full max-w-2xl bg-white dark:bg-grey-900 border border-grey-200 dark:border-grey-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-pink-accent via-orange-500 to-yellow-500" />
      
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-8">
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

        <div className="mb-6 p-4 bg-grey-50 dark:bg-grey-950 border border-grey-200 dark:border-grey-800 rounded-xl">
          <h4 className="text-sm font-semibold text-grey-900 dark:text-grey-50 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pink-accent" />
            Score Breakdown
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-grey-700 dark:text-grey-300">Identity</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-grey-200 dark:bg-grey-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${((breakdown?.identity || 0) / 25) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-semibold text-grey-900 dark:text-grey-50 w-8 text-right">
                  {breakdown?.identity || 0}
                </span>
                <span className="text-xs text-grey-500 w-6">/25</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vote className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-grey-700 dark:text-grey-300">Governance</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-grey-200 dark:bg-grey-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${((breakdown?.governance || 0) / 30) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-semibold text-grey-900 dark:text-grey-50 w-8 text-right">
                  {breakdown?.governance || 0}
                </span>
                <span className="text-xs text-grey-500 w-6">/30</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-pink-accent" />
                <span className="text-sm text-grey-700 dark:text-grey-300">Economic</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-grey-200 dark:bg-grey-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-pink-accent rounded-full transition-all duration-1000" 
                    style={{ width: `${((breakdown?.staking || breakdown?.economic || 0) / 25) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-semibold text-grey-900 dark:text-grey-50 w-8 text-right">
                  {breakdown?.staking || breakdown?.economic || 0}
                </span>
                <span className="text-xs text-grey-500 w-6">/25</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-grey-700 dark:text-grey-300">Activity</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-grey-200 dark:bg-grey-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${((breakdown?.activity || 0) / 20) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-semibold text-grey-900 dark:text-grey-50 w-8 text-right">
                  {breakdown?.activity || 0}
                </span>
                <span className="text-xs text-grey-500 w-6">/20</span>
              </div>
            </div>

            {behavioralScore > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-teal-500" />
                  <span className="text-sm text-grey-700 dark:text-grey-300">Behavioral</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-grey-200 dark:bg-grey-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${(behavioralScore / 20) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono font-semibold text-grey-900 dark:text-grey-50 w-8 text-right">
                    {behavioralScore}
                  </span>
                  <span className="text-xs text-grey-500 w-6">/20</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-grey-200 dark:border-grey-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-grey-900 dark:text-grey-50">Total Score</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono text-grey-900 dark:text-grey-50">{score}</span>
                <span className="text-sm text-grey-500">/100</span>
              </div>
            </div>
          </div>
        </div>

        {sybilRisk && sybilRisk.score > 0.3 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-500 rounded-xl flex flex-col gap-2">
            <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Sybil Risk Warning ({(sybilRisk.score * 100).toFixed(0)}%)
            </h4>
            <ul className="list-disc ml-6 space-y-1 text-xs text-red-700 dark:text-red-400">
              {sybilRisk.flaggedPatterns?.map((pattern: string, idx: number) => (
                <li key={idx}>{pattern}</li>
              ))}
            </ul>
          </div>
        )}

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

        {(scoreData?.analysis || scoreData?.insights || scoreData?.strengths || scoreData?.improvements) && (
          <div className="flex flex-col gap-3">
            {scoreData?.analysis && (
              <div className="p-4 bg-[#0D1117] border border-grey-800 rounded-xl">
                <h4 className="text-xs font-semibold text-pink-accent mb-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> On-chain Analysis
                </h4>
                <p className="text-xs text-grey-300 leading-relaxed">
                  {scoreData.analysis}
                </p>
              </div>
            )}
            
            {scoreData?.insights && (
              <div className="p-4 bg-purple-900/10 border border-purple-800/30 rounded-xl">
                <h4 className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-2">
                  <Brain className="w-3 h-3" /> Deep Insights
                </h4>
                <p className="text-xs text-purple-300/80 leading-relaxed">
                  {scoreData.insights}
                </p>
              </div>
            )}

            {(scoreData?.strengths || scoreData?.improvements) && (
              <div className="mt-2 grid md:grid-cols-2 gap-4">
                {scoreData?.strengths && scoreData.strengths.length > 0 && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300 mb-2">
                      ✨ Strengths
                    </h4>
                    <ul className="space-y-1">
                      {scoreData.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="text-xs text-emerald-700 dark:text-emerald-400">
                          • {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {scoreData?.improvements && scoreData.improvements.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      🎯 Improvements Needed
                    </h4>
                    <ul className="space-y-1">
                      {scoreData.improvements.map((improvement: string, idx: number) => (
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
        )}

        {score >= 5 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl">
            <div className="flex items-start gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-purple-300 mb-1">
                  You're eligible for a Soulbound Badge!
                </h4>
                <p className="text-xs text-grey-400">
                  Mint a {getTierFromScore(score).name} NFT badge to prove your on-chain reputation
                </p>
              </div>
            </div>
            <button
              onClick={handleMint}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {loading ? 'Minting...' : `Mint ${getTierFromScore(score).name} Badge`}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};