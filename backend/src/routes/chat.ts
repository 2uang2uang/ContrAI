import express from 'express';
import { getOnChainData, OnChainData } from '../services/subscan.service';
import { chatWithAI, calculateReputationWithAI } from '../services/ai.service';
import { dbService } from '../services/db.service';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Chat with AI about reputation data
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
 *               query:
 *                 type: string
 *                 description: User question or query
 *               sessionId:
 *                 type: string
 *                 description: Optional chat session ID
 *     responses:
 *       200:
 *         description: Chat response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sessionId:
 *                   type: string
 *                 address:
 *                   type: string
 *                 query:
 *                   type: string
 *                 response:
 *                   type: string
 *                 onChainData:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res, next) => {
  try {
    const { address, query, sessionId } = req.body;

    if (!address) return res.status(400).json({ error: 'Wallet address is required' });
    if (!query) return res.status(400).json({ error: 'Query is required' });

    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const title = query.length > 30 ? query.substring(0, 30) + '...' : query;
      const newSession = await dbService.createChatSession(address, title);
      currentSessionId = newSession.id;
    }

    await dbService.saveChatMessage(currentSessionId, 'user', query);

    const onChainData = await getOnChainData(address);

    const aiScore = await calculateReputationWithAI(address, onChainData);

    const response = await chatWithAI(query, address, onChainData);

    const onChainMetadata = {
        ...onChainData,
        score: {
            totalScore: aiScore.totalScore,
            breakdown: aiScore.breakdown,
            rank: aiScore.rank,
            level: aiScore.level,
            sybilRisk: aiScore.sybilRisk,
            analysis: aiScore.analysis,
            insights: aiScore.insights,
            strengths: aiScore.strengths,
            improvements: aiScore.improvements,
        }
    };

    await dbService.saveChatMessage(currentSessionId, 'model', response, onChainMetadata);

    res.json({
      success: true,
      sessionId: currentSessionId,
      address,
      query,
      response,
      onChainData: onChainMetadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Chat route error');
    next(error);
  }
});

/**
 * @swagger
 * /api/chat/sessions/{address}:
 *   get:
 *     summary: Get chat sessions for an address
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Polkadot wallet address
 *     responses:
 *       200:
 *         description: Chat sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   timestamp:
 *                     type: string
 */
router.get('/sessions/:address', async (req, res, next) => {
    try {
        const sessions = await dbService.getChatSessions(req.params.address);
        res.json(sessions);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/chat/sessions/{sessionId}/messages:
 *   get:
 *     summary: Get messages for a chat session
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat session ID
 *     responses:
 *       200:
 *         description: Chat messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   role:
 *                     type: string
 *                     enum: [user, model]
 *                   content:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                   metadata:
 *                     type: object
 */
router.get('/sessions/:sessionId/messages', async (req, res, next) => {
    try {
        const messages = await dbService.getChatMessages(req.params.sessionId);
        res.json(messages);
    } catch (error) {
        next(error);
    }
});

export default router;
