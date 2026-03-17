import express from 'express';
import { getOnChainData } from '../services/subscan.service';
import { calculateReputationWithAI } from '../services/ai.service';
import { generateMintSignature } from '../services/blockchain.service';
import { supabase } from '../services/db.service';
import { logger } from '../utils/logger';


const router = express.Router();

/**
 * @swagger
 * /api/reputation/calculate:
 *   post:
 *     summary: Calculate reputation score for a wallet address
 *     tags: [Reputation]
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
 *         description: Bad request
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

    const onChainData = await getOnChainData(address);

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
 *     summary: Get reputation leaderboard
 *     tags: [Reputation]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top addresses to return
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
    const { data, error } = await supabase
      .from('reputation_scores')
      .select('address, total_score, rank, level, identity_score, governance_score, economic_score, behavioral_score, last_updated')
      .order('total_score', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error({ err: error }, 'Failed to fetch leaderboard');
      throw error;
    }

    const leaderboard = (data || []).map((entry, index) => {
      const badges: string[] = [];
      
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
        trend: 'neutral' as const,
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
 *     summary: Get on-chain data for a specific address
 *     tags: [Reputation]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Polkadot wallet address
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
 *     summary: Request mint signature for reputation badge
 *     tags: [Reputation]
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
 *                 description: Polkadot wallet address
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
 *         description: Mint signature generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 signature:
 *                   type: string
 *       400:
 *         description: Bad request
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

    const signature = await generateMintSignature(address, score, req.body.snapshotBlock || 0);
    
    res.json({ success: true, signature });
  } catch (error) {
    next(error);
  }
});

export default router;
