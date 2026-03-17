import express from 'express';
import { getOnChainData } from '../services/subscan.service';
import { calculateReputationWithAI } from '../services/ai.service';
import { generateMintSignature } from '../services/blockchain.service';
import { supabase } from '../services/db.service';


const router = express.Router();
router.post('/calculate', async (req, res, next) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    console.log(`📝 Calculating reputation for ${address}`);

    // Get on-chain data
    const onChainData = await getOnChainData(address);

    // Calculate score with AI
    const score = await calculateReputationWithAI(address, onChainData);

    res.json({
      success: true,
      address,
      score,
      onChainData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});
router.get('/leaderboard', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    // Get leaderboard data from database
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
    const leaderboard = (data || []).map((entry, index) => {
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

    res.json({
      success: true,
      data: leaderboard,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});
router.get('/:address', async (req, res, next) => {
  try {
    const { address } = req.params;

    console.log(`📊 Getting on-chain data for ${address}`);

    const onChainData = await getOnChainData(address);

    res.json({
      success: true,
      address,
      data: onChainData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/request-mint', async (req, res, next) => {
  try {
    const { address, score, tier } = req.body;
    if (score === undefined || score < 0 || score > 10000) {
      return res.status(400).json({ 
        error: 'Score must be between 0 and 10000 (Basis Points)' 
      });
    }

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Gọi hàm ký EVM (blockchain.service.ts) với snapshotBlock
    // Bạn có thể truyền thêm currentBlock từ req.body nếu đã cập nhật frontend service
    const signature = await generateMintSignature(address, score, req.body.snapshotBlock || 0);
    
    res.json({ success: true, signature });
  } catch (error) {
    next(error);
  }
});

router.get('/leaderboard', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    console.log(`📊 Getting leaderboard with limit: ${limit}`);

    // Get leaderboard data from database
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
    const leaderboard = (data || []).map((entry, index) => {
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

    res.json({
      success: true,
      data: leaderboard,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
