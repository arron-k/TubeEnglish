import { NextRequest, NextResponse } from 'next/server';
import type { UILang, LearningLevel, ChatMessage } from '@/types';
import { buildSystemPrompt, buildMessages } from '@/lib/ai/prompts';
import { callGroq } from '@/lib/ai/groq';
import { callGemini } from '@/lib/ai/gemini';

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
