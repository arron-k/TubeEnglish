'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useChatStore } from '@/stores/chatStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { calculateMatchScore } from '@/lib/utils/textMatching';
import type { MatchResult } from '@/types';

const PASS_THRESHOLD = 80;
const MAX_ATTEMPTS = 3;

function ConfettiParticle({ index }: { index: number }) {
  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
  const color = colors[index % colors.length];
  const x = (Math.random() - 0.5) * 400;
  const rotate = Math.random() * 720 - 360;

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-sm"
      style={{ backgroundColor: color, originX: 0.5, originY: 0.5 }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
      animate={{ x, y: -200 - Math.random() * 100, opacity: 0, scale: 0.5, rotate }}
      transition={{ duration: 0.9 + Math.random() * 0.4, ease: 'easeOut' }}
    />
  );
}

function WordDiff({ target, spokenResult }: { target: string; spokenResult: MatchResult }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-1 text-sm font-medium">
      {spokenResult.wordResults.map((wr, i) => (
        <span
          key={i}
          className={
            wr.matched
              ? 'rounded bg-emerald-100 px-1 text-emerald-700 underline decoration-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'rounded bg-red-100 px-1 text-red-600 line-through decoration-red-400 dark:bg-red-900/40 dark:text-red-400'
          }
          aria-label={wr.matched ? `${wr.word} 맞음` : `${wr.word} 틀림`}
        >
          {wr.word}
        </span>
      ))}
    </div>
  );
}

type PracticeState = 'ready' | 'listening' | 'processing' | 'passed' | 'failed';

export default function RePracticeOverlay() {
  const shouldReduceMotion = useReducedMotion();
  const {
    repracticeTarget,
    repracticeAttempts,
    completeRepractice,
    skipRepractice,
    incrementRepracticeAttempts,
  } = useChatStore();

  const [practiceState, setPracticeState] = useState<PracticeState>('ready');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const hasAutoListened = useRef(false);

  const { speak, isSpeaking, cancel: cancelTTS } = useSpeechSynthesis();
  const {
    state: speechState,
    finalTranscript,
    start: startSTT,
    reset: resetSTT,
  } = useSpeechRecognition();

  // Auto-play TTS on mount for the target sentence
  useEffect(() => {
    if (repracticeTarget && !hasAutoListened.current) {
      hasAutoListened.current = true;
      speak(repracticeTarget);
    }
    return () => {
      cancelTTS();
      resetSTT();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repracticeTarget]);

  // Evaluate once STT gives final result
  useEffect(() => {
    if (speechState === 'result' && finalTranscript && repracticeTarget) {
      setPracticeState('processing');
      const result = calculateMatchScore(repracticeTarget, finalTranscript, true);
      setMatchResult(result);
      incrementRepracticeAttempts();

      if (result.score >= PASS_THRESHOLD) {
        setPracticeState('passed');
        if (!shouldReduceMotion) setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1200);
      } else {
        setPracticeState('failed');
      }
    }
  }, [speechState, finalTranscript, repracticeTarget, incrementRepracticeAttempts, shouldReduceMotion]);

  const handleListen = useCallback(() => {
    cancelTTS();
    setPracticeState('listening');
    resetSTT();
    startSTT();
  }, [cancelTTS, resetSTT, startSTT]);

  const handleRetry = useCallback(() => {
    setMatchResult(null);
    setPracticeState('ready');
    resetSTT();
  }, [resetSTT]);

  const handlePlayTTS = useCallback(() => {
    if (isSpeaking) {
      cancelTTS();
    } else if (repracticeTarget) {
      speak(repracticeTarget);
    }
  }, [isSpeaking, cancelTTS, speak, repracticeTarget]);

  if (!repracticeTarget) return null;

  const canSkip = repracticeAttempts >= MAX_ATTEMPTS;
  const isListening = practiceState === 'listening';

  return (
    <AnimatePresence>
      <motion.div
        key="repractice-overlay"
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
        className="relative mx-4 mb-3 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 p-4 shadow-md dark:border-indigo-800/60 dark:from-indigo-950/50 dark:via-purple-950/40 dark:to-blue-950/50"
        role="region"
        aria-label="재연습 모드"
        aria-live="polite"
      >
        {/* Confetti particles */}
        {showConfetti && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 24 }, (_, i) => (
              <ConfettiParticle key={i} index={i} />
            ))}
          </div>
        )}

        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🎯</span>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
              재연습 모드
            </span>
          </div>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
            {repracticeAttempts}/{MAX_ATTEMPTS}회 시도
          </span>
        </div>

        {/* Target sentence */}
        <div className="mb-3 rounded-xl bg-white/70 px-3.5 py-3 dark:bg-white/5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
            목표 문장
          </p>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-snug text-gray-800 dark:text-gray-100">
              {repracticeTarget}
            </p>
            <button
              onClick={handlePlayTTS}
              aria-label={isSpeaking ? '음성 중지' : '목표 문장 듣기'}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-colors hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300"
            >
              {isSpeaking ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Score result */}
        <AnimatePresence mode="wait">
          {matchResult && (practiceState === 'passed' || practiceState === 'failed') && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-3"
            >
              {/* Score badge */}
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`text-lg font-bold ${
                    practiceState === 'passed'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {matchResult.score}%
                </span>
                <span className="text-sm">
                  {practiceState === 'passed' ? '🎉' : '💪'}
                </span>
              </div>

              {/* Word diff */}
              <div className="mb-2 rounded-lg bg-white/60 p-2.5 dark:bg-white/5">
                <WordDiff target={repracticeTarget} spokenResult={matchResult} />
              </div>

              {/* Feedback message */}
              <p
                className={`text-center text-xs font-medium ${
                  practiceState === 'passed'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-amber-700 dark:text-amber-300'
                }`}
              >
                {practiceState === 'passed'
                  ? '완벽해요! 이번엔 정말 잘했어요 🎊'
                  : matchResult.score >= 60
                  ? '거의 다 왔어요! 한 번 더 해볼까요?'
                  : '조금 더 연습하면 분명 잘할 수 있어요!'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="space-y-2">
          {practiceState === 'passed' ? (
            <button
              onClick={completeRepractice}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              ✅ 대화 계속하기
            </button>
          ) : practiceState === 'failed' ? (
            <button
              onClick={handleRetry}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              🎙️ 다시 시도
            </button>
          ) : (
            <button
              onClick={handleListen}
              disabled={isSpeaking}
              aria-label="말하기 시작"
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 dark:bg-red-500'
                  : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
              }`}
            >
              {isListening ? (
                <>
                  <motion.span
                    animate={shouldReduceMotion ? {} : { scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-flex h-4 w-4 items-center justify-center"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                  </motion.span>
                  듣고 있어요...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                  말하기
                </>
              )}
            </button>
          )}

          {canSkip && practiceState !== 'passed' && (
            <button
              onClick={skipRepractice}
              className="w-full rounded-xl border border-gray-200 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              나중에 복습하기
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
