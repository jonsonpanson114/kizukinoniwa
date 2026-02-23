import AsyncStorage from '@react-native-async-storage/async-storage';

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
            const json = await AsyncStorage.getItem(STORAGE_KEY);
            return json ? JSON.parse(json) : { ...DEFAULT_PROFILE };
        } catch {
            return { ...DEFAULT_PROFILE };
        }
    },

    async saveProfile(profile: Partial<LocalProfile>): Promise<void> {
        try {
            const current = await this.getProfile();
            const updated = { ...current, ...profile };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save local profile:', e);
        }
    },
};
