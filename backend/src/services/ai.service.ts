import { GoogleGenAI } from '@google/genai';
import { OnChainData } from './subscan.service';
import { dbService } from './db.service';
import { logger } from '../utils/logger';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const reputationCache = new Map<string, CacheEntry<ReputationScore>>();
const chatCache = new Map<string, CacheEntry<string>>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

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
    behavioral: number;
  };
  sybilRisk: {
    score: number;
    flaggedPatterns: string[];
  };
  rank: string;
  level: string;
  analysis: string;
  strengths: string[];
  improvements: string[];
  insights: string;
}
export async function calculateReputationWithAI(
  address: string,
  onChainData: OnChainData 
): Promise<ReputationScore> { 
  const cached = getCached(reputationCache, address);
  if (cached) {
    return cached;
  }

  const recentTransfersSummary = onChainData.recentTransfers?.map((t: any) =>
    `[${new Date(t.block_timestamp * 1000).toISOString()}] ${t.from === address ? 'Sent' : 'Received'} ${t.amount} ${t.asset_symbol} ${t.from === address ? 'to' : 'from'} ${t.to === address ? t.from : t.to}`
  ).join('\n') || 'No recent transactions';

  const prompt = `You are an AI expert specializing in on-chain behavior analysis on the Polkadot ecosystem (Reputation as Infrastructure).
Your task is to evaluate the REPUTATION of this wallet, NOT JUST BASED ON COUNTING NUMBERS, but analyzing "Behavior Quality" and "Sybil Risk" (clone/spam accounts).

Wallet Address: ${address}

1. OVERVIEW DATA:
- Identity: Has Identity: ${onChainData.identity.hasIdentity}, Verified: ${onChainData.identity.isVerified}, Judgements: ${onChainData.identity.judgements}
- Governance: ${onChainData.governance.votesCount} votes
- Staking: ${parseFloat(onChainData.staking.totalStaked) / 1e10} DOT
- Activity: ${onChainData.activity.transactionCount} total transactions

2. RECENT TRANSACTION HISTORY DATA (To find Patterns & Sybil Risk):
${recentTransfersSummary}

SCORING GUIDELINES THROUGH BEHAVIOR ANALYSIS:
1. Calculate detailed scores (breakdown): identity (0-25), governance (0-30), staking (0-25), activity (0-20), behavioral (0-20).
2. "totalScore" MUST equal the sum of all component scores.
3. If high Sybil Risk is detected (>0.7), deduct points directly from the "behavioral" column instead of arbitrarily deducting from the total.

MUST RETURN ONLY ONE VALID JSON STRING IN THE FOLLOWING FORMAT (No additional text outside):
{
  "totalScore": <total_score_from_0_to_100>,
  "breakdown": {
    "identity": <score>, "governance": <score>, "staking": <score>, "activity": <score>, "behavioral": <behavior_quality_score>
  },
  "sybilRisk": {
    "score": <from_0.0_to_1.0>,
    "flaggedPatterns": ["<describe abnormal behavior patterns if any, e.g., 'Rapid consecutive transfers within the same day'>"]
  },
  "rank": "<Top 1%, 5%, 10%, 25%, 50%, Unranked>",
  "level": "<Legend, Master, Expert, Advanced, Intermediate, Beginner, Newcomer>",
  "analysis": "<In-depth analysis in ENGLISH about the actual quality of the wallet, whether it resembles a real user's wallet>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement needed 1>"],
  "insights": "<AI's deep insights about this wallet's on-chain behavior>"
}`;

  const maxRetries = 2;
  const retryDelays = [1000, 2000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI request timeout')), 60000)
      );

      const aiPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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

      setCache(reputationCache, address, aiScore);

      try {
        await dbService.upsertReputationScore(address, aiScore);
      } catch (dbError) {
        logger.warn({ err: dbError, address }, 'Failed to persist reputation score');
      }

      return aiScore;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;
      const is503Error = error.status === 503 || error.message?.includes('503') || error.message?.includes('UNAVAILABLE');
      const isTimeout = error.message?.includes('timeout');

      if ((is503Error || isTimeout) && !isLastAttempt) {
        const delay = retryDelays[attempt];
        logger.warn({ attempt: attempt + 1, maxRetries, delay, isTimeout, is503Error }, 'AI request retry scheduled');
        await new Promise(res => setTimeout(res, delay));
        continue;
      }

      logger.error({ err: error, address }, 'AI reputation calculation failed');
      throw new Error(
        isTimeout
          ? 'AI service is taking too long to process. Please try again in a few minutes.'
          : is503Error
            ? 'AI service is overloaded. Please try again in a few minutes.'
            : `AI service error: ${error.message}`
      );
    }
  }

  throw new Error('Unable to calculate reputation score');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function chatWithAI(
  query: string,
  address: string,
  onChainData: OnChainData
): Promise<string> {
  const cacheKey = `${address}:${query}`;
  const cached = getCached(chatCache, cacheKey);
  if (cached) {
    return cached;
  }

  const queryLower = query.toLowerCase().trim();
  const isGreeting = /^(hello|hi|hey|greetings)$/i.test(queryLower);
  const isHelp = /^(help|guide|what can you do|how to)$/i.test(queryLower);
  
  let prompt = '';

  if (isGreeting || isHelp) {
    prompt = `You are DotRepute AI - an intelligent assistant specializing in reputation analysis on Polkadot.

User just ${isGreeting ? 'greeted' : 'asked for guidance'}: "${query}"
Address: ${address}

Current wallet data:
- Identity: ${onChainData.identity.hasIdentity ? 'Has' : 'No'}, Verified: ${onChainData.identity.isVerified ? 'Verified' : 'Not verified'}
- Governance: ${onChainData.governance.votesCount} votes
- Staking: ${(parseFloat(onChainData.staking.totalStaked) / 1e10).toFixed(2)} DOT
- Activity: ${onChainData.activity.transactionCount} transactions

TASK: Respond friendly, introduce yourself and provide 3-4 specific suggestions based on wallet status.

EXAMPLE FORMAT:
"Hello! 👋 I'm DotRepute AI, your reputation analysis assistant on Polkadot. 

I can help you with:
• 📊 Detailed reputation score analysis
• 🏛️ Governance participation guidance
• 💰 Staking strategy advice
• 🔍 On-chain activity review

${onChainData.activity.transactionCount < 10 ? 'I see you\'re new to Polkadot. Would you like me to guide you through the first steps?' : 'Your wallet is quite active! Would you like me to analyze your reputation score?'}"

Respond in English, friendly and specific.`;
  } else {
    prompt = `You are DotRepute AI - an expert assistant specializing in reputation analysis on Polkadot. Answer based on REAL DATA.

Question: "${query}"
Address: ${address}

On-chain data:
- Identity: ${onChainData.identity.hasIdentity ? 'Has' : 'No'}, Verified: ${onChainData.identity.isVerified ? 'Verified' : 'Not verified'}, Judgements: ${onChainData.identity.judgements}
- Governance: ${onChainData.governance.votesCount} votes, ${onChainData.governance.proposalsCount} proposals
- Staking: ${(parseFloat(onChainData.staking.totalStaked) / 1e10).toFixed(2)} DOT, Nominator: ${onChainData.staking.isNominator ? 'Yes' : 'No'}
- Activity: ${onChainData.activity.transactionCount} total transactions

RESPONSE GUIDELINES:
- Respond in English, professional but friendly
- Base answers on actual data, don't make things up
- Provide specific advice when appropriate
- Use appropriate emojis to make it engaging
- If you don't understand the question, ask for clarification`;
  }

  const maxRetries = 2;
  const retryDelays = [1000, 2000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI request timeout')), 60000)
      );

      const aiPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          temperature: isGreeting || isHelp ? 0.3 : 0.1,
          topP: 0.9,
          topK: 40,
        },
      });

      const response = await Promise.race([aiPromise, timeoutPromise]) as any;

      const result = response.text || 'Sorry, I cannot answer this question.';

      setCache(chatCache, cacheKey, result);

      return result;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;
      const is503Error = error.status === 503 || error.message?.includes('503') || error.message?.includes('UNAVAILABLE');
      const isTimeout = error.message?.includes('timeout');

      if ((is503Error || isTimeout) && !isLastAttempt) {
        const delay = retryDelays[attempt];
        logger.warn({ attempt: attempt + 1, maxRetries, delay, isTimeout, is503Error }, 'AI chat retry scheduled');
        await sleep(delay);
        continue;
      }

      logger.error({ err: error, address }, 'AI chat failed');
      throw new Error(
        isTimeout
          ? 'AI service is taking too long to process. Please try a shorter question.'
          : is503Error
            ? 'AI service is overloaded. Please try again in a few minutes.'
            : `AI service error: ${error.message}`
      );
    }
  }

  return 'Sorry, I cannot answer this question.';
}
