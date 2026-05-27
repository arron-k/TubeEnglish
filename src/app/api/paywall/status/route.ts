import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPremiumEmail, FREE_DAILY_AI_LIMIT } from '@/lib/utils/paywall';
import { kstTodayString } from '@/lib/utils/dateKst';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ isPremium: false, dailyAiUsed: 0, remaining: FREE_DAILY_AI_LIMIT });
  }

  const premium = isPremiumEmail(user.email);
  const { data } = await supabase
    .from('users')
    .select('daily_ai_count, daily_ai_reset_date, streak_days')
    .eq('id', user.id)
    .single();

  const streakDays = data?.streak_days ?? 0;

  if (premium) {
    return NextResponse.json({ isPremium: true, dailyAiUsed: 0, remaining: -1, streakDays });
  }

  const today = kstTodayString();
  const usedToday = data?.daily_ai_reset_date === today ? (data?.daily_ai_count ?? 0) : 0;
  const remaining = Math.max(0, FREE_DAILY_AI_LIMIT - usedToday);

  return NextResponse.json({ isPremium: false, dailyAiUsed: usedToday, remaining, streakDays });
}
