import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'kizuki_local_profile';

export interface LocalProfile {
    id: string;
    current_phase: number;
    current_day: number;
    phase_started_at: string | null;
    created_at: string | null;
}

const DEFAULT_PROFILE: LocalProfile = {
    id: 'local-user',
    current_phase: 1,
    current_day: 1,
    phase_started_at: null,
    created_at: new Date().toISOString(),
};

export const LocalProfileStore = {
    async getProfile(): Promise<LocalProfile> {
        try {
            let json = await AsyncStorage.getItem(STORAGE_KEY);

            // Web redundancy: try direct localStorage if AsyncStorage returns null
            if (!json && Platform.OS === 'web' && typeof window !== 'undefined') {
                try {
                    json = window.localStorage.getItem(STORAGE_KEY);
                } catch {
                    // Ignore localStorage errors
                }
            }

            const profile = json ? JSON.parse(json) : { ...DEFAULT_PROFILE };
            console.log('[LocalProfileStore] getProfile ->', profile);
            return profile;
        } catch (e) {
            console.warn('[LocalProfileStore] getProfile failed, returning default:', e);
            return { ...DEFAULT_PROFILE };
        }
    },

    async saveProfile(profile: Partial<LocalProfile>): Promise<void> {
        try {
            const current = await this.getProfile();
            const updated = { ...current, ...profile };
            const json = JSON.stringify(updated);

            await AsyncStorage.setItem(STORAGE_KEY, json);

            // Web redundancy: direct localStorage
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                try {
                    window.localStorage.setItem(STORAGE_KEY, json);
                } catch {
                    // Ignore localStorage errors
                }
            }

            console.log('[LocalProfileStore] saveProfile -> saved:', updated);
        } catch (e) {
            console.error('[LocalProfileStore] Failed to save local profile:', e);
            throw e;
        }
    },
};
