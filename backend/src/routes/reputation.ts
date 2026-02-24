import express from 'express';
import { getOnChainData } from '../services/subscan.service';
import { calculateReputationWithAI } from '../services/ai.service';

const router = express.Router();

/**
 * @swagger
 * /api/reputation/calculate:
 *   post:
 *     summary: Calculate reputation score for a wallet
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
 *                 example: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"
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
 * /api/reputation/{address}:
 *   get:
 *     summary: Get on-chain data for a wallet
 *     tags: [Reputation]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Polkadot wallet address
 *         example: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"
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
 *                   format: date-time
 *       500:
 *         description: Internal server error
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

export default router;
