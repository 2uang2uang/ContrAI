import express from 'express';
import { getOnChainData } from '../services/subscan.service';
import { calculateReputationWithAI } from '../services/ai.service';
import { generateMintSignature } from '../services/blockchain.service';
import { supabase } from '../services/db.service';


const router = express.Router();

/**
 * @swagger
 * /api/reputation/calculate:
 *   post:
 *     tags: [Reputation]
 *     summary: Calculate reputation score for a wallet address
 *     description: Analyzes on-chain data and calculates AI-powered reputation score
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 description: Polkadot wallet address
 *                 example: "1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg"
 *     responses:
 *       200:
 *         description: Reputation score calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 address:
 *                   type: string
 *                 score:
 *                   $ref: '#/components/schemas/ReputationScore'
 *                 onChainData:
 *                   $ref: '#/components/schemas/OnChainData'
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Bad request - missing address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/reputation/leaderboard:
 *   get:
 *     tags: [Reputation]
 *     summary: Get reputation leaderboard
 *     description: Returns top wallets ranked by reputation score
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of entries to return
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       address:
 *                         type: string
 *                       total_score:
 *                         type: number
 *                       rank:
 *                         type: string
 *                       level:
 *                         type: string
 *                       badges:
 *                         type: array
 *                         items:
 *                           type: string
 *                       position:
 *                         type: number
 *                 timestamp:
 *                   type: string
 */
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

/**
 * @swagger
 * /api/reputation/{address}:
 *   get:
 *     tags: [Reputation]
 *     summary: Get on-chain data for a wallet address
 *     description: Retrieves raw on-chain data without AI analysis
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Polkadot wallet address
 *         example: "1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg"
 *     responses:
 *       200:
 *         description: On-chain data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 address:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/OnChainData'
 *                 timestamp:
 *                   type: string
 */
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

/**
 * @swagger
 * /api/reputation/request-mint:
 *   post:
 *     tags: [Reputation]
 *     summary: Request mint signature for reputation NFT
 *     description: Generates a signature for minting reputation badge NFT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *               - score
 *             properties:
 *               address:
 *                 type: string
 *                 description: Wallet address
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10000
 *                 description: Score in basis points (0-10000)
 *               tier:
 *                 type: string
 *                 description: Badge tier
 *               snapshotBlock:
 *                 type: number
 *                 description: Block number for snapshot
 *     responses:
 *       200:
 *         description: Signature generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 signature:
 *                   type: object
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

export default router;
