'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import type { AiTutorResponse } from '@/types';

const ERROR_TYPE_LABEL: Record<string, string> = {
  verb_tense: '동사 시제',
  subject_verb_agreement: '주어-동사 일치',
  article: '관사',
  preposition: '전치사',
  word_choice: '단어 선택',
  spelling: '철자',
  other: '표현',
};

interface Props {
  tutorResponse: AiTutorResponse;
  onRepractice?: (correctedSentence: string) => void;
  onDismiss?: () => void;
}

function DiffView({ original, corrected }: { original: string; corrected: string }) {
  const origWords = original.trim().split(/\s+/);
  const corrWords = corrected.trim().split(/\s+/);

  const corrSet = new Set(corrWords.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, '')));
  const origSet = new Set(origWords.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, '')));

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-x-1 gap-y-0.5 text-sm">
        {origWords.map((word, i) => {
          const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, '');
          const isChanged = !corrSet.has(normalized);
          return (
            <span
              key={i}
              className={
                isChanged
                  ? 'text-red-500 line-through dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-300'
              }
            >
              {word}
            </span>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-1 gap-y-0.5 text-sm font-medium">
        {corrWords.map((word, i) => {
          const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, '');
          const isNew = !origSet.has(normalized);
          return (
            <span
              key={i}
              className={
                isNew
                  ? 'rounded bg-blue-100 px-0.5 text-blue-700 underline decoration-blue-400 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-200'
              }
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function CorrectionCard({ tutorResponse, onRepractice, onDismiss }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const { speak, isSpeaking, cancel } = useSpeechSynthesis();

  const { corrected_sentence, error_type, tutor_feedback, key_expression } = tutorResponse;
  if (!corrected_sentence) return null;

  const errorLabel = error_type ? (ERROR_TYPE_LABEL[error_type] ?? '표현') : null;

  const handleTTS = () => {
    if (isSpeaking) {
      cancel();
    } else {
      speak(corrected_sentence);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
      className="w-full rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-3.5 dark:border-blue-800/60 dark:from-blue-950/40 dark:to-indigo-950/40"
      role="region"
      aria-label="교정 피드백"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">✏️</span>
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
            이렇게 말하면 더 자연스러워요
          </span>
          {errorLabel && (
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
              {errorLabel}
            </span>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="교정 카드 닫기"
            className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <DiffView original={tutorResponse.conversation_reply} corrected={corrected_sentence} />

      <div className="my-2 border-t border-blue-200/60 dark:border-blue-700/40" />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {tutor_feedback && (
            <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-200">
              {tutor_feedback}
            </p>
          )}
          {key_expression && (
            <div className="mt-2 rounded-lg bg-white/60 px-2.5 py-2 dark:bg-white/5">
              <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                💡 {key_expression.expression}
              </p>
              <p className="mt-0.5 text-[11px] italic text-gray-500 dark:text-gray-400">
                "{key_expression.example}"
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleTTS}
          aria-label={isSpeaking ? '음성 중지' : '교정 문장 듣기'}
          className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-colors hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/60"
        >
          {isSpeaking ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
          )}
        </button>
      </div>

      {onRepractice && (
        <button
          onClick={() => onRepractice(corrected_sentence)}
          className="mt-3 w-full rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-brand-700 active:scale-[0.98] dark:bg-brand-500 dark:hover:bg-brand-600"
          aria-label="교정 문장으로 다시 연습하기"
        >
          🎙️ 다시 연습하기
        </button>
      )}
    </motion.div>
  );
}
