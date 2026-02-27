import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useStore } from '../stores/useStore';
import { COLORS } from '../constants/theme';
import { Config } from '../lib/config';
import { LocalProfileStore, LocalProfile } from '../lib/localProfileStore';

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

    // Local profile is always the source of truth for day/phase progress
    const localProfile = await LocalProfileStore.getProfile();

    // Set local profile immediately so the UI never shows stale/null data
    setProfile(localProfile);

    if (session?.user) {
        // Best-effort remote sync: only override local if remote is more advanced
        try {
            const remoteProfile = await fetchOrCreateProfile(session.user.id);
            if (remoteProfile) {
                const remoteDay = remoteProfile.current_day ?? 0;
                const isRemoteBetter = remoteDay > localProfile.current_day;
                const finalProfile: LocalProfile = {
                    id: String(remoteProfile.id),
                    current_phase: (isRemoteBetter ? remoteProfile.current_phase : localProfile.current_phase) || 1,
                    current_day: (isRemoteBetter ? remoteProfile.current_day : localProfile.current_day) || 1,
                    phase_started_at: (isRemoteBetter ? remoteProfile.phase_started_at : localProfile.phase_started_at) || null,
                    created_at: (remoteProfile.created_at || localProfile.created_at) || null,
                };

                setProfile(finalProfile);
                // Important: Keep local store in sync with the merged/new profile
                await LocalProfileStore.saveProfile(finalProfile);
            }
        } catch (e) {
            console.warn('Remote profile sync failed, using local:', e);
        }
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
