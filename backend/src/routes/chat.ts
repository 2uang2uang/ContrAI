import express from 'express';
import { getOnChainData, OnChainData } from '../services/subscan.service';
import { chatWithAI } from '../services/ai.service';

const router = express.Router();

/**
 * Calculate reputation score based on on-chain data
 */
function calculateScore(data: OnChainData) {
  // Identity Score (0-25)
  let identityScore = 0;
  if (data.identity.hasIdentity && data.identity.isVerified) {
    identityScore = 25;
  } else if (data.identity.hasIdentity) {
    identityScore = 10;
  }

  // Governance Score (0-30)
  let governanceScore = 0;
  const votes = data.governance.votesCount;
  if (votes >= 20) governanceScore = 30;
  else if (votes >= 6) governanceScore = 20;
  else if (votes >= 1) governanceScore = 10;

  // Staking Score (0-25)
  let stakingScore = 0;
  const stakedDOT = parseFloat(data.staking.totalStaked) / 1e10;
  if (stakedDOT >= 100) stakingScore = 25;
  else if (stakedDOT >= 10) stakingScore = 15;
  else if (stakedDOT > 0) stakingScore = 10;

  // Activity Score (0-20)
  let activityScore = 0;
  const txs = data.activity.transactionCount;
  if (txs >= 100) activityScore = 20;
  else if (txs >= 51) activityScore = 15;
  else if (txs >= 11) activityScore = 10;
  else if (txs >= 1) activityScore = 5;

  const totalScore = identityScore + governanceScore + stakingScore + activityScore;

  // Determine rank
  let rank = 'Unranked';
  if (totalScore >= 90) rank = 'Top 1%';
  else if (totalScore >= 80) rank = 'Top 5%';
  else if (totalScore >= 70) rank = 'Top 10%';
  else if (totalScore >= 60) rank = 'Top 25%';
  else if (totalScore >= 50) rank = 'Top 50%';

  // Determine level
  let level = 'Newcomer';
  if (totalScore >= 90) level = 'Legend';
  else if (totalScore >= 80) level = 'Master';
  else if (totalScore >= 70) level = 'Expert';
  else if (totalScore >= 60) level = 'Advanced';
  else if (totalScore >= 50) level = 'Intermediate';
  else if (totalScore >= 40) level = 'Beginner';

  return {
    totalScore,
    breakdown: {
      identity: identityScore,
      governance: governanceScore,
      staking: stakingScore,
      activity: activityScore,
    },
    rank,
    level,
  };
}

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Chat with AI about wallet reputation
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *               - query
 *             properties:
 *               address:
 *                 type: string
 *                 description: Polkadot wallet address
 *                 example: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"
 *               query:
 *                 type: string
 *                 description: User's question or query
 *                 example: "What is my reputation score?"
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 address:
 *                   type: string
 *                 query:
 *                   type: string
 *                 response:
 *                   type: string
 *                   description: AI-generated response
 *                 onChainData:
 *                   $ref: '#/components/schemas/OnChainData'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res, next) => {
  try {
    const { address, query } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`💬 Chat query for ${address}: ${query}`);

    // Get on-chain data
    const onChainData = await getOnChainData(address);

    // Calculate score based on the formula
    const score = calculateScore(onChainData);

    // Get AI response
    const response = await chatWithAI(query, address, onChainData);

    res.json({
      success: true,
      address,
      query,
      response,
      onChainData: {
        ...onChainData,
        score: score.totalScore,
        breakdown: score.breakdown,
        rank: score.rank,
        level: score.level,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
