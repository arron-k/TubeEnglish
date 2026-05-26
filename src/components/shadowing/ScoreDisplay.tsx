'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion, animate } from 'framer-motion';
import { Star } from 'lucide-react';

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreToStars(score: number): number {
  if (score >= 80) return 5;
  if (score >= 60) return 4;
  if (score >= 40) return 3;
  if (score >= 20) return 2;
  if (score > 0) return 1;
  return 0;
}

function getEncouragement(score: number): string {
  if (score >= 90) return '완벽해요! 🎉';
  if (score >= 70) return '잘했어요! 거의 다 왔어요 👍';
  if (score >= 50) return '조금 더 연습하면 완벽할 거예요!';
  return '한 번 더 들어보고 따라해볼까요?';
}

interface Props {
  score: number;
}

export default function ScoreDisplay({ score }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const [displayScore, setDisplayScore] = useState(0);

  const stars = scoreToStars(score);
  const targetOffset = CIRCUMFERENCE * (1 - score / 100);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayScore(score);
      return;
    }
    const controls = animate(0, score, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    });
    return controls.stop;
  }, [score, shouldReduceMotion]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center">
        <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
          <circle
            cx="28"
            cy="28"
            r={RADIUS}
            fill="none"
            strokeWidth="4"
            className="stroke-gray-200 dark:stroke-gray-700"
          />
          <motion.circle
            cx="28"
            cy="28"
            r={RADIUS}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            className="stroke-brand-500"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: 'easeOut' }}
          />
        </svg>
        <span className="absolute text-sm font-bold text-gray-900 dark:text-white">
          {displayScore}
        </span>
      </div>

      <div className="flex gap-0.5" aria-label={`${stars}점 / 5점`}>
        {Array.from({ length: 5 }, (_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { delay: 0.4 + i * 0.08, type: 'spring', stiffness: 320, damping: 14 }
            }
          >
            <Star
              className={`h-3.5 w-3.5 ${
                i < stars
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-gray-300 dark:text-gray-600'
              }`}
            />
          </motion.div>
        ))}
      </div>

      <motion.p
        className="w-24 text-center text-[10px] font-medium leading-tight text-brand-600 dark:text-brand-400"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: shouldReduceMotion ? 0 : 0.9, duration: 0.2 }}
      >
        {getEncouragement(score)}
      </motion.p>
    </div>
  );
}
