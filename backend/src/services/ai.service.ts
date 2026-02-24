import { GoogleGenAI } from '@google/genai';
import { OnChainData } from './subscan.service';

// Debug: Check if API key is loaded
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables!');
} else {
  console.log('✅ GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Simple in-memory cache for AI responses (5 minutes TTL)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const reputationCache = new Map<string, CacheEntry<ReputationScore>>();
const chatCache = new Map<string, CacheEntry<string>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  console.log(`✅ Cache hit for ${key} (age: ${Math.floor(age / 1000)}s)`);
  return entry.data;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export interface ReputationScore {
  totalScore: number;
  breakdown: {
    identity: number;
    governance: number;
    staking: number;
    activity: number;
  };
  rank: string;
  level: string;
  analysis: string;
  strengths: string[];
  improvements: string[];
  insights: string;
}

/**
 * Calculate reputation score using AI with retry logic
 */
export async function calculateReputationWithAI(
  address: string,
  onChainData: OnChainData
): Promise<ReputationScore> {
  // Check cache first
  const cached = getCached(reputationCache, address);
  if (cached) {
    return cached;
  }

  console.log(`🤖 AI analyzing reputation for ${address}`);

  const prompt = `Polkadot reputation AI. Score based on ACTUAL data only.

Address: ${address}

Data:
- Identity: ${onChainData.identity.hasIdentity ? 'Yes' : 'No'}, Verified: ${onChainData.identity.isVerified}, Judgements: ${onChainData.identity.judgements}
- Governance: ${onChainData.governance.votesCount} votes, ${onChainData.governance.proposalsCount} proposals
- Staking: ${parseFloat(onChainData.staking.totalStaked) / 1e10} DOT, Nominator: ${onChainData.staking.isNominator}, Validator: ${onChainData.staking.isValidator}
- Activity: ${onChainData.activity.transactionCount} transactions

Scoring (EXACT):
1. Identity (0-25): No=0, Has=10, Verified=25
2. Governance (0-30): 0=0, 1-5=10, 6-20=20, 20+=30
3. Staking (0-25): 0=0, <10=10, 10-100=15, 100+=25
4. Activity (0-20): 0=0, 1-10=5, 11-50=10, 51-100=15, 100+=20

Return JSON only:
{
  "totalScore": <sum>,
  "breakdown": {"identity": <n>, "governance": <n>, "staking": <n>, "activity": <n>},
  "rank": "<90-100=Top 1%, 80-89=Top 5%, 70-79=Top 10%, 60-69=Top 25%, 50-59=Top 50%, <50=Unranked>",
  "level": "<90-100=Legend, 80-89=Master, 70-79=Expert, 60-69=Advanced, 50-59=Intermediate, 40-49=Beginner, <40=Newcomer>",
  "analysis": "<Vietnamese analysis>",
  "strengths": ["<actual strengths>"],
  "improvements": ["<actual improvements>"],
  "insights": "<AI insights>"
}`;

  // Retry logic for handling 503 errors - OPTIMIZED
  const maxRetries = 2; // Giảm từ 3 xuống 2
  const retryDelays = [1000, 2000]; // Giảm từ [2s, 5s, 10s] xuống [1s, 2s]

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add timeout to prevent hanging (60s for reputation calculation - increased)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI request timeout')), 60000) // 60s timeout
      );

      const aiPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Back to original model
        contents: prompt,
        config: {
          temperature: 0.1,
          topP: 0.8,
          topK: 10,
        },
      });

      const response = await Promise.race([aiPromise, timeoutPromise]) as any;

      let text = response.text || '';
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const aiScore = JSON.parse(text);
      
      // Cache the result
      setCache(reputationCache, address, aiScore);
      
      return aiScore;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;
      const is503Error = error.status === 503 || error.message?.includes('503') || error.message?.includes('UNAVAILABLE');
      const isTimeout = error.message?.includes('timeout');

      // Retry on 503 or timeout (but not on last attempt)
      if ((is503Error || isTimeout) && !isLastAttempt) {
        const delay = retryDelays[attempt];
        console.log(`⚠️ AI service ${isTimeout ? 'timeout' : 'unavailable (503)'}, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }

      // If it's the last attempt or not a retryable error, throw
      console.error('❌ AI reputation calculation error:', error);
      throw new Error(
        isTimeout
          ? 'AI service đang xử lý quá lâu. Vui lòng thử lại sau ít phút.'
          : is503Error 
          ? 'AI service đang quá tải. Vui lòng thử lại sau vài phút.'
          : `Lỗi AI service: ${error.message}`
      );
    }
  }

  throw new Error('Không thể tính toán reputation score');
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Chat with AI about reputation/blockchain data with retry logic
 */
export async function chatWithAI(
  query: string,
  address: string,
  onChainData: OnChainData
): Promise<string> {
  // Check cache first (cache key includes query)
  const cacheKey = `${address}:${query}`;
  const cached = getCached(chatCache, cacheKey);
  if (cached) {
    return cached;
  }

  console.log(`💬 AI chat for ${address}: ${query}`);

  const prompt = `Polkadot reputation assistant. Answer based on ACTUAL data only.

Question: "${query}"
Address: ${address}

Data:
- Identity: ${onChainData.identity.hasIdentity ? 'Yes' : 'No'}, Verified: ${onChainData.identity.isVerified}, Judgements: ${onChainData.identity.judgements}
- Governance: ${onChainData.governance.votesCount} votes, ${onChainData.governance.proposalsCount} proposals
- Staking: ${parseFloat(onChainData.staking.totalStaked) / 1e10} DOT, Nominator: ${onChainData.staking.isNominator}
- Activity: ${onChainData.activity.transactionCount} transactions

Answer in Vietnamese. Be specific and factual based on real data.`;

  // Retry logic for handling 503 errors - OPTIMIZED
  const maxRetries = 2; // Giảm từ 3 xuống 2
  const retryDelays = [1000, 2000]; // Giảm từ [2s, 5s, 10s] xuống [1s, 2s]

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add timeout to prevent hanging (60s for chat responses - increased)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI request timeout')), 60000) // 60s timeout
      );

      const aiPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Back to original model
        contents: prompt,
        config: {
          temperature: 0.1,
          topP: 0.9,
          topK: 40,
        },
      });

      const response = await Promise.race([aiPromise, timeoutPromise]) as any;

      const result = response.text || 'Xin lỗi, tôi không thể trả lời câu hỏi này.';
      
      // Cache the result
      setCache(chatCache, cacheKey, result);
      
      return result;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;
      const is503Error = error.status === 503 || error.message?.includes('503') || error.message?.includes('UNAVAILABLE');
      const isTimeout = error.message?.includes('timeout');

      // Retry on 503 or timeout (but not on last attempt)
      if ((is503Error || isTimeout) && !isLastAttempt) {
        const delay = retryDelays[attempt];
        console.log(`⚠️ AI service ${isTimeout ? 'timeout' : 'unavailable (503)'}, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }

      // If it's the last attempt or not a retryable error, throw
      console.error('❌ AI chat error:', error);
      throw new Error(
        isTimeout
          ? 'AI service đang xử lý quá lâu. Vui lòng thử câu hỏi ngắn gọn hơn.'
          : is503Error 
          ? 'AI service đang quá tải. Vui lòng thử lại sau vài phút.'
          : `Lỗi AI service: ${error.message}`
      );
    }
  }

  return 'Xin lỗi, tôi không thể trả lời câu hỏi này.';
}
