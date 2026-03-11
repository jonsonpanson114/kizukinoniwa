// 猫の状態管理ストア

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CatReactionType } from '../types/cat';

export interface CatState {
  currentReaction: CatReactionType;
  isAnimating: boolean;
  lastTrigger: string | null;
  history: CatReactionType[];

  setReaction: (reaction: CatReactionType) => void;
  resetReaction: () => void;
}

export const useCatStore = create<CatState>()(
  persist(
    (set) => ({
      currentReaction: 'sleeping',
      isAnimating: false,
      lastTrigger: null,
      history: [],

      setReaction: (reaction) => set((state) => ({
        currentReaction: reaction,
        isAnimating: true,
        lastTrigger: new Date().toISOString(),
        history: [reaction, ...state.history].slice(0, 10),
      })),

      resetReaction: () => set({
        currentReaction: 'sleeping',
        isAnimating: false,
      }),
    }),
    {
      name: 'cat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
