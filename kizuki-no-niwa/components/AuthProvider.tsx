import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useStore } from '../stores/useStore';
import { COLORS } from '../constants/theme';
import { Config } from '../lib/config';
import { LocalProfileStore } from '../lib/localProfileStore';

const isSupabaseConfigured = Boolean(
    Config.SUPABASE_URL &&
    Config.SUPABASE_ANON_KEY &&
    !Config.SUPABASE_URL.includes('your_')
);

async function fetchOrCreateProfile(userId: string) {
    // Try to fetch existing profile
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (data) return data;

    // Profile doesn't exist — create initial record
    if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                current_phase: 1,
                current_day: 1,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating profile:', insertError);
            return null;
        }
        return newProfile;
    }

    console.error('Error fetching profile:', error);
    return null;
}

async function handleSession(session: Session | null) {
    const { setSession, setProfile } = useStore.getState();
    setSession(session);

    const localProfile = await LocalProfileStore.getProfile();

    if (session?.user) {
        const remoteProfile = await fetchOrCreateProfile(session.user.id);
        // Use whichever profile is more advanced (local wins if ahead)
        if (remoteProfile && localProfile.current_day > (remoteProfile.current_day ?? 1)) {
            setProfile({ ...remoteProfile, ...localProfile, id: remoteProfile.id });
        } else {
            setProfile(remoteProfile);
        }
    } else {
        // No auth session — use local profile
        setProfile(localProfile);
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(!isSupabaseConfigured);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            console.warn('[AuthProvider] Supabase not configured — running in offline mode');
            // Load profile from local storage
            LocalProfileStore.getProfile().then((localProfile) => {
                useStore.getState().setProfile(localProfile);
            });
            return;
        }

        // Check for existing session
        supabase.auth.getSession()
            .then(({ data: { session } }) => handleSession(session))
            .catch((err) => console.error('Auth session error:', err))
            .finally(() => setIsReady(true));

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!isSupabaseConfigured) return;
        if (isReady && !useStore.getState().session) {
            // Auto sign-in anonymously if no session
            supabase.auth.signInAnonymously().then(({ error }) => {
                if (error) console.error('Error signing in anonymously:', error);
            });
        }
    }, [isReady]);

    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.washi }}>
                <ActivityIndicator color={COLORS.sumi} size="large" />
            </View>
        );
    }

    return <>{children}</>;
}
