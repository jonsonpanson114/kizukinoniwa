
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/supabase';

type Story = Database['public']['Tables']['stories']['Row'];

const STORAGE_KEY = 'kizuki_local_stories';

export const LocalStoryStore = {
    async saveStory(story: Story): Promise<void> {
        try {
            const existing = await this.getStories();
            const updated = [story, ...existing];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save local story:', e);
        }
    },

    async getStories(): Promise<Story[]> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEY);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error('Failed to get local stories:', e);
            return [];
        }
    },

    async clear(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEY);
    }
};
