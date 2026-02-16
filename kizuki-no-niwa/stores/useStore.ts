import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

interface UserProfile {
    id: string;
    current_phase: number | null;
    current_day: number | null;
    phase_started_at: string | null;
    created_at?: string | null;
}

interface AppState {
    session: Session | null;
    profile: UserProfile | null;
    setSession: (session: Session | null) => void;
    setProfile: (profile: UserProfile | null) => void;
}

export const useStore = create<AppState>((set) => ({
    session: null,
    profile: null,
    setSession: (session) => set({ session }),
    setProfile: (profile) => set({ profile }),
}));
