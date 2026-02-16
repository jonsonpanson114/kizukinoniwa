import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/supabase';

const ExpopSecureStoreAdapter = {
    getItem: (key: string) => {
        // Temporary in-memory storage for web preview
        return Promise.resolve(null);
    },
    setItem: (key: string, value: string) => {
        return Promise.resolve();
    },
    removeItem: (key: string) => {
        return Promise.resolve();
    },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpopSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
