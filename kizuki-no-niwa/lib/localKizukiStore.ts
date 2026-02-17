
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/supabase';

type KizukiInsert = Database['public']['Tables']['kizuki']['Insert'];

const STORAGE_KEY = 'kizuki_local_logs';

export const LocalKizukiStore = {
    async saveKizuki(kizuki: KizukiInsert & { id?: string }): Promise<void> {
        try {
            const existing = await this.getKizukiLogs();
            // Ensure ID
            const entry = {
                ...kizuki,
                id: kizuki.id || `local-kizuki-${Date.now()}`,
                created_at: kizuki.created_at || new Date().toISOString()
            };
            const updated = [entry, ...existing];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save local kizuki:', e);
        }
    },

    async getKizukiLogs(): Promise<(KizukiInsert & { id: string })[]> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEY);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error('Failed to get local kizuki logs:', e);
            return [];
        }
    },

    async clear(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEY);
    }
};
