'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/playerStore';
import { useShadowingStore } from '@/stores/shadowingStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useMicPermission } from '@/hooks/useMicPermission';
import { isSpeechRecognitionSupported, isSecureContextForSpeech } from '@/lib/utils/browserCompat';
import { findActiveCaptionIndex } from '@/lib/utils/timeFormat';
import { calculateMatchScore } from '@/lib/utils/textMatching';
import CaptionItem from './CaptionItem';
import DictionaryPopup from '@/components/common/DictionaryPopup';
import SpeechCompatBanner, { type CompatIssue } from '@/components/shadowing/SpeechCompatBanner';
import type { Caption } from '@/types';

interface PopupState {
  word: string;
  position: { x: number; y: number };
}

interface Props {
  captions: Caption[];
  onAiChat?: (captionText: string) => void;
  aiChatLocked?: boolean;
}

export default function CaptionList({ captions, onAiChat, aiChatLocked }: Props) {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    setIsSecure(isSecureContextForSpeech());
  }, []);

  const handleWordClick = useCallback((word: string, e: React.MouseEvent) => {
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopup({ word, position: { x: rect.left, y: rect.top } });
  }, []);

  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs);
  const activeCaptionIndex = usePlayerStore((s) => s.activeCaptionIndex);
  const setActiveCaptionIndex = usePlayerStore((s) => s.setActiveCaptionIndex);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const seekTo = usePlayerStore((s) => s.seekTo);

  const setActiveCaptionText = useShadowingStore((s) => s.setActiveCaptionText);
  const matchResult = useShadowingStore((s) => s.matchResult);
  const setMatchResult = useShadowingStore((s) => s.setMatchResult);
  const recordResult = useShadowingStore((s) => s.recordResult);

  const { state: micState, interimTranscript, finalTranscript, start, reset } =
    useSpeechRecognition();
  const { permissionState, requestPermission } = useMicPermission();

  const speechSupported = isSpeechRecognitionSupported();
  const compatIssue: CompatIssue | null = !speechSupported
    ? 'unsupported'
    : !isSecure
      ? 'insecure'
      : permissionState === 'denied'
        ? 'denied'
        : null;
  const micDisabled = compatIssue !== null;

  const activeIndex = useMemo(
    () => findActiveCaptionIndex(captions, currentTimeMs),
    [captions, currentTimeMs],
  );

  useEffect(() => {
    if (activeIndex !== activeCaptionIndex) {
      setActiveCaptionIndex(activeIndex);
      setMatchResult(null);
      if (micState === 'idle' || micState === 'result' || micState === 'error') {
        reset();
      }
    }
  }, [activeIndex, activeCaptionIndex, setActiveCaptionIndex, micState, reset, setMatchResult]);

  useEffect(() => {
    if (micState !== 'processing') return;
    if (!finalTranscript || activeIndex < 0 || !captions[activeIndex]) return;
    recordResult(calculateMatchScore(captions[activeIndex].text, finalTranscript));
  }, [micState, finalTranscript, activeIndex, captions, recordResult]);

  useEffect(() => {
    if (activeIndex >= 0 && captions[activeIndex]) {
      setActiveCaptionText(captions[activeIndex].text);
    }
  }, [activeIndex, captions, setActiveCaptionText]);

  const handleNextCaption = useCallback(() => {
    const nextCaption = captions[activeIndex + 1];
    if (nextCaption) {
      seekTo(nextCaption.offset);
      setIsPlaying(true);
    } else {
      setMatchResult(null);
    }
  }, [activeIndex, captions, seekTo, setIsPlaying, setMatchResult]);

  const handleMicClick = useCallback(async () => {
    if (micState === 'listening') return;
    if (micDisabled) return;

    if (permissionState === 'prompt' || permissionState === 'unknown') {
      const granted = await requestPermission();
      if (!granted) return;
    }

    setMatchResult(null);
    setIsPlaying(false);
    seekTo(currentTimeMs);
    start();
  }, [micState, micDisabled, permissionState, requestPermission, setMatchResult, setIsPlaying, seekTo, currentTimeMs, start]);

  if (captions.length === 0) return null;

  return (
    <>
      {compatIssue && <SpeechCompatBanner issue={compatIssue} />}
      <div
        className="flex flex-col gap-0.5 overflow-y-auto rounded-2xl bg-white p-3 shadow-sm dark:bg-gray-900"
        style={{ maxHeight: '400px' }}
        aria-label="자막 목록"
        aria-live="polite"
      >
        {captions.map((caption, idx) => (
          <CaptionItem
            key={`${caption.offset}-${idx}`}
            caption={caption}
            isActive={idx === activeIndex}
            micState={idx === activeIndex ? micState : 'idle'}
            interimTranscript={idx === activeIndex ? interimTranscript : ''}
            finalTranscript={idx === activeIndex ? finalTranscript : ''}
            matchResult={idx === activeIndex ? matchResult : null}
            micDisabled={micDisabled}
            onMicClick={handleMicClick}
            onWordClick={handleWordClick}
            aiChatLocked={aiChatLocked}
            onAiChat={onAiChat}
            onNextCaption={idx === activeIndex ? handleNextCaption : undefined}
          />
        ))}
      </div>

      <AnimatePresence>
        {popup && (
          <DictionaryPopup
            key={popup.word + popup.position.x}
            word={popup.word}
            position={popup.position}
            onClose={() => setPopup(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
