import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { Config } from './config';

const ExpopSecureStoreAdapter = {
    getItem: (_key: string) => Promise.resolve(null),
    setItem: (_key: string, _value: string) => Promise.resolve(),
    removeItem: (_key: string) => Promise.resolve(),
};

const supabaseUrl = Config.SUPABASE_URL;
const supabaseAnonKey = Config.SUPABASE_ANON_KEY;

function createSafeClient(): SupabaseClient<Database> {
    // Use a dummy but valid URL when Supabase is not configured
    const url = supabaseUrl && !supabaseUrl.includes('your_')
        ? supabaseUrl
        : 'https://placeholder.supabase.co';
    const key = supabaseAnonKey && !supabaseAnonKey.includes('your_')
        ? supabaseAnonKey
        : 'placeholder-key';

    return createClient<Database>(url, key, {
        auth: {
            storage: ExpopSecureStoreAdapter,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    });
}

export const supabase = createSafeClient();
