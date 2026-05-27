import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isPremium: boolean;
  dailyAiRemaining: number | null; // null = not fetched yet, -1 = unlimited (premium)
  streakDays: number;
  streakBumpCount: number;
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsPremium: (v: boolean) => void;
  setDailyAiRemaining: (v: number | null) => void;
  decrementDailyAi: () => void;
  setStreakDays: (v: number) => void;
  bumpStreakAnim: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isPremium: false,
  dailyAiRemaining: null,
  streakDays: 0,
  streakBumpCount: 0,
  setUser: (user) => set({ user }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsPremium: (v) => set({ isPremium: v }),
  setDailyAiRemaining: (v) => set({ dailyAiRemaining: v }),
  decrementDailyAi: () => {
    const { dailyAiRemaining, isPremium } = get();
    if (isPremium || dailyAiRemaining === null || dailyAiRemaining === -1) return;
    set({ dailyAiRemaining: Math.max(0, dailyAiRemaining - 1) });
  },
  setStreakDays: (v) => set({ streakDays: v }),
  bumpStreakAnim: () => set((s) => ({ streakBumpCount: s.streakBumpCount + 1 })),
}));
