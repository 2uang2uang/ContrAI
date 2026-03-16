import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase client với Service Role Key để có quyền thao tác dữ liệu
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export class DatabaseService {
    /**
     * Lưu hoặc cập nhật điểm số mới nhất của ví
     */
    async upsertReputationScore(address: string, scoreData: any) {
        // 1. Cập nhật bảng reputation_scores chính
        const { data, error } = await supabase
            .from('reputation_scores')
            .upsert({
                address: address,
                total_score: scoreData.totalScore,
                identity_score: scoreData.breakdown.identity,
                governance_score: scoreData.breakdown.governance,
                economic_score: scoreData.breakdown.economic,
                behavioral_score: scoreData.breakdown.behavioral,
                rank: scoreData.rank,
                level: scoreData.level,
                sybil_risk: scoreData.sybilRisk?.score || 0,
                last_updated: new Date().toISOString()
            }, {
                onConflict: 'address' // Nếu ví đã tồn tại thì update, chưa có thì insert
            });

        if (error) {
            console.error('Lỗi khi lưu vào Supabase (reputation_scores):', error);
            throw error;
        }

        // 2. Lưu một bản ghi vào lịch sử (để sau này phân tích xu hướng)
        const { error: historyError } = await supabase
            .from('reputation_history')
            .upsert({
                address: address,
                snapshot_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                total_score: scoreData.totalScore,
                rank: scoreData.rank
            }, {
                onConflict: 'address, snapshot_date' // Mỗi ngày chỉ lưu 1 bản ghi lịch sử
            });

        if (historyError) {
            console.error('Lỗi khi lưu vào Supabase (reputation_history):', historyError);
        }

        return data;
    }

    /**
     * Lấy điểm số hiện tại của một ví
     */
    async getScoreByAddress(address: string) {
        const { data, error } = await supabase
            .from('reputation_scores')
            .select('*')
            .eq('address', address)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 là lỗi không tìm thấy (bình thường)
            console.error('Lỗi khi query Supabase:', error);
        }

        return data;
    }
}

export const dbService = new DatabaseService();