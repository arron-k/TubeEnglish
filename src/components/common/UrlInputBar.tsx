'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { extractVideoId, isValidYoutubeUrl } from '@/lib/utils/youtubeParser';

interface UrlInputBarProps {
  size?: 'default' | 'large';
}

export default function UrlInputBar({ size = 'default' }: UrlInputBarProps) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = url.trim();

    if (!trimmed) {
      setError('유튜브 URL을 입력해주세요.');
      return;
    }

    if (!isValidYoutubeUrl(trimmed)) {
      setError('올바른 유튜브 URL이 아닙니다. 다시 확인해주세요.');
      return;
    }

    const videoId = extractVideoId(trimmed);
    if (!videoId) {
      setError('영상 ID를 찾을 수 없습니다.');
      return;
    }

    setError('');
    setIsLoading(true);
    router.push(`/watch?v=${videoId}`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleChange = (value: string) => {
    setUrl(value);
    if (error) setError('');
  };

  const isLarge = size === 'large';

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex w-full gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://www.youtube.com/watch?v=..."
            aria-label="유튜브 URL 입력"
            className={`
              w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 placeholder-gray-400
              outline-none transition-all duration-200
              focus:border-brand-400 focus:ring-2 focus:ring-brand-100
              dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500
              dark:focus:border-brand-500 dark:focus:ring-brand-900/30
              ${isLarge ? 'h-14 text-base' : 'h-11 text-sm'}
              ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}
            `}
          />
        </div>
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={`
            flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 font-semibold text-white
            transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60
            ${isLarge ? 'h-14 px-7 text-base' : 'h-11 px-5 text-sm'}
          `}
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            '학습 시작'
          )}
        </motion.button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role="alert"
            className="mt-2 text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
