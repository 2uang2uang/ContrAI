import axios from 'axios';

const SUBSCAN_API = 'https://polkadot.api.subscan.io';
const SUBSCAN_API_KEY = process.env.SUBSCAN_API_KEY || ''; // Optional, for higher rate limits

// Debug log
if (SUBSCAN_API_KEY) {
  console.log('✅ SUBSCAN_API_KEY loaded:', SUBSCAN_API_KEY.substring(0, 10) + '...');
} else {
  console.warn('⚠️  SUBSCAN_API_KEY not set - API calls may be rate limited');
}

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

/**
 * Get account information from Subscan
 */
async function getAccountInfo(address: string) {
  try {
    const response = await axios({
      method: 'POST',
      url: `${SUBSCAN_API}/api/v2/scan/search`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SUBSCAN_API_KEY
      },
      data: {
        key: address
      }
    });
    
    // Return the account object from the response
    return response.data?.data?.account || null;
  } catch (error: any) {
    console.error('Error fetching account info:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Get staking information from Subscan
 */
async function getStakingInfo(address: string) {
  try {
    const response = await axios({
      method: 'POST',
      url: `${SUBSCAN_API}/api/scan/staking/nominator`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SUBSCAN_API_KEY
      },
      data: {
        address
      }
    });
    return response.data?.data || null;
  } catch (error: any) {
    // Staking info might not exist for all accounts
    return null;
  }
}

/**
 * Get all on-chain data for an address using Subscan API
 */
export async function getOnChainData(address: string): Promise<OnChainData> {
  console.log(`📊 Fetching on-chain data from Subscan for ${address}`);
  
  const [accountInfo, stakingInfo] = await Promise.all([
    getAccountInfo(address),
    getStakingInfo(address),
  ]);

  // Parse identity - check for display name and judgements
  const identity = {
    hasIdentity: !!(accountInfo?.display || accountInfo?.account_display?.people?.display),
    isVerified: (accountInfo?.judgements?.length || 0) > 0,
    judgements: accountInfo?.judgements?.length || 0,
  };

  // Parse staking - use data from account info
  const staking = {
    totalStaked: accountInfo?.bonded || '0',
    isNominator: !!stakingInfo || (accountInfo?.bonded && accountInfo.bonded !== '0'),
    isValidator: accountInfo?.role === 'validator',
  };

  // Parse activity - use count_extrinsic from account info
  const activity = {
    transactionCount: accountInfo?.count_extrinsic || 0,
    firstSeen: 0, // Removed - not needed
    lastActive: Date.now(),
  };

  // Governance - check for council/techcomm membership
  const governance = {
    votesCount: accountInfo?.democracy_lock !== '0' ? 1 : 0,
    proposalsCount: 0,
    delegations: accountInfo?.is_council_member || accountInfo?.is_techcomm_member ? 1 : 0,
  };

  return {
    identity,
    governance,
    staking,
    activity,
  };
}
