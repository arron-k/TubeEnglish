'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { FREE_DAILY_AI_LIMIT } from '@/lib/utils/paywall';

interface Props {
  usedCount?: number;
}

export default function PaywallBanner({ usedCount = FREE_DAILY_AI_LIMIT }: Props) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
      className="mx-4 my-3 overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4 dark:border-violet-800/40 dark:from-violet-950/40 dark:to-indigo-950/40"
      role="status"
      aria-label="오늘의 무료 AI 대화 한도에 도달했습니다"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-lg shadow-sm">
          🌙
        </div>
        <div>
          <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">
            오늘 무료 대화를 다 썼어요
          </p>
          <p className="text-xs text-violet-600/80 dark:text-violet-400/80">
            내일 자정이 지나면 다시 만날 수 있어요
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1.5">
        {Array.from({ length: FREE_DAILY_AI_LIMIT }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i < usedCount
                ? 'bg-violet-400 dark:bg-violet-500'
                : 'bg-violet-200/60 dark:bg-violet-800/40'
            }`}
          />
        ))}
        <span className="ml-1 flex-shrink-0 text-[11px] font-medium text-violet-600/80 dark:text-violet-400/80">
          {usedCount}/{FREE_DAILY_AI_LIMIT}
        </span>
      </div>

      <div className="rounded-xl bg-white/60 p-3 dark:bg-white/5">
        <p className="mb-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          ✨ 프리미엄으로 업그레이드하면
        </p>
        <ul className="space-y-0.5 text-[11px] text-indigo-600/80 dark:text-indigo-400/80">
          <li>• AI 튜터 대화 무제한</li>
          <li>• 오류 표현 자동 복습 목록</li>
          <li>• 상세 학습 리포트</li>
        </ul>
      </div>

      <p className="mt-3 text-center text-[11px] text-violet-500/70 dark:text-violet-400/60">
        자막 동기화와 쉐도잉은 무제한으로 계속 사용할 수 있어요 😊
      </p>
    </motion.div>
  );
}
