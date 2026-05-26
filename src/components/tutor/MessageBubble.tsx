'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import CorrectionCard from './CorrectionCard';
import type { AiTutorResponse } from '@/types';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  tutorResponse?: AiTutorResponse;
  onRepractice?: (correctedSentence: string) => void;
}

function TubeAvatar() {
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-bold text-white shadow-sm">
      T
    </div>
  );
}

function SpeakerButton({ text }: { text: string }) {
  const { isSpeaking, speak, cancel } = useSpeechSynthesis();

  const handleClick = () => {
    if (isSpeaking) {
      cancel();
    } else {
      speak(text);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={isSpeaking ? '음성 중지' : '음성으로 듣기'}
      className="mt-1 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-700 dark:hover:text-brand-400"
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
  );
}

export default function MessageBubble({ role, content, tutorResponse, onRepractice }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const [showCorrection, setShowCorrection] = useState(true);

  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && <TubeAvatar />}

      <div className={`flex max-w-[85%] flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && (
          <span className="ml-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            Tube
          </span>
        )}

        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-sm bg-brand-600 text-white'
              : 'rounded-tl-sm bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
          }`}
        >
          {content}
        </div>

        {!isUser && (
          <div className="flex items-center gap-1">
            <SpeakerButton text={content} />
          </div>
        )}

        {!isUser && tutorResponse?.correction_needed && showCorrection && (
          <CorrectionCard
            tutorResponse={tutorResponse}
            onRepractice={onRepractice}
            onDismiss={() => setShowCorrection(false)}
          />
        )}
      </div>
    </motion.div>
  );
}
