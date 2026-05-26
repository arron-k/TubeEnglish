import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { kstTodayString, kstYesterdayString, toKstDateString } from '@/lib/utils/dateKst';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      videoId,
      videoTitle,
      videoThumbnailUrl,
      watchedDuration,
      shadowingCount,
      averageShadowingScore,
      aiConversationCount,
    } = await request.json();

    const { error: insertError } = await supabase.from('learning_logs').insert({
      user_id: user.id,
      video_id: videoId,
      video_title: videoTitle,
      video_thumbnail_url: videoThumbnailUrl ?? null,
      watched_duration: Math.round(watchedDuration),
      completed_shadowing_count: shadowingCount,
      average_shadowing_score: averageShadowingScore || null,
      ai_conversation_count: aiConversationCount,
    });

    if (insertError) {
      console.error('[save-session] learning_logs insert error:', insertError);
      return NextResponse.json(
        { error: 'insert_failed', detail: insertError.message },
        { status: 500 }
      );
    }

    const { data: userData, error: selectError } = await supabase
      .from('users')
      .select('streak_days, longest_streak, last_learned_at, total_learning_minutes')
      .eq('id', user.id)
      .single();

    if (selectError) {
      console.error('[save-session] users select error:', selectError);
      return NextResponse.json(
        { error: 'select_failed', detail: selectError.message },
        { status: 500 }
      );
    }

    if (userData) {
      const todayStr = kstTodayString();
      const lastStr = userData.last_learned_at ? toKstDateString(userData.last_learned_at) : null;

      let newStreak = userData.streak_days;
      if (lastStr !== todayStr) {
        newStreak = lastStr === kstYesterdayString() ? userData.streak_days + 1 : 1;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          streak_days: newStreak,
          longest_streak: Math.max(newStreak, userData.longest_streak),
          last_learned_at: new Date().toISOString(),
          total_learning_minutes:
            userData.total_learning_minutes + Math.floor(watchedDuration / 60),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('[save-session] users update error:', updateError);
        return NextResponse.json(
          { error: 'update_failed', detail: updateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[save-session] unexpected error:', err);
    return NextResponse.json(
      { error: 'internal_error', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
