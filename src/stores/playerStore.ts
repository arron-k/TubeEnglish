import { create } from 'zustand';
import type { Caption } from '@/types';

interface PlayerState {
  videoId: string | null;
  captions: Caption[];
  currentTimeMs: number;
  watchedSeconds: number;
  activeCaptionIndex: number;
  isPlaying: boolean;
  playbackRate: number;
  seekToTime: number | null;
  loopCaptionIndex: number | null;
  loopCount: number;

  setVideoId: (videoId: string) => void;
  setCaptions: (captions: Caption[]) => void;
  setCurrentTimeMs: (timeMs: number) => void;
  setActiveCaptionIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  seekTo: (timeMs: number) => void;
  clearSeek: () => void;
  resetWatched: () => void;
  setLoopCaption: (index: number | null) => void;
  incrementLoopCount: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  videoId: null,
  captions: [],
  currentTimeMs: 0,
  watchedSeconds: 0,
  activeCaptionIndex: -1,
  isPlaying: false,
  playbackRate: 1,
  seekToTime: null,
  loopCaptionIndex: null,
  loopCount: 0,

  setVideoId: (videoId) =>
    set({ videoId, currentTimeMs: 0, watchedSeconds: 0, activeCaptionIndex: -1, loopCaptionIndex: null, loopCount: 0 }),
  setCaptions: (captions) => set({ captions }),
  setCurrentTimeMs: (timeMs) =>
    set((s) => {
      const deltaSec = (timeMs - s.currentTimeMs) / 1000;
      // 0~2초 사이 자연 진행만 누적 (큰 점프는 시킹이므로 무시)
      const validDelta = deltaSec > 0 && deltaSec < 2 ? deltaSec : 0;
      return {
        currentTimeMs: timeMs,
        watchedSeconds: s.watchedSeconds + validDelta,
      };
    }),
  setActiveCaptionIndex: (index) => set({ activeCaptionIndex: index }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  seekTo: (timeMs) => set({ seekToTime: timeMs }),
  clearSeek: () => set({ seekToTime: null }),
  resetWatched: () => set({ watchedSeconds: 0, currentTimeMs: 0 }),
  setLoopCaption: (index) => set({ loopCaptionIndex: index, loopCount: 0 }),
  incrementLoopCount: () => set((s) => ({ loopCount: s.loopCount + 1 })),
}));
