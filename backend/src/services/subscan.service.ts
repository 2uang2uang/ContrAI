import axios from 'axios';
import { logger } from '../utils/logger';

const SUBSCAN_API = 'https://polkadot.api.subscan.io';
const SUBSCAN_API_KEY = process.env.SUBSCAN_API_KEY || '';

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
  recentTransfers?: any[];
}

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

    return response.data?.data?.account || null;
  } catch (error: any) {
    logger.warn({ err: error, address }, 'Failed to fetch account info');
    return null;
  }
}

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
    return null;
  }
}

async function getRecentTransfers(address: string) {
  try {
    const response = await axios({
      method: 'POST',
      url: `${SUBSCAN_API}/api/v2/scan/transfers`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SUBSCAN_API_KEY
      },
      data: {
        address: address,
        row: 10
      }
    });
    return response.data?.data?.transfers || [];
  } catch (error: any) {
    logger.warn({ err: error, address }, 'Failed to fetch recent transfers');
    return [];
  }
}

export async function getOnChainData(address: string): Promise<OnChainData> {
  const [accountInfo, stakingInfo, recentTransfers] = await Promise.all([
    getAccountInfo(address),
    getStakingInfo(address),
    getRecentTransfers(address)
  ]);

  const identity = {
    hasIdentity: !!(accountInfo?.display || accountInfo?.account_display?.people?.display),
    isVerified: (accountInfo?.judgements?.length || 0) > 0,
    judgements: accountInfo?.judgements?.length || 0,
  };

  const staking = {
    totalStaked: accountInfo?.bonded || '0',
    isNominator: !!stakingInfo || (accountInfo?.bonded && accountInfo.bonded !== '0'),
    isValidator: accountInfo?.role === 'validator',
  };

  const activity = {
    transactionCount: accountInfo?.count_extrinsic || 0,
    firstSeen: 0,
    lastActive: Date.now(),
  };

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
    recentTransfers
  };
}
