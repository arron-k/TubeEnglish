'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { WordResult } from '@/types';

interface Props {
  wordResults: WordResult[];
}

export default function WordDiffView({ wordResults }: Props) {
  const shouldReduceMotion = useReducedMotion();

  if (wordResults.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1" aria-label="단어별 발음 결과" role="list">
      {wordResults.map((wr, i) => (
        <motion.span
          key={`${wr.word}-${wr.index}`}
          role="listitem"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: shouldReduceMotion ? 0 : i * 0.04, duration: 0.15 }}
          className={`inline-block rounded px-1 py-0.5 text-xs font-medium ${
            wr.matched
              ? 'bg-green-100 text-green-800 underline dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-700 line-through dark:bg-red-900/30 dark:text-red-400'
          }`}
          aria-label={`${wr.word} ${wr.matched ? '정확' : '틀림'}`}
        >
          {wr.word}
        </motion.span>
      ))}
    </div>
  );
}
