import express from 'express';
import { getOnChainData, OnChainData } from '../services/subscan.service';
import { chatWithAI } from '../services/ai.service';
import { dbService } from '../services/db.service';

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
 *     tags: [Chat]
 *     summary: Send chat message about wallet reputation
 *     description: AI-powered chat about wallet reputation and on-chain data
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
 *                 example: "1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg"
 *               query:
 *                 type: string
 *                 description: User's question or message
 *                 example: "What is my governance participation?"
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
 *                   $ref: '#/components/schemas/OnChainData'
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res, next) => {
  try {
    const { address, query, sessionId } = req.body; // Bổ sung nhận sessionId từ frontend

    if (!address) return res.status(400).json({ error: 'Wallet address is required' });
    if (!query) return res.status(400).json({ error: 'Query is required' });

    console.log(`💬 Chat query for ${address}: ${query}`);

    // XỬ LÝ SESSION
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      // Nếu chưa có session, tạo session mới. Lấy 30 ký tự đầu làm title
      const title = query.length > 30 ? query.substring(0, 30) + '...' : query;
      const newSession = await dbService.createChatSession(address, title);
      currentSessionId = newSession.id;
    }

    // LƯU TIN NHẮN USER VÀO DB
    await dbService.saveChatMessage(currentSessionId, 'user', query);

    // Lấy dữ liệu On-chain và AI response
    const onChainData = await getOnChainData(address);
    const score = calculateScore(onChainData);
    const response = await chatWithAI(query, address, onChainData);

    const onChainMetadata = {
        ...onChainData,
        score: score.totalScore,
        breakdown: score.breakdown,
        rank: score.rank,
        level: score.level,
    };

    // LƯU TIN NHẮN AI VÀO DB kèm theo metadata để hiển thị Card
    await dbService.saveChatMessage(currentSessionId, 'model', response, onChainMetadata);

    res.json({
      success: true,
      sessionId: currentSessionId, // Trả về sessionId để frontend giữ trạng thái
      address,
      query,
      response,
      onChainData: onChainMetadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/chat/sessions/{address}:
 *   get:
 *     tags: [Chat]
 *     summary: Get chat sessions for a wallet address
 *     description: Retrieves all chat sessions for a specific wallet address
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
 *                   user_address:
 *                     type: string
 *                   title:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                   updated_at:
 *                     type: string
 *                   is_active:
 *                     type: boolean
 */
// 2. API: Lấy danh sách session của 1 ví (Cho Sidebar)
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
 *     tags: [Chat]
 *     summary: Get messages for a chat session
 *     description: Retrieves all messages for a specific chat session
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
 *                   session_id:
 *                     type: string
 *                   role:
 *                     type: string
 *                     enum: [user, model]
 *                   content:
 *                     type: string
 *                   metadata:
 *                     type: object
 *                   created_at:
 *                     type: string
 */
// 3. API: Lấy chi tiết tin nhắn của 1 session
router.get('/sessions/:sessionId/messages', async (req, res, next) => {
    try {
        const messages = await dbService.getChatMessages(req.params.sessionId);
        res.json(messages);
    } catch (error) {
        next(error);
    }
});

export default router;
