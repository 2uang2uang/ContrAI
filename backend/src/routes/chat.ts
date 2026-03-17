import express from 'express';
import { getOnChainData, OnChainData } from '../services/subscan.service';
import { chatWithAI, calculateReputationWithAI } from '../services/ai.service';
import { dbService } from '../services/db.service';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { address, query, sessionId } = req.body;

    if (!address) return res.status(400).json({ error: 'Wallet address is required' });
    if (!query) return res.status(400).json({ error: 'Query is required' });

    console.log(`💬 Chat query for ${address}: ${query}`);

    // 1. XỬ LÝ SESSION
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const title = query.length > 30 ? query.substring(0, 30) + '...' : query;
      const newSession = await dbService.createChatSession(address, title);
      currentSessionId = newSession.id;
    }

    // 2. LƯU TIN NHẮN USER
    await dbService.saveChatMessage(currentSessionId, 'user', query);

    // 3. LẤY DỮ LIỆU ON-CHAIN
    const onChainData = await getOnChainData(address);

    // 4. QUAN TRỌNG: Gọi AI tính toán điểm số trước
    // Hàm này trong ai.service.ts sẽ trả về kết quả có logic toán học đồng nhất
    const aiScore = await calculateReputationWithAI(address, onChainData);

    // 5. GỌI AI CHAT
    // Chúng ta truyền thêm aiScore vào để AI khi trả lời text biết được điểm mình vừa chấm là bao nhiêu
    const response = await chatWithAI(query, address, onChainData);

    // 6. ĐÓNG GÓI METADATA CHO FRONTEND (ReputationCard)
    // Lưu ý: Cấu trúc này phải khớp với cách Frontend bóc tách dữ liệu
    const onChainMetadata = {
        ...onChainData, // Giữ lại dữ liệu thô (identity, governance...)
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

    // 7. LƯU TIN NHẮN AI VÀO DB KÈM METADATA
    await dbService.saveChatMessage(currentSessionId, 'model', response, onChainMetadata);

    res.json({
      success: true,
      sessionId: currentSessionId,
      address,
      query,
      response,
      onChainData: onChainMetadata, // Trả về cho frontend hiển thị ngay
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat Route Error:", error);
    next(error);
  }
});

router.get('/sessions/:address', async (req, res, next) => {
    try {
        const sessions = await dbService.getChatSessions(req.params.address);
        res.json(sessions);
    } catch (error) {
        next(error);
    }
});

router.get('/sessions/:sessionId/messages', async (req, res, next) => {
    try {
        const messages = await dbService.getChatMessages(req.params.sessionId);
        res.json(messages);
    } catch (error) {
        next(error);
    }
});

export default router;
