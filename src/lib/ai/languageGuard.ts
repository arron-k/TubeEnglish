import type { AiTutorResponse, UILang } from '@/types';

const HAN_KANA = /[぀-ヿ一-鿿㐀-䶿]/;
const HANGUL = /[가-힯ᄀ-ᇿ㄰-㆏]/;
const CJK_ANY = /[가-힯ᄀ-ᇿ㄰-㆏぀-ヿ一-鿿㐀-䶿]/;

export interface LanguageLeak {
  field: string;
  reason: string;
  sample: string;
}

export function detectLanguageLeaks(
  response: AiTutorResponse,
  uiLang: UILang,
): LanguageLeak[] {
  const leaks: LanguageLeak[] = [];

  const englishOnly = (text: string | null | undefined, field: string) => {
    if (!text) return;
    if (CJK_ANY.test(text)) {
      leaks.push({ field, reason: 'non-English characters in English field', sample: text.slice(0, 80) });
    }
  };

  englishOnly(response.conversation_reply, 'conversation_reply');
  englishOnly(response.corrected_sentence, 'corrected_sentence');
  englishOnly(response.key_expression?.expression, 'key_expression.expression');
  englishOnly(response.key_expression?.example, 'key_expression.example');

  if (response.tutor_feedback) {
    if (uiLang === 'ko' && HAN_KANA.test(response.tutor_feedback)) {
      leaks.push({
        field: 'tutor_feedback',
        reason: 'Han/Kana characters in Korean feedback',
        sample: response.tutor_feedback.slice(0, 80),
      });
    }
    if (uiLang === 'en' && (HANGUL.test(response.tutor_feedback) || HAN_KANA.test(response.tutor_feedback))) {
      leaks.push({
        field: 'tutor_feedback',
        reason: 'non-English characters in English feedback',
        sample: response.tutor_feedback.slice(0, 80),
      });
    }
  }

  return leaks;
}

export function buildLeakRetryNotice(leaks: LanguageLeak[], uiLang: UILang): string {
  const fieldList = leaks.map((l) => `${l.field} (${l.reason})`).join(', ');
  if (uiLang === 'ko') {
    return `이전 응답에 한자 또는 가나 문자가 섞여 있었습니다 (${fieldList}). 다시 응답하되, tutor_feedback는 순수 한글만 사용하고, conversation_reply / corrected_sentence / key_expression은 영어만 사용하세요. 한자어는 반드시 한글로 표기하세요 (例: 料理→요리, 自然→자연).`;
  }
  return `Your previous response contained characters from the wrong language (${fieldList}). Regenerate the response with strict language purity per the system instructions.`;
}
