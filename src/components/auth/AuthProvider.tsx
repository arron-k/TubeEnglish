'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { isPremiumEmail } from '@/lib/utils/paywall';

async function fetchUserStatus(premium: boolean): Promise<{ remaining: number | null; streakDays: number }> {
  try {
    const res = await fetch('/api/paywall/status');
    if (!res.ok) return { remaining: null, streakDays: 0 };
    const data = await res.json();
    return {
      remaining: premium ? -1 : (data.remaining ?? null),
      streakDays: data.streakDays ?? 0,
    };
  } catch {
    return { remaining: null, streakDays: 0 };
  }
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsLoading, setIsPremium, setDailyAiRemaining, setStreakDays } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      setUser(user);
      setIsLoading(false);

      const premium = isPremiumEmail(user?.email);
      setIsPremium(premium);

      if (user) {
        const { remaining, streakDays } = await fetchUserStatus(premium);
        setDailyAiRemaining(remaining);
        setStreakDays(streakDays);
      } else {
        setDailyAiRemaining(null);
        setStreakDays(0);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setUser(user);

      const premium = isPremiumEmail(user?.email);
      setIsPremium(premium);

      if (user) {
        const { remaining, streakDays } = await fetchUserStatus(premium);
        setDailyAiRemaining(remaining);
        setStreakDays(streakDays);
      } else {
        setDailyAiRemaining(null);
        setStreakDays(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setIsLoading, setIsPremium, setDailyAiRemaining, setStreakDays]);

  return <>{children}</>;
}
