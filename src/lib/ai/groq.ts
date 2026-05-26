import Groq from 'groq-sdk';
import type { AiTutorResponse } from '@/types';

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
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<AiTutorResponse> {
  const attemptCall = async (): Promise<string> => {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 512,
      response_format: { type: 'json_object' },
    });
    return completion.choices[0]?.message?.content ?? '';
  };

  let rawContent: string;
  try {
    rawContent = await attemptCall();
  } catch {
    throw new Error('Groq API call failed');
  }

  try {
    return parseAiResponse(rawContent);
  } catch {
    // retry once
    try {
      rawContent = await attemptCall();
      return parseAiResponse(rawContent);
    } catch {
      return FALLBACK_RESPONSE;
    }
  }
}
