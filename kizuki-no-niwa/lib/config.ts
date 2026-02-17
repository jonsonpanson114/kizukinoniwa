import Constants from 'expo-constants';

/**
 * Anti-Gravity Config System
 * centralizes all environment variables and secrets.
 * NO HARDCODED STRINGS ALLOWED.
 */

interface AppConfig {
    GEMINI_API_KEY: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    IS_PROD: boolean;
}

const getEnv = (key: string, required = true): string => {
    // Priority: process.env (Vercel) > expo-constants (Local)
    const value = process.env[key] || Constants.expoConfig?.extra?.[key];

    if (required && !value) {
        const error = `[SECURITY ERROR] Required environment variable "${key}" is missing. Check your .env file or Vercel settings.`;
        console.error(error);
        // We don't throw here to avoid crashing during build/preview, 
        // but return empty to trigger API fallbacks with logs.
        return '';
    }
    return value || '';
};

export const Config: AppConfig = {
    GEMINI_API_KEY: getEnv('EXPO_PUBLIC_GEMINI_API_KEY'),
    SUPABASE_URL: getEnv('EXPO_PUBLIC_SUPABASE_URL'),
    SUPABASE_ANON_KEY: getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    IS_PROD: process.env.NODE_ENV === 'production',
};

// Security Validator
export const validateConfig = () => {
    const missing = Object.entries(Config)
        .filter(([key, value]) => !value && key !== 'IS_PROD')
        .map(([key]) => key);

    if (missing.length > 0) {
        console.warn(`[SECURITY WARNING] The following keys are missing: ${missing.join(', ')}`);
        return false;
    }
    return true;
};
