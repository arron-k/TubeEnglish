'use client';

import { motion, useReducedMotion } from 'framer-motion';
import ScoreDisplay from './ScoreDisplay';
import WordDiffView from './WordDiffView';
import type { MatchResult } from '@/types';

interface Props {
  matchResult: MatchResult;
}

export default function ShadowingCard({ matchResult }: Props) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -4 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
      className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30"
      aria-label="쉐도잉 결과"
    >
      <div className="flex items-start gap-3">
        <ScoreDisplay score={matchResult.score} />
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            발음 결과
          </p>
          <WordDiffView wordResults={matchResult.wordResults} />
        </div>
      </div>
    </motion.div>
  );
}
