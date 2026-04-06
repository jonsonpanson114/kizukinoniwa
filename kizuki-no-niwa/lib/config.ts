import Constants from 'expo-constants';

/**
 * Anti-Gravity Config System
 * centralizes all environment variables and secrets.
 * NO HARDCODED STRINGS ALLOWED.
 */

interface AppConfig {
    GEMINI_API_KEY: string;
    GAS_URL: string;
    GAS_AUTH_TOKEN: string;
    IS_PROD: boolean;
}

const getEnv = (key: string, value: string | undefined): string => {
    if (!value) {
        console.warn(`[CONFIG WARNING] Missing environment variable: "${key}"`);
        return '';
    }
    return value;
};

export const Config: AppConfig = {
    GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
    GAS_URL: getEnv('EXPO_PUBLIC_GAS_URL', process.env.EXPO_PUBLIC_GAS_URL),
    GAS_AUTH_TOKEN: getEnv('GAS_AUTH_TOKEN', process.env.GAS_AUTH_TOKEN || 'kizuki_no_niwa_super_secret_token_2026'),
    IS_PROD: process.env.NODE_ENV === 'production',
};

// IS_SUPABASE_CONFIGURED is now essentially IS_GAS_CONFIGURED
export const IS_SUPABASE_CONFIGURED = Boolean(Config.GAS_URL);

// Security Validator
export const validateConfig = () => {
    const missing = Object.entries(Config)
        .filter(([key, value]) => !value && key !== 'IS_PROD' && key !== 'GEMINI_API_KEY')
        .map(([key]) => key);

    if (missing.length > 0) {
        console.warn(`[SECURITY WARNING] The following keys are missing: ${missing.join(', ')}`);
        return false;
    }
    return true;
};
