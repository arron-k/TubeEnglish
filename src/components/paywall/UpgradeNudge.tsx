'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function UpgradeNudge() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : 0.5 }}
      className="overflow-hidden"
    >
      <div className="mt-2 rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-3 py-2.5 dark:border-violet-900/40 dark:from-violet-950/30 dark:to-indigo-950/30">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
              ✨ AI 튜터와 더 깊이 연습하고 싶다면?
            </p>
            <p className="text-[10px] text-violet-500/80 dark:text-violet-400/70">
              프리미엄 $4.99/월 · 무제한 대화 + 복습 리스트
            </p>
          </div>
          <button
            type="button"
            className="flex-shrink-0 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:from-violet-600 hover:to-indigo-600 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            aria-label="프리미엄 살펴보기"
          >
            살펴보기
          </button>
        </div>
      </div>
    </motion.div>
  );
}
