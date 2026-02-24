const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface OnChainData {
  identity: {
    hasIdentity: boolean;
    isVerified: boolean;
    judgements: number;
  };
  governance: {
    votesCount: number;
    proposalsCount: number;
    delegations: number;
  };
  staking: {
    totalStaked: string;
    isNominator: boolean;
    isValidator: boolean;
  };
  activity: {
    transactionCount: number;
    firstSeen: number;
    lastActive: number;
  };
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
  analysis?: string;
  strengths?: string[];
  improvements?: string[];
  insights?: string;
}

/**
 * Main function: Lấy reputation score của một địa chỉ từ backend
 */
export async function getReputationScore(address: string): Promise<ReputationScore> {
  try {
    const response = await fetch(`${API_URL}/api/reputation/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      throw new Error('Failed to get reputation score from backend');
    }

    const result = await response.json();
    
    if (result.success && result.score) {
      return result.score;
    }
    
    throw new Error('Invalid backend response');
  } catch (error) {
    console.error('Error getting reputation score:', error);
    throw error;
  }
}

/**
 * Get on-chain data only (without AI scoring)
 */
export async function getOnChainData(address: string): Promise<OnChainData> {
  try {
    const response = await fetch(`${API_URL}/api/reputation/${address}`);

    if (!response.ok) {
      throw new Error('Failed to get on-chain data from backend');
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }
    
    throw new Error('Invalid backend response');
  } catch (error) {
    console.error('Error getting on-chain data:', error);
    throw error;
  }
}
