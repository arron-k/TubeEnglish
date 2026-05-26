'use client';

import { useRef, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/playerStore';
import MicButton from '@/components/shadowing/MicButton';
import ShadowingCard from '@/components/shadowing/ShadowingCard';
import type { Caption, SpeechRecognitionState, MatchResult } from '@/types';

interface Props {
  caption: Caption;
  isActive: boolean;
  micState: SpeechRecognitionState;
  interimTranscript: string;
  finalTranscript: string;
  matchResult: MatchResult | null;
  micDisabled?: boolean;
  onMicClick: () => void;
  onWordClick: (word: string, e: React.MouseEvent) => void;
}

export default function CaptionItem({
  caption,
  isActive,
  micState,
  interimTranscript,
  finalTranscript,
  matchResult,
  micDisabled,
  onMicClick,
  onWordClick,
}: Props) {
  const seekTo = usePlayerStore((s) => s.seekTo);
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const showTranscript = isActive && (interimTranscript || finalTranscript) && !matchResult;
  const displayText = finalTranscript || interimTranscript;
  const isFinal = !!finalTranscript;

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive]);

  return (
    <motion.div
      ref={ref}
      animate={{
        backgroundColor: isActive ? '#6172f3' : 'rgba(0,0,0,0)',
      }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeInOut' }}
      className="rounded-lg px-3 py-2"
    >
      <div className="flex items-start gap-2">
        <span
          className={`flex-1 cursor-pointer text-sm leading-relaxed transition-colors duration-200 ${
            isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => seekTo(caption.offset)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') seekTo(caption.offset); }}
          aria-label={`자막: ${caption.text}`}
        >
          {caption.text.split(/(\s+)/).map((token, i) =>
            /^\s+$/.test(token) ? (
              token
            ) : (
              <span
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onWordClick(token, e);
                }}
                className={`rounded px-0.5 transition-colors hover:underline hover:decoration-dotted ${
                  isActive
                    ? 'hover:bg-white/20'
                    : 'hover:bg-indigo-50 dark:hover:bg-indigo-950'
                }`}
              >
                {token}
              </span>
            )
          )}
        </span>

        {isActive && (
          <MicButton state={micState} onClick={onMicClick} size="sm" disabled={micDisabled} />
        )}
      </div>

      <AnimatePresence mode="wait">
        {showTranscript && (
          <motion.div
            key="transcript"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="mt-1.5 overflow-hidden"
          >
            <p
              className={`text-xs leading-relaxed ${
                isFinal ? 'font-medium text-yellow-200' : 'italic text-indigo-200'
              }`}
              aria-live="polite"
              aria-label={`인식된 텍스트: ${displayText}`}
            >
              {displayText}
            </p>
          </motion.div>
        )}
        {isActive && matchResult && (
          <ShadowingCard key="result" matchResult={matchResult} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
