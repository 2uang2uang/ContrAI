import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export class DatabaseService {
    async upsertReputationScore(address: string, scoreData: any) {
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
                onConflict: 'address'
            });

        if (error) {
            logger.error({ err: error, address }, 'Failed to upsert reputation_scores');
            throw error;
        }

        const { error: historyError } = await supabase
            .from('reputation_history')
            .upsert({
                address: address,
                snapshot_date: new Date().toISOString().split('T')[0],
                total_score: scoreData.totalScore,
                rank: scoreData.rank
            }, {
                onConflict: 'address, snapshot_date'
            });

        if (historyError) {
            logger.warn({ err: historyError, address }, 'Failed to upsert reputation_history');
        }

        return data;
    }

    async getScoreByAddress(address: string) {
        const { data, error } = await supabase
            .from('reputation_scores')
            .select('*')
            .eq('address', address)
            .single();

        if (error && error.code !== 'PGRST116') {
            logger.warn({ err: error, address }, 'Failed to fetch reputation score');
        }

        return data;
    }
    async createChatSession(address: string, title: string) {
        const { data, error } = await supabase
            .from('chat_sessions')
            .insert({ user_address: address, title })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getChatSessions(address: string) {
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_address', address)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async saveChatMessage(sessionId: string, role: 'user' | 'model', content: string, metadata: any = {}) {
        const { data, error } = await supabase
            .from('chat_messages')
            .insert({ session_id: sessionId, role, content, metadata })
            .select()
            .single();

        if (error) throw error;

        await supabase
            .from('chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);

        return data;
    }

    async getChatMessages(sessionId: string) {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    }
}

export const dbService = new DatabaseService();