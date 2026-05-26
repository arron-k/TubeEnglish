import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AiTutorResponse } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-latest',
];

// Cache the last working model for 1 hour to avoid probing on every request
let cachedModel: string | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

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

async function callWithModel(
  modelName: string,
  systemInstruction: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  lastUserMessage: string,
): Promise<AiTutorResponse> {
  const model = genAI.getGenerativeModel({ model: modelName });

  const chat = model.startChat({
    systemInstruction,
    history,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
    },
  });

  const result = await chat.sendMessage(lastUserMessage);
  return parseAiResponse(result.response.text());
}

export async function callGemini(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<AiTutorResponse> {
  const systemInstruction = messages.find((m) => m.role === 'system')?.content ?? '';
  const conversationMessages = messages.filter((m) => m.role !== 'system');
  const lastUserMessage = conversationMessages.at(-1)?.content ?? '';

  const history = conversationMessages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));

  // Use cached model if still valid
  if (cachedModel && Date.now() < cacheExpiresAt) {
    try {
      return await callWithModel(cachedModel, systemInstruction, history, lastUserMessage);
    } catch {
      cachedModel = null;
    }
  }

  // Probe models in order until one succeeds
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const response = await callWithModel(modelName, systemInstruction, history, lastUserMessage);
      cachedModel = modelName;
      cacheExpiresAt = Date.now() + CACHE_TTL_MS;
      return response;
    } catch {
      continue;
    }
  }

  return FALLBACK_RESPONSE;
}
