'use client';

import { usePlayerStore } from '@/stores/playerStore';

const RATES = [0.5, 0.75, 1.0, 1.25] as const;

export default function PlaybackControls() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-100 px-4 py-2 dark:bg-gray-800">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        aria-label={isPlaying ? '일시정지' : '재생'}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-800 shadow-sm transition-transform hover:scale-105 active:scale-95 dark:bg-gray-700 dark:text-gray-100"
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v14l11-7-11-7z" />
          </svg>
        )}
      </button>

      <div className="flex items-center gap-1">
        {RATES.map((rate) => (
          <button
            key={rate}
            onClick={() => setPlaybackRate(rate)}
            aria-label={`재생 속도 ${rate}배`}
            className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
              playbackRate === rate
                ? 'bg-indigo-500 text-white'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {rate}x
          </button>
        ))}
      </div>
    </div>
  );
}
