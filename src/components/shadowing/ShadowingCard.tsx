'use client';

import { useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { RotateCcw, MessageCircle, ChevronRight } from 'lucide-react';
import ScoreDisplay from './ScoreDisplay';
import WordDiffView from './WordDiffView';
import UpgradeNudge from '@/components/paywall/UpgradeNudge';
import { useAuthStore } from '@/stores/authStore';
import type { MatchResult } from '@/types';

const CONFETTI_COLORS = ['#fbbf24', '#6172f3', '#10b981', '#f472b6', '#60a5fa', '#f97316'];

function Confetti() {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        angle: (i / 28) * 360 + Math.random() * 13,
        distance: 55 + Math.random() * 45,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 4 + Math.random() * 4,
        rotation: Math.random() * 360,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        return (
          <motion.span
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{
              x: Math.cos(rad) * p.distance,
              y: Math.sin(rad) * p.distance,
              opacity: 0,
              scale: 0.4,
              rotate: p.rotation,
            }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: 2,
              backgroundColor: p.color,
            }}
          />
        );
      })}
    </div>
  );
}

interface Props {
  matchResult: MatchResult;
  captionText?: string;
  onRetry?: () => void;
  onAiChat?: (text: string) => void;
  onNextCaption?: () => void;
}

export default function ShadowingCard({ matchResult, captionText, onRetry, onAiChat, onNextCaption }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const { isPremium, bumpStreakAnim } = useAuthStore();
  const showConfetti = matchResult.score >= 90 && !shouldReduceMotion;
  const showUpgradeNudge = matchResult.score >= 90 && !isPremium;

  useEffect(() => {
    if (matchResult.score >= 80) bumpStreakAnim();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: 'easeOut' }}
      className="overflow-hidden"
      aria-label="쉐도잉 결과"
    >
      <div className="relative mt-2 rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
        {showConfetti && <Confetti />}

        <div className="flex items-start gap-3">
          <ScoreDisplay score={matchResult.score} />
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              발음 결과
            </p>
            <WordDiffView wordResults={matchResult.wordResults} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={onRetry}
            disabled={!onRetry}
            className="flex min-h-[36px] items-center justify-center gap-1 rounded-lg bg-white px-2 text-[11px] font-semibold text-brand-600 shadow-sm transition-all active:scale-95 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-40 disabled:active:scale-100 dark:bg-gray-800 dark:text-brand-400 dark:hover:bg-gray-700"
            aria-label="다시 따라하기"
          >
            <RotateCcw className="h-3.5 w-3.5 flex-shrink-0" />
            <span>다시</span>
          </button>

          <button
            type="button"
            onClick={() => onAiChat?.(captionText ?? '')}
            disabled={!onAiChat}
            className="flex min-h-[36px] items-center justify-center gap-1 rounded-lg bg-white px-2 text-[11px] font-semibold text-accent-600 shadow-sm transition-all active:scale-95 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:opacity-40 disabled:active:scale-100 dark:bg-gray-800 dark:text-accent-400 dark:hover:bg-gray-700"
            aria-label="AI에게 물어보기"
          >
            <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>AI 질문</span>
          </button>

          <button
            type="button"
            onClick={onNextCaption}
            disabled={!onNextCaption}
            className="flex min-h-[36px] items-center justify-center gap-1 rounded-lg bg-brand-500 px-2 text-[11px] font-semibold text-white shadow-sm transition-all active:scale-95 hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-40 disabled:active:scale-100"
            aria-label="다음 문장으로"
          >
            <span>다음</span>
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
          </button>
        </div>

        {showUpgradeNudge && <UpgradeNudge />}
      </div>
    </motion.div>
  );
}
