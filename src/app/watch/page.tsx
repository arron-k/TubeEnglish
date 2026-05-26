'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import YoutubePlayer, { type YoutubePlayerHandle } from '@/components/player/YoutubePlayer';
import PlaybackControls from '@/components/player/PlaybackControls';
import CaptionList from '@/components/player/CaptionList';
import CaptionSkeleton from '@/components/player/CaptionSkeleton';
import AiTutorChat from '@/components/tutor/AiTutorChat';
import { usePlayerStore } from '@/stores/playerStore';
import { useShadowingStore } from '@/stores/shadowingStore';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { useTranscript } from '@/hooks/useTranscript';
import { markDashboardForRefresh } from '@/components/dashboard/DashboardRefresher';

type PanelTab = 'captions' | 'tutor';

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
        active
          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function WatchContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get('v');
  const playerRef = useRef<YoutubePlayerHandle>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>('captions');
  const [videoTitle, setVideoTitle] = useState<string>('');

  const captions = usePlayerStore((s) => s.captions);
  const setCaptions = usePlayerStore((s) => s.setCaptions);
  const setVideoIdInStore = usePlayerStore((s) => s.setVideoId);
  const watchedSeconds = usePlayerStore((s) => s.watchedSeconds);

  const shadowingAttemptCount = useShadowingStore((s) => s.attemptCount);
  const scoreHistory = useShadowingStore((s) => s.scoreHistory);
  const resetShadowingSession = useShadowingStore((s) => s.resetSession);
  const chatMessages = useChatStore((s) => s.messages);
  const clearChat = useChatStore((s) => s.clearChat);

  const { user } = useAuthStore();

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
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <YoutubePlayer ref={playerRef} videoId={videoId} />
          <PlaybackControls />
        </div>

        <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-900" style={{ height: 'calc(100vh - 160px)', minHeight: '480px' }}>
          <div className="flex-shrink-0 p-2">
            <div
              className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800/60"
              role="tablist"
              aria-label="패널 탭"
            >
              <TabButton active={activeTab === 'captions'} onClick={() => setActiveTab('captions')}>
                📄 자막
              </TabButton>
              <TabButton active={activeTab === 'tutor'} onClick={() => setActiveTab('tutor')}>
                🤖 AI 튜터
              </TabButton>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {activeTab === 'captions' ? (
              <div className="h-full overflow-y-auto p-2">
                {isLoading && <CaptionSkeleton />}
                {!isLoading && error && (
                  <div className="flex h-full items-center justify-center p-6">
                    <div className="text-center">
                      <p className="mb-1 text-2xl">😢</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
                    </div>
                  </div>
                )}
                {!isLoading && !error && <CaptionList captions={captions} />}
              </div>
            ) : (
              <AiTutorChat videoContext={videoContext} />
            )}
          </div>
        </div>
      </div>
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
