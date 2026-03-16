import { GoogleGenAI } from '@google/genai';
import { OnChainData } from './subscan.service';
import { dbService } from './db.service';

// Debug: Check if API key is loaded
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables!');
} else {
  console.log('✅ GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Simple in-memory cache for AI responses (5 minutes TTL)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const reputationCache = new Map<string, CacheEntry<ReputationScore>>();
const chatCache = new Map<string, CacheEntry<string>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  console.log(`✅ Cache hit for ${key} (age: ${Math.floor(age / 1000)}s)`);
  return entry.data;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export interface ReputationScore {
  totalScore: number;
  breakdown: {
    identity: number;
    governance: number;
    staking: number;
    activity: number;
    behavioral: number; // Điểm chất lượng hành vi (MỚI)
  };
  sybilRisk: {          // Đánh giá rủi ro clone/spam (MỚI)
    score: number;      // 0.0 đến 1.0 (ví dụ: 0.8 là rủi ro cao)
    flaggedPatterns: string[];
  };
  rank: string;
  level: string;
  analysis: string;
  strengths: string[];
  improvements: string[];
  insights: string;
}
export async function calculateReputationWithAI(
  address: string,
  onChainData: OnChainData // Lưu ý đổi thành type OnChainData của bạn nếu cần
): Promise<ReputationScore> { // Chỗ này Promise<ReputationScore> theo type của bạn
  // Check cache first (Local RAM)
  const cached = getCached(reputationCache, address);
  if (cached) {
    return cached;
  }

  console.log(`🤖 AI analyzing reputation for ${address}`);

  const recentTransfersSummary = onChainData.recentTransfers?.map((t: any) =>
    `[${new Date(t.block_timestamp * 1000).toISOString()}] ${t.from === address ? 'Gửi' : 'Nhận'} ${t.amount} ${t.asset_symbol} ${t.from === address ? 'tới' : 'từ'} ${t.to === address ? t.from : t.to}`
  ).join('\n') || 'Không có giao dịch gần đây';

  const prompt = `Bạn là một AI chuyên gia phân tích hành vi on-chain trên hệ sinh thái Polkadot (Reputation as Infrastructure).
Nhiệm vụ của bạn là đánh giá UY TÍN (Reputation) của ví này, KHÔNG CHỈ DỰA VÀO VIỆC ĐẾM SỐ, mà phải phân tích "Chất lượng hành vi" và "Rủi ro Sybil" (tài khoản clone/spam).

Địa chỉ ví: ${address}

1. DỮ LIỆU TỔNG QUAN:
- Identity: Has Identity: ${onChainData.identity.hasIdentity}, Verified: ${onChainData.identity.isVerified}, Judgements: ${onChainData.identity.judgements}
- Governance: ${onChainData.governance.votesCount} votes
- Staking: ${parseFloat(onChainData.staking.totalStaked) / 1e10} DOT
- Activity: ${onChainData.activity.transactionCount} total transactions

2. DỮ LIỆU LỊCH SỬ GIAO DỊCH GẦN NHẤT (Để tìm Pattern & Sybil Risk):
${recentTransfersSummary}

HƯỚNG DẪN CHẤM ĐIỂM BẰNG PHÂN TÍCH HÀNH VI:
- Tính "totalScore" (0-100).
- "breakdown" gồm: identity, governance, staking, activity, VÀ behavioral (chất lượng hành vi tổng thể).
- Phân tích Rủi ro Sybil (sybilRisk): Dựa vào lịch sử giao dịch. Nếu ví nhận tiền liên tục từ 1 nguồn lạ rồi ngay lập tức chuyển đi, hoặc thời gian dồn dập bất thường -> Rủi ro cao (score tiến gần 1.0). Nếu giao dịch tự nhiên, rải rác, có staking -> Rủi ro thấp (tiến về 0.0).

BẮT BUỘC TRẢ VỀ CHỈ MỘT CHUỖI JSON ĐÚNG ĐỊNH DẠNG SAU (Không thêm text bên ngoài):
{
  "totalScore": <điểm_tổng_từ_0_đến_100>,
  "breakdown": {
    "identity": <điểm>, "governance": <điểm>, "staking": <điểm>, "activity": <điểm>, "behavioral": <điểm_chất_lượng_hành_vi>
  },
  "sybilRisk": {
    "score": <từ_0.0_đến_1.0>,
    "flaggedPatterns": ["<mô tả các mẫu hành vi bất thường nếu có, ví dụ: 'Giao dịch chuyển tiền dồn dập trong cùng 1 ngày'>"]
  },
  "rank": "<Top 1%, 5%, 10%, 25%, 50%, Unranked>",
  "level": "<Legend, Master, Expert, Advanced, Intermediate, Beginner, Newcomer>",
  "analysis": "<Phân tích chuyên sâu bằng TIẾNG VIỆT về chất lượng thực sự của ví, có giống ví người dùng thật không>",
  "strengths": ["<điểm mạnh 1>", "<điểm mạnh 2>"],
  "improvements": ["<điều cần cải thiện 1>"],
  "insights": "<Góc nhìn sâu sắc của AI về hành vi trên on-chain của ví này>"
}`;

  // Retry logic for handling 503 errors - OPTIMIZED
  const maxRetries = 2;
  const retryDelays = [1000, 2000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI request timeout')), 60000)
      );

      const aiPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          temperature: 0.1,
          topP: 0.8,
          topK: 10,
        },
      });

      const response = await Promise.race([aiPromise, timeoutPromise]) as any;

      let text = response.text || '';
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const aiScore = JSON.parse(text);

      // 1. Lưu vào cache tạm thời (RAM)
      setCache(reputationCache, address, aiScore);

      // 2. LƯU VÀO DATABASE (Supabase)
      try {
        await dbService.upsertReputationScore(address, aiScore);
        console.log(`✅ Đã lưu điểm uy tín của ${address} vào Database thành công`);
      } catch (dbError) {
        // Ta dùng try/catch bọc ở đây để nếu DB có lỗi (ví dụ rớt mạng), 
        // nó chỉ log ra lỗi chứ không làm chết API (Frontend vẫn nhận được điểm)
        console.error(`❌ Lỗi khi lưu điểm vào Database cho ${address}:`, dbError);
      }

      return aiScore;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;
      const is503Error = error.status === 503 || error.message?.includes('503') || error.message?.includes('UNAVAILABLE');
      const isTimeout = error.message?.includes('timeout');

      // Retry on 503 or timeout (but not on last attempt)
      if ((is503Error || isTimeout) && !isLastAttempt) {
        const delay = retryDelays[attempt];
        console.log(`⚠️ AI service ${isTimeout ? 'timeout' : 'unavailable (503)'}, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        // Giả sử bạn có hàm sleep
        await new Promise(res => setTimeout(res, delay));
        continue;
      }

      // If it's the last attempt or not a retryable error, throw
      console.error('❌ AI reputation calculation error:', error);
      throw new Error(
        isTimeout
          ? 'AI service đang xử lý quá lâu. Vui lòng thử lại sau ít phút.'
          : is503Error
            ? 'AI service đang quá tải. Vui lòng thử lại sau vài phút.'
            : `Lỗi AI service: ${error.message}`
      );
    }
  }

  throw new Error('Không thể tính toán reputation score');
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Chat with AI about reputation/blockchain data with retry logic
 */
export async function chatWithAI(
  query: string,
  address: string,
  onChainData: OnChainData
): Promise<string> {
  // Check cache first (cache key includes query)
  const cacheKey = `${address}:${query}`;
  const cached = getCached(chatCache, cacheKey);
  if (cached) {
    return cached;
  }

  console.log(`💬 AI chat for ${address}: ${query}`);

  // Phân tích loại câu hỏi để tạo response phù hợp
  const queryLower = query.toLowerCase().trim();
  const isGreeting = /^(chào|hello|hi|xin chào|hey|chào bạn)$/i.test(queryLower);
  const isHelp = /^(help|giúp|hướng dẫn|làm gì|có thể làm gì)$/i.test(queryLower);
  
  let prompt = '';

  if (isGreeting || isHelp) {
    // PROMPT ĐẶC BIỆT CHO GREETING/HELP
    prompt = `Bạn là DotRepute AI - trợ lý thông minh chuyên phân tích uy tín trên Polkadot.

User vừa ${isGreeting ? 'chào hỏi' : 'hỏi về hướng dẫn'}: "${query}"
Address: ${address}

Dữ liệu ví hiện tại:
- Identity: ${onChainData.identity.hasIdentity ? 'Có' : 'Chưa có'}, Verified: ${onChainData.identity.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
- Governance: ${onChainData.governance.votesCount} lượt vote
- Staking: ${(parseFloat(onChainData.staking.totalStaked) / 1e10).toFixed(2)} DOT
- Activity: ${onChainData.activity.transactionCount} giao dịch

NHIỆM VỤ: Trả lời thân thiện, giới thiệu bản thân và đưa ra 3-4 gợi ý cụ thể dựa trên tình trạng ví.

VÍ DỤ FORMAT:
"Chào bạn! 👋 Tôi là DotRepute AI, trợ lý phân tích uy tín trên Polkadot. 

Tôi có thể giúp bạn:
• 📊 Phân tích reputation score chi tiết
• 🏛️ Hướng dẫn tham gia governance 
• 💰 Tư vấn chiến lược staking
• 🔍 Kiểm tra hoạt động on-chain

${onChainData.activity.transactionCount < 10 ? 'Tôi thấy bạn mới bắt đầu trên Polkadot. Bạn muốn tôi hướng dẫn các bước đầu tiên không?' : 'Ví của bạn khá tích cực! Bạn muốn tôi phân tích reputation score không?'}"

Trả lời bằng tiếng Việt, thân thiện và cụ thể.`;
  } else {
    // PROMPT THÔNG THƯỜNG CHO CÂU HỎI KHÁC
    prompt = `Bạn là DotRepute AI - trợ lý chuyên gia phân tích uy tín trên Polkadot. Trả lời dựa trên dữ liệu THỰC TẾ.

Câu hỏi: "${query}"
Address: ${address}

Dữ liệu on-chain:
- Identity: ${onChainData.identity.hasIdentity ? 'Có' : 'Chưa có'}, Verified: ${onChainData.identity.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}, Judgements: ${onChainData.identity.judgements}
- Governance: ${onChainData.governance.votesCount} votes, ${onChainData.governance.proposalsCount} proposals
- Staking: ${(parseFloat(onChainData.staking.totalStaked) / 1e10).toFixed(2)} DOT, Nominator: ${onChainData.staking.isNominator ? 'Có' : 'Không'}
- Activity: ${onChainData.activity.transactionCount} giao dịch tổng cộng

HƯỚNG DẪN TRẢ LỜI:
- Trả lời bằng tiếng Việt, chuyên nghiệp nhưng thân thiện
- Dựa vào dữ liệu thực tế, không bịa đặt
- Đưa ra lời khuyên cụ thể nếu phù hợp
- Sử dụng emoji phù hợp để sinh động
- Nếu không hiểu câu hỏi, hỏi lại để làm rõ`;
  }

  // Retry logic for handling 503 errors - OPTIMIZED
  const maxRetries = 2;
  const retryDelays = [1000, 2000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add timeout to prevent hanging (60s for chat responses)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI request timeout')), 60000)
      );

      const aiPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          temperature: isGreeting || isHelp ? 0.3 : 0.1, // Greeting linh hoạt hơn
          topP: 0.9,
          topK: 40,
        },
      });

      const response = await Promise.race([aiPromise, timeoutPromise]) as any;

      const result = response.text || 'Xin lỗi, tôi không thể trả lời câu hỏi này.';

      // Cache the result
      setCache(chatCache, cacheKey, result);

      return result;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;
      const is503Error = error.status === 503 || error.message?.includes('503') || error.message?.includes('UNAVAILABLE');
      const isTimeout = error.message?.includes('timeout');

      // Retry on 503 or timeout (but not on last attempt)
      if ((is503Error || isTimeout) && !isLastAttempt) {
        const delay = retryDelays[attempt];
        console.log(`⚠️ AI service ${isTimeout ? 'timeout' : 'unavailable (503)'}, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }

      // If it's the last attempt or not a retryable error, throw
      console.error('❌ AI chat error:', error);
      throw new Error(
        isTimeout
          ? 'AI service đang xử lý quá lâu. Vui lòng thử câu hỏi ngắn gọn hơn.'
          : is503Error
            ? 'AI service đang quá tải. Vui lòng thử lại sau vài phút.'
            : `Lỗi AI service: ${error.message}`
      );
    }
  }

  return 'Xin lỗi, tôi không thể trả lời câu hỏi này.';
}
