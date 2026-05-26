'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Mic, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { SpeechRecognitionState } from '@/types';

interface Props {
  state: SpeechRecognitionState;
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const sizeMap = {
  sm: { outer: 'h-8 w-8', inner: 'h-6 w-6', icon: 'h-3 w-3' },
  md: { outer: 'h-10 w-10', inner: 'h-8 w-8', icon: 'h-4 w-4' },
};

export default function MicButton({ state, onClick, disabled, size = 'md' }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const s = sizeMap[size];

  const isListening = state === 'listening';
  const isProcessing = state === 'processing';
  const isResult = state === 'result';
  const isError = state === 'error';
  const isActive = isListening || isProcessing;

  const innerColor = isListening
    ? 'bg-red-500 text-white'
    : isResult
      ? 'bg-green-500 text-white'
      : isError
        ? 'bg-red-400 text-white'
        : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isProcessing}
      className={`relative flex items-center justify-center rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed ${s.outer}`}
      aria-label={isListening ? '녹음 중지' : '쉐도잉 시작'}
      aria-pressed={isActive}
    >
      {isListening && !shouldReduceMotion && (
        <motion.span
          className="absolute inset-0 rounded-full bg-red-400 opacity-60"
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <span
        className={`relative z-10 flex items-center justify-center rounded-full transition-colors ${s.inner} ${innerColor}`}
      >
        {isProcessing ? (
          <Loader2 className={`${s.icon} animate-spin`} />
        ) : isResult ? (
          <CheckCircle2 className={s.icon} />
        ) : isError ? (
          <XCircle className={s.icon} />
        ) : (
          <Mic className={s.icon} />
        )}
      </span>
    </button>
  );
}
