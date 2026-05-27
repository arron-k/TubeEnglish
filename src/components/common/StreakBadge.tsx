'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';

export default function StreakBadge() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { user, streakDays, streakBumpCount } = useAuthStore();
  const [showBump, setShowBump] = useState(false);
  const prevBumpCount = useRef(streakBumpCount);

  useEffect(() => {
    if (streakBumpCount === prevBumpCount.current) return;
    prevBumpCount.current = streakBumpCount;
    if (shouldReduceMotion) return;
    setShowBump(true);
    const t = setTimeout(() => setShowBump(false), 900);
    return () => clearTimeout(t);
  }, [streakBumpCount, shouldReduceMotion]);

  if (!user) return null;

  return (
    <button
      type="button"
      onClick={() => router.push('/dashboard')}
      className="relative flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-gray-100 active:scale-95 dark:hover:bg-gray-800"
      aria-label={`연속 학습 ${streakDays}일. 대시보드로 이동`}
    >
      <span aria-hidden="true">🔥</span>
      <span className="text-gray-700 dark:text-gray-200">{streakDays}일</span>

      <AnimatePresence>
        {showBump && (
          <motion.span
            key="bump"
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -32, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18, duration: 0.5 }}
            className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-bold text-orange-500"
            aria-hidden="true"
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
