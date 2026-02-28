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

const getEnv = (key: string, value: string | undefined): string => {
    if (!value) {
        const error = `[SECURITY ERROR] Required environment variable "${key}" is missing. Check your .env file or Vercel settings.`;
        console.error(error);
        return '';
    }
    return value;
};

// EXPO_PUBLIC_ variables must be accessed statically for inlining to work.
// Do not use process.env[key] for these.
export const Config: AppConfig = {
    GEMINI_API_KEY: getEnv('EXPO_PUBLIC_GEMINI_API_KEY', process.env.EXPO_PUBLIC_GEMINI_API_KEY),
    SUPABASE_URL: getEnv('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
    SUPABASE_ANON_KEY: getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
    IS_PROD: process.env.NODE_ENV === 'production',
};

export const IS_SUPABASE_CONFIGURED = Boolean(
    Config.SUPABASE_URL &&
    Config.SUPABASE_ANON_KEY &&
    !Config.SUPABASE_URL.includes('your_')
);

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
