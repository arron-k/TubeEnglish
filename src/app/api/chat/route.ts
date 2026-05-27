import { NextRequest, NextResponse } from 'next/server';
import type { UILang, LearningLevel, ChatMessage } from '@/types';
import { buildSystemPrompt, buildMessages } from '@/lib/ai/prompts';
import { callGroq } from '@/lib/ai/groq';
import { callGemini } from '@/lib/ai/gemini';
import { createClient } from '@/lib/supabase/server';
import { isPremiumEmail, FREE_DAILY_AI_LIMIT } from '@/lib/utils/paywall';
import { kstTodayString } from '@/lib/utils/dateKst';

interface ChatRequestBody {
  userMessage: string;
  currentLevel?: LearningLevel;
  uiLang?: UILang;
  videoContext?: string;
  history?: ChatMessage[];
}

export async function POST(request: NextRequest) {
  let body: ChatRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { userMessage, currentLevel = 'beginner', uiLang = 'ko', videoContext, history = [] } = body;

  if (!userMessage?.trim()) {
    return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
  }

  // Daily limit enforcement for logged-in free users
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && !isPremiumEmail(user.email)) {
      const { data: userData } = await supabase
        .from('users')
        .select('daily_ai_count, daily_ai_reset_date')
        .eq('id', user.id)
        .single();

      const today = kstTodayString();
      const isNewDay = userData?.daily_ai_reset_date !== today;
      const currentCount = isNewDay ? 0 : (userData?.daily_ai_count ?? 0);

      if (currentCount >= FREE_DAILY_AI_LIMIT) {
        return NextResponse.json({ error: 'daily_limit_reached', remaining: 0 }, { status: 429 });
      }

      await supabase
        .from('users')
        .update({ daily_ai_count: currentCount + 1, daily_ai_reset_date: today })
        .eq('id', user.id);
    }
  } catch {
    // Fail open — don't block chat if limit check itself errors
  }

  const systemPrompt = buildSystemPrompt(uiLang, currentLevel, videoContext);
  const messages = buildMessages(systemPrompt, history.slice(-20), userMessage);

  try {
    const response = await callGroq(messages, uiLang);
    return NextResponse.json(response);
  } catch {
    try {
      const response = await callGemini(messages, uiLang);
      return NextResponse.json(response);
    } catch {
      return NextResponse.json(
        {
          conversation_reply: "Sorry, I couldn't process that. Could you try again?",
          correction_needed: false,
          corrected_sentence: null,
          error_type: null,
          tutor_feedback: null,
          key_expression: null,
        },
        { status: 200 }
      );
    }
  }
}
