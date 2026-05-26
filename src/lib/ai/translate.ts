import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

function buildTranslatePrompt(text: string, targetLang: string): string {
  const langName = LANG_NAMES[targetLang] ?? targetLang;
  return `Translate the following English text to ${langName}. Return ONLY valid JSON with a single key "translation". No explanation, no markdown.

Text: "${text}"

Example output: {"translation": "번역된 텍스트"}`;
}

function extractTranslation(raw: string): string {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  const parsed = JSON.parse(cleaned);
  if (typeof parsed.translation !== 'string' || !parsed.translation.trim()) {
    throw new Error('Invalid translation shape');
  }
  return parsed.translation.trim();
}

async function translateViaGroq(text: string, targetLang: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: buildTranslatePrompt(text, targetLang) }],
    temperature: 0.1,
    max_tokens: 256,
    response_format: { type: 'json_object' },
  });
  return extractTranslation(completion.choices[0]?.message?.content ?? '');
}

async function translateViaGemini(text: string, targetLang: string): Promise<string> {
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.1, maxOutputTokens: 256, responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(buildTranslatePrompt(text, targetLang));
      return extractTranslation(result.response.text());
    } catch {
      continue;
    }
  }
  throw new Error('All Gemini models failed');
}

export async function translateText(text: string, targetLang = 'ko'): Promise<string> {
  try {
    return await translateViaGroq(text, targetLang);
  } catch {
    return await translateViaGemini(text, targetLang);
  }
}
