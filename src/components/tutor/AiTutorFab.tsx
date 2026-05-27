'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

interface Props {
  onClick: () => void;
  isActive: boolean;
}

export default function AiTutorFab({ onClick, isActive }: Props) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={isActive ? { scale: 0.85, opacity: 0.5 } : { scale: 1, opacity: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.25,
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      whileHover={shouldReduceMotion || isActive ? {} : { scale: 1.06 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.93 }}
      onClick={onClick}
      disabled={isActive}
      aria-label="AI 튜터와 대화하기"
      aria-pressed={isActive}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:cursor-default"
    >
      <motion.span
        animate={shouldReduceMotion || isActive ? {} : { rotate: [0, -10, 10, -6, 0] }}
        transition={{ duration: 0.5, delay: 1.5, repeat: Infinity, repeatDelay: 8 }}
        aria-hidden="true"
      >
        <MessageCircle className="h-5 w-5" />
      </motion.span>
      <span>{isActive ? 'AI 튜터 중' : 'AI 튜터'}</span>
    </motion.button>
  );
}
