import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types matching backend schema
export interface ReputationScore {
  id?: string;
  address: string;
  total_score: number;
  identity_score: number;
  governance_score: number;
  economic_score: number;
  behavioral_score: number;
  rank: string;
  level: string;
  sybil_risk: number;
  last_updated: string;
  created_at?: string;
}

export interface LeaderboardEntry {
  address: string;
  total_score: number;
  rank: string;
  level: string;
  badges: string[];
  trend: 'up' | 'down' | 'neutral';
  position: number; // Vị trí trong bảng xếp hạng
}

// Fetch leaderboard data from reputation_scores table
export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('reputation_scores')
    .select('address, total_score, rank, level, identity_score, governance_score, economic_score, behavioral_score, last_updated')
    .order('total_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }

  // Transform data to LeaderboardEntry format
  return (data || []).map((entry, index) => {
    const badges: string[] = [];
    
    // Assign badges based on scores
    if (entry.governance_score > 80) badges.push('Governance Whale');
    if (entry.identity_score > 90) badges.push('Verified Identity');
    if (entry.economic_score > 80) badges.push('Economic Contributor');
    if (entry.behavioral_score > 85) badges.push('Active Participant');
    if (entry.total_score > 900) badges.push('Elite Member');
    
    return {
      address: entry.address,
      total_score: entry.total_score,
      rank: entry.rank,
      level: entry.level,
      badges,
      trend: 'neutral' as const, // Default, có thể tính từ history
      position: index + 1,
    };
  });
}

// Get trend by comparing with history
export async function getAddressTrend(address: string): Promise<'up' | 'down' | 'neutral'> {
  const { data, error } = await supabase
    .from('reputation_history')
    .select('total_score, snapshot_date')
    .eq('address', address)
    .order('snapshot_date', { ascending: false })
    .limit(2);

  if (error || !data || data.length < 2) {
    return 'neutral';
  }

  const [latest, previous] = data;
  if (latest.total_score > previous.total_score) return 'up';
  if (latest.total_score < previous.total_score) return 'down';
  return 'neutral';
}

// Get reputation score by address
export async function getReputationByAddress(address: string): Promise<ReputationScore | null> {
  const { data, error } = await supabase
    .from('reputation_scores')
    .select('*')
    .eq('address', address)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching reputation:', error);
    throw error;
  }

  return data;
}
