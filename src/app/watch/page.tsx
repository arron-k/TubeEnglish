'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import YoutubePlayer, { type YoutubePlayerHandle } from '@/components/player/YoutubePlayer';
import PlaybackControls from '@/components/player/PlaybackControls';
import CaptionDeck from '@/components/player/CaptionDeck';
import CaptionSkeleton from '@/components/player/CaptionSkeleton';
import AiTutorChat from '@/components/tutor/AiTutorChat';
import AiTutorFab from '@/components/tutor/AiTutorFab';
import { usePlayerStore } from '@/stores/playerStore';
import { useShadowingStore } from '@/stores/shadowingStore';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { useTranscript } from '@/hooks/useTranscript';
import { markDashboardForRefresh } from '@/components/dashboard/DashboardRefresher';

function WatchContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get('v');
  const playerRef = useRef<YoutubePlayerHandle>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const shouldReduceMotion = useReducedMotion();

  const captions = usePlayerStore((s) => s.captions);
  const activeCaptionIndex = usePlayerStore((s) => s.activeCaptionIndex);
  const setCaptions = usePlayerStore((s) => s.setCaptions);
  const setVideoIdInStore = usePlayerStore((s) => s.setVideoId);
  const watchedSeconds = usePlayerStore((s) => s.watchedSeconds);
  const setLoopCaption = usePlayerStore((s) => s.setLoopCaption);
  const loopCaptionIndex = usePlayerStore((s) => s.loopCaptionIndex);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const shadowingAttemptCount = useShadowingStore((s) => s.attemptCount);
  const scoreHistory = useShadowingStore((s) => s.scoreHistory);
  const resetShadowingSession = useShadowingStore((s) => s.resetSession);
  const chatMessages = useChatStore((s) => s.messages);
  const clearChat = useChatStore((s) => s.clearChat);
  const setPendingPrompt = useChatStore((s) => s.setPendingPrompt);

  const handleAiChat = (captionText: string) => {
    setPendingPrompt(captionText);
    setTutorOpen(true);
  };

  const handleFabClick = () => setTutorOpen(true);

  const dynamicGreeting = useMemo(() => {
    for (let i = chatMessages.length - 1; i >= 0; i--) {
      const msg = chatMessages[i];
      if (msg.role === 'assistant' && msg.tutorResponse?.key_expression) {
        return `방금 '${msg.tutorResponse.key_expression.expression}' 표현 봤죠? 이걸로 영어로 이야기해볼까요? 😊`;
      }
    }
    if (activeCaptionIndex >= 0 && captions[activeCaptionIndex]) {
      const text = captions[activeCaptionIndex].text;
      const snippet = text.length > 40 ? text.slice(0, 40) + '…' : text;
      return `방금 "${snippet}" 이 부분을 공부했는데, 이 주제로 영어로 이야기해볼까요? 자유롭게 말씀해주세요! 😊`;
    }
    return undefined;
  }, [chatMessages, captions, activeCaptionIndex]);

  const { user, isPremium, dailyAiRemaining } = useAuthStore();
  const aiChatLocked = !isPremium && dailyAiRemaining === 0;

  const { captions: fetchedCaptions, isLoading, error, fetchTranscript } = useTranscript();

  useEffect(() => {
    if (!videoId) return;
    setVideoIdInStore(videoId);
    resetShadowingSession();
    clearChat();

    fetchTranscript(`https://www.youtube.com/watch?v=${videoId}`);
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
      .then((r) => r.json())
      .then((data) => setVideoTitle(data.title ?? videoId))
      .catch(() => setVideoTitle(videoId ?? ''));
  }, [videoId, fetchTranscript, setVideoIdInStore, resetShadowingSession, clearChat]);

  useEffect(() => {
    if (fetchedCaptions.length > 0) {
      setCaptions(fetchedCaptions);
    }
  }, [fetchedCaptions, setCaptions]);

  const goToCaption = useCallback((idx: number) => {
    const c = captions[idx];
    if (!c) return;
    setLoopCaption(null);
    seekTo(c.offset);
    setIsPlaying(true);
  }, [captions, seekTo, setIsPlaying, setLoopCaption]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null;
      if (tgt) {
        const tag = tgt.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tgt.isContentEditable) return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (activeCaptionIndex < captions.length - 1) goToCaption(activeCaptionIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (activeCaptionIndex > 0) goToCaption(activeCaptionIndex - 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.key.toLowerCase() === 'r') {
        if (activeCaptionIndex < 0) return;
        setLoopCaption(loopCaptionIndex === activeCaptionIndex ? null : activeCaptionIndex);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeCaptionIndex, captions.length, goToCaption, isPlaying, loopCaptionIndex, setIsPlaying, setLoopCaption]);

  const learningSnapshot = useRef({
    watchedSeconds,
    shadowingAttemptCount,
    scoreHistory,
    chatMessages,
    videoTitle,
  });
  useEffect(() => {
    learningSnapshot.current = {
      watchedSeconds,
      shadowingAttemptCount,
      scoreHistory,
      chatMessages,
      videoTitle,
    };
  });

  useEffect(() => {
    if (!user || !videoId) return;
    return () => {
      const snap = learningSnapshot.current;
      if (snap.watchedSeconds < 5) return;

      const avgScore =
        snap.scoreHistory.length > 0
          ? snap.scoreHistory.reduce((a, b) => a + b, 0) / snap.scoreHistory.length
          : 0;

      markDashboardForRefresh();

      fetch('/api/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          videoTitle: snap.videoTitle || videoId,
          videoThumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          watchedDuration: Math.round(snap.watchedSeconds),
          shadowingCount: snap.shadowingAttemptCount,
          averageShadowingScore: Math.round(avgScore * 10) / 10,
          aiConversationCount: snap.chatMessages.filter((m) => m.role === 'assistant').length,
        }),
        keepalive: true,
      });
    };
  }, [user, videoId]);

  if (!videoId) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <p className="text-gray-500">영상 ID가 없습니다. 홈으로 돌아가서 URL을 입력해주세요.</p>
      </div>
    );
  }

  const videoContext = { videoId, title: '학습 영상' };

  return (
    <div className="mx-auto max-w-6xl">
      <AiTutorFab onClick={handleFabClick} isActive={tutorOpen} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_400px]">
        <div className="space-y-3">
          <YoutubePlayer ref={playerRef} videoId={videoId} />
          <PlaybackControls />
        </div>

        <div className="space-y-3 self-start">
          {isLoading && <CaptionSkeleton />}
          {!isLoading && error && (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-900">
              <p className="mb-1 text-2xl">😢</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
            </div>
          )}
          {!isLoading && !error && captions.length > 0 && (
            <CaptionDeck captions={captions} onAiChat={handleAiChat} aiChatLocked={aiChatLocked} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {tutorOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              onClick={() => setTutorOpen(false)}
              className="fixed inset-0 z-40 bg-black/40"
              aria-hidden="true"
            />
            <motion.aside
              key="panel"
              initial={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
              animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: 'easeOut' }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-gray-900"
              role="dialog"
              aria-label="AI 튜터"
              aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">🤖 AI 튜터</h2>
                <button
                  type="button"
                  onClick={() => setTutorOpen(false)}
                  className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <AiTutorChat videoContext={videoContext} initialGreeting={dynamicGreeting} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WatchPage() {
  return (
    <main className="flex-1 p-4 md:p-6">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        }
      >
        <WatchContent />
      </Suspense>
    </main>
  );
}
