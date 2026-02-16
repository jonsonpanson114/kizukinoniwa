import { supabase } from '../supabase';
import { Database } from '../../types/supabase';

type ForeshadowingInsert = Database['public']['Tables']['foreshadowing']['Insert'];

export class ForeshadowingService {
    /**
     * 種まき: 抽出されたモチーフをDBに保存する
     */
    static async plantSeeds(
        userId: string,
        originStoryId: string,
        motifs: string[]
    ): Promise<void> {
        if (!motifs || motifs.length === 0) return;

        // 重複排除 (同じ因果の種を何度も植えない)
        const uniqueMotifs = [...new Set(motifs)];

        const inserts: ForeshadowingInsert[] = uniqueMotifs.map(motif => ({
            user_id: userId,
            motif: motif,
            status: 'planted',
            planted_story_id: originStoryId,
            created_at: new Date().toISOString(),
        }));

        try {
            const { error } = await supabase.from('foreshadowing').insert(inserts);
            if (error) throw error;
            console.log(`[Foreshadowing] Planted ${inserts.length} seeds:`, uniqueMotifs);
        } catch (e) {
            console.error('[Foreshadowing] Failed to plant seeds:', e);
            // オフライン/モックモード時のフォールバックログ
            console.log('[Foreshadowing] (Offline) Would have saved:', uniqueMotifs);
        }
    }

    /**
     * 収穫: 次の物語に使うべき未回収の伏線を取得する
     */
    static async getPendingSeeds(userId: string, limit = 1): Promise<{ id: string, motif: string }[]> {
        try {
            const { data, error } = await supabase
                .from('foreshadowing')
                .select('id, motif')
                .eq('user_id', userId)
                .eq('status', 'planted')
                .limit(limit);

            if (error) throw error;
            return data.map(row => ({ id: row.id, motif: row.motif }));
        } catch (e) {
            console.error('[Foreshadowing] Failed to harvest seeds:', e);
            return [];
        }
    }

    /**
     * 解決: 使用した伏線を回収済みにする
     */
    static async markAsResolved(
        userId: string,
        motifs: string[],
        resolvedStoryId: string
    ): Promise<void> {
        if (!motifs || motifs.length === 0) return;

        try {
            const { error } = await supabase
                .from('foreshadowing')
                .update({
                    status: 'resolved',
                    resolved_story_id: resolvedStoryId
                })
                .eq('user_id', userId)
                .in('motif', motifs)
                .eq('status', 'planted'); // 未回収のものだけ対象

            if (error) throw error;
            console.log(`[Foreshadowing] Resolved motifs:`, motifs);
        } catch (e) {
            console.error('[Foreshadowing] Failed to resolve seeds:', e);
        }
    }
    /**
     * 解決: 使用した伏線を回収済みにする (ID指定)
     */
    static async markAsResolvedById(
        userId: string,
        foreshadowingId: string,
        resolvedStoryId: string
    ): Promise<void> {
        if (!foreshadowingId) return;

        try {
            const { error } = await supabase
                .from('foreshadowing')
                .update({
                    status: 'resolved',
                    resolved_story_id: resolvedStoryId
                })
                .eq('id', foreshadowingId)
                .eq('user_id', userId);

            if (error) throw error;
            console.log(`[Foreshadowing] Resolved seed ID: ${foreshadowingId}`);
        } catch (e) {
            console.error('[Foreshadowing] Failed to resolve seed by ID:', e);
        }
    }

    /**
     * 履歴: 全ての伏線（種と結び目）を取得する
     */
    static async getHistory(userId: string): Promise<{ id: string, motif: string, status: string | null, created_at: string | null }[]> {
        try {
            const { data, error } = await supabase
                .from('foreshadowing')
                .select('id, motif, status, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (e) {
            console.error('[Foreshadowing] Failed to get history:', e);
            return [];
        }
    }
}
