import Groq from 'groq-sdk';
import type { AiTutorResponse, UILang } from '@/types';
import { detectLanguageLeaks, buildLeakRetryNotice } from './languageGuard';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const FALLBACK_RESPONSE: AiTutorResponse = {
  conversation_reply: "Sorry, I couldn't process that. Could you try again?",
  correction_needed: false,
  corrected_sentence: null,
  error_type: null,
  tutor_feedback: null,
  key_expression: null,
};

function parseAiResponse(raw: string): AiTutorResponse {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  const parsed = JSON.parse(cleaned);

  if (typeof parsed.conversation_reply !== 'string' || typeof parsed.correction_needed !== 'boolean') {
    throw new Error('Invalid response shape');
  }

  return parsed as AiTutorResponse;
}

export async function callGroq(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  uiLang: UILang = 'ko',
): Promise<AiTutorResponse> {
  const attemptCall = async (
    msgs: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ): Promise<string> => {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: msgs,
      temperature: 0.4,
      max_tokens: 512,
      response_format: { type: 'json_object' },
    });
    return completion.choices[0]?.message?.content ?? '';
  };

  let rawContent: string;
  try {
    rawContent = await attemptCall(messages);
  } catch {
    throw new Error('Groq API call failed');
  }

  let parsed: AiTutorResponse;
  try {
    parsed = parseAiResponse(rawContent);
  } catch {
    try {
      rawContent = await attemptCall(messages);
      parsed = parseAiResponse(rawContent);
    } catch {
      return FALLBACK_RESPONSE;
    }
  }

  const leaks = detectLanguageLeaks(parsed, uiLang);
  if (leaks.length === 0) return parsed;

  if (process.env.NODE_ENV === 'development') {
    console.warn('[lang-leak] groq response leaked', leaks);
  }

  const retryMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    ...messages,
    { role: 'assistant', content: rawContent },
    { role: 'user', content: buildLeakRetryNotice(leaks, uiLang) },
  ];

  try {
    const retryRaw = await attemptCall(retryMessages);
    const retryParsed = parseAiResponse(retryRaw);
    const retryLeaks = detectLanguageLeaks(retryParsed, uiLang);
    if (retryLeaks.length === 0) return retryParsed;
    return retryParsed;
  } catch {
    return parsed;
  }
}
