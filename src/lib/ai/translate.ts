import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TranslationResult } from '@/types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'];

const LANG_NAMES: Record<string, string> = {
  ko: '한국어',
  ja: '日本語',
  zh: '中文',
  th: 'ภาษาไทย',
  en: 'English',
};

function buildFullPrompt(text: string, targetLang: string): string {
  const langName = LANG_NAMES[targetLang] ?? targetLang;
  return `You are an English teacher and ${langName} translator. Analyze this English sentence and return ONLY valid JSON — no markdown, no explanation.

Sentence: "${text}"

Return JSON with this exact shape:
{
  "natural": "${langName}로 자연스러운 의역 (표현의 뉘앙스와 맥락을 살려서)",
  "literal": "영어 어순 그대로의 직역 (단어 하나하나 대응)",
  "keyExpression": {
    "original": "most interesting/idiomatic phrase (2-5 words)",
    "meaning": "${langName}로 핵심 의미"
  }
}

If there is no particularly noteworthy expression, set keyExpression to null.`;
}

function extractFull(raw: string): TranslationResult {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  const parsed = JSON.parse(cleaned);
  if (typeof parsed.natural !== 'string' || typeof parsed.literal !== 'string') {
    throw new Error('Invalid translation shape');
  }
  return {
    natural: parsed.natural.trim(),
    literal: parsed.literal.trim(),
    keyExpression:
      parsed.keyExpression &&
      typeof parsed.keyExpression.original === 'string' &&
      typeof parsed.keyExpression.meaning === 'string'
        ? { original: parsed.keyExpression.original.trim(), meaning: parsed.keyExpression.meaning.trim() }
        : null,
  };
}

async function translateFullViaGroq(text: string, targetLang: string): Promise<TranslationResult> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: buildFullPrompt(text, targetLang) }],
    temperature: 0.2,
    max_tokens: 512,
    response_format: { type: 'json_object' },
  });
  return extractFull(completion.choices[0]?.message?.content ?? '');
}

async function translateFullViaGemini(text: string, targetLang: string): Promise<TranslationResult> {
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.2, maxOutputTokens: 512, responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(buildFullPrompt(text, targetLang));
      return extractFull(result.response.text());
    } catch {
      continue;
    }
  }
  throw new Error('All Gemini models failed');
}

export async function translateFull(text: string, targetLang = 'ko'): Promise<TranslationResult> {
  try {
    return await translateFullViaGroq(text, targetLang);
  } catch {
    return await translateFullViaGemini(text, targetLang);
  }
}
