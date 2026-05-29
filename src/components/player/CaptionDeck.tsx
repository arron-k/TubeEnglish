'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Mic, Loader2, CheckCircle2, XCircle, MessageCircle, BookOpen, Languages,
  Lock, Repeat, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
} from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { useShadowingStore } from '@/stores/shadowingStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useMicPermission } from '@/hooks/useMicPermission';
import { isSpeechRecognitionSupported, isSecureContextForSpeech } from '@/lib/utils/browserCompat';
import { findActiveCaptionIndex } from '@/lib/utils/timeFormat';
import { calculateMatchScore } from '@/lib/utils/textMatching';
import DictionaryPopup from '@/components/common/DictionaryPopup';
import SpeechCompatBanner, { type CompatIssue } from '@/components/shadowing/SpeechCompatBanner';
import ShadowingCard from '@/components/shadowing/ShadowingCard';
import type { Caption, TranslationResult } from '@/types';

interface Props {
  captions: Caption[];
  onAiChat?: (captionText: string) => void;
  aiChatLocked?: boolean;
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function TranslationArea({ caption, enabled }: { caption: Caption; enabled: boolean }) {
  const videoId = usePlayerStore((s) => s.videoId);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLiteral, setShowLiteral] = useState(false);
  const cacheRef = useRef<Map<string, TranslationResult>>(new Map());

  useEffect(() => {
    if (!enabled || !videoId) return;
    const cacheKey = `${caption.offset}-${caption.text}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setTranslation(cached);
      return;
    }
    setTranslation(null);
    setIsLoading(true);
    const params = new URLSearchParams({
      text: caption.text,
      videoId,
      offset: String(caption.offset),
    });
    fetch(`/api/translate?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.error) {
          cacheRef.current.set(cacheKey, data);
          setTranslation(data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [enabled, caption.text, caption.offset, videoId]);

  if (!enabled) return null;

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-indigo-50/70 p-3 dark:bg-indigo-950/40">
      {isLoading && (
        <div className="flex items-center gap-1.5 text-xs text-indigo-700/70 dark:text-indigo-200/70">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>번역 중...</span>
        </div>
      )}
      {translation && (
        <>
          {translation.keyExpression && (
            <div className="flex flex-wrap gap-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-300/40 px-2 py-0.5 text-xs font-medium text-yellow-900 ring-1 ring-yellow-400/40 dark:bg-yellow-400/20 dark:text-yellow-100">
                <span className="font-semibold">{translation.keyExpression.original}</span>
                <span className="opacity-70">→</span>
                <span>{translation.keyExpression.meaning}</span>
              </span>
            </div>
          )}
          <p className="text-sm leading-relaxed text-indigo-900 dark:text-indigo-100">
            {translation.natural}
          </p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowLiteral((v) => !v); }}
            className="flex items-center gap-0.5 text-[11px] text-indigo-700/70 transition-colors hover:text-indigo-900 dark:text-indigo-200/70 dark:hover:text-indigo-100"
            aria-expanded={showLiteral}
          >
            {showLiteral ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            직역 {showLiteral ? '숨기기' : '보기'}
          </button>
          <AnimatePresence>
            {showLiteral && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden text-xs italic leading-relaxed text-indigo-700/80 dark:text-indigo-200/70"
              >
                {translation.literal}
              </motion.p>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

function InlineAllCaptions({ captions, onSelect }: { captions: Caption[]; onSelect: (idx: number) => void }) {
  const [open, setOpen] = useState(false);
  const activeIndex = usePlayerStore((s) => s.activeCaptionIndex);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    const el = itemRefs.current[activeIndex];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIndex, open]);

  return (
    <div className="mt-4 border-t border-gray-100 pt-2 dark:border-gray-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/60"
        aria-expanded={open}
      >
        <span>전체 자막 보기 ({captions.length})</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="mt-1 max-h-64 overflow-y-auto px-1 py-1">
          {captions.map((c, idx) => (
            <button
              key={`${c.offset}-${idx}`}
              ref={(el) => { itemRefs.current[idx] = el; }}
              type="button"
              onClick={() => onSelect(idx)}
              className={`block w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                idx === activeIndex
                  ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {c.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewCard({
  caption,
  position,
  onClick,
}: {
  caption: Caption;
  position: 'prev' | 'next';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-left text-xs text-gray-500 opacity-70 transition-all hover:bg-gray-100 hover:text-gray-700 hover:opacity-100 dark:bg-gray-800/60 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      aria-label={`${position === 'prev' ? '이전' : '다음'} 자막으로 이동`}
    >
      {position === 'prev' && <ChevronLeft className="h-3.5 w-3.5 flex-shrink-0" />}
      <p className="line-clamp-1 flex-1">{caption.text}</p>
      {position === 'next' && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
    </button>
  );
}

export default function CaptionDeck({ captions, onAiChat, aiChatLocked }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const [popup, setPopup] = useState<{ word: string; position: { x: number; y: number } } | null>(null);
  const [isSecure, setIsSecure] = useState(true);
  const [wordLookupMode, setWordLookupMode] = useState(false);
  const [translationMode, setTranslationMode] = useState(false);

  useEffect(() => {
    setIsSecure(isSecureContextForSpeech());
  }, []);

  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs);
  const activeCaptionIndex = usePlayerStore((s) => s.activeCaptionIndex);
  const setActiveCaptionIndex = usePlayerStore((s) => s.setActiveCaptionIndex);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const loopCaptionIndex = usePlayerStore((s) => s.loopCaptionIndex);
  const loopCount = usePlayerStore((s) => s.loopCount);
  const setLoopCaption = usePlayerStore((s) => s.setLoopCaption);

  const setActiveCaptionText = useShadowingStore((s) => s.setActiveCaptionText);
  const matchResult = useShadowingStore((s) => s.matchResult);
  const setMatchResult = useShadowingStore((s) => s.setMatchResult);
  const recordResult = useShadowingStore((s) => s.recordResult);

  const { state: micState, interimTranscript, finalTranscript, start, reset } = useSpeechRecognition();
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

  const displayIndex = activeIndex >= 0 ? activeIndex : Math.max(0, activeCaptionIndex);
  const caption = captions[displayIndex];

  useEffect(() => {
    if (activeIndex !== activeCaptionIndex) {
      setActiveCaptionIndex(activeIndex);
      setMatchResult(null);
      reset();
    }
  }, [activeIndex, activeCaptionIndex, setActiveCaptionIndex, reset, setMatchResult]);

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

  const goTo = useCallback((idx: number) => {
    const c = captions[idx];
    if (!c) return;
    if (micState === 'listening' || micState === 'processing') reset();
    setLoopCaption(null);
    seekTo(c.offset);
    setIsPlaying(true);
  }, [captions, micState, reset, seekTo, setIsPlaying, setLoopCaption]);

  const handlePrev = useCallback(() => {
    if (displayIndex > 0) goTo(displayIndex - 1);
  }, [displayIndex, goTo]);

  const handleNext = useCallback(() => {
    if (displayIndex < captions.length - 1) goTo(displayIndex + 1);
  }, [displayIndex, captions.length, goTo]);

  const handleMicClick = useCallback(async () => {
    if (micState === 'listening' || micState === 'processing') {
      reset();
      return;
    }
    if (micDisabled) return;
    if (permissionState === 'prompt' || permissionState === 'unknown') {
      const granted = await requestPermission();
      if (!granted) return;
    }
    setMatchResult(null);
    setIsPlaying(false);
    if (caption) seekTo(caption.offset);
    start();
  }, [micState, micDisabled, permissionState, requestPermission, setMatchResult, setIsPlaying, seekTo, caption, start, reset]);

  const handleLoopToggle = useCallback(() => {
    if (displayIndex < 0) return;
    setLoopCaption(loopCaptionIndex === displayIndex ? null : displayIndex);
  }, [displayIndex, loopCaptionIndex, setLoopCaption]);

  const handleWordTap = useCallback((word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopup({ word, position: { x: rect.left, y: rect.top } });
    if (wordLookupMode) setWordLookupMode(false);
  }, [wordLookupMode]);

  if (captions.length === 0 || !caption) return null;

  const isLooping = loopCaptionIndex === displayIndex;
  const isListening = micState === 'listening';
  const isProcessing = micState === 'processing';
  const isResultMic = micState === 'result';
  const isErrorMic = micState === 'error';
  const showTranscript = (interimTranscript || finalTranscript) && !matchResult;
  const displayText = finalTranscript || interimTranscript;
  const isFinal = !!finalTranscript;

  const micLabel = isListening ? '듣는 중…'
    : isProcessing ? '분석 중'
      : isResultMic ? '완료'
        : isErrorMic ? '다시 시도' : '따라하기';

  return (
    <div className="flex h-full flex-col gap-3">
      {compatIssue && <SpeechCompatBanner issue={compatIssue} />}

      {displayIndex > 0 && (
        <PreviewCard caption={captions[displayIndex - 1]} position="prev" onClick={handlePrev} />
      )}

      <motion.div
        key={displayIndex}
        drag={shouldReduceMotion ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) handleNext();
          else if (info.offset.x > 80) handlePrev();
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        className="relative flex-shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span className="font-medium">{displayIndex + 1} / {captions.length}</span>
            <span>{formatTime(caption.offset)}</span>
          </div>
          <button
            type="button"
            onClick={handleLoopToggle}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              isLooping
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            aria-pressed={isLooping}
            aria-label={isLooping ? '반복듣기 끄기' : '반복듣기 켜기'}
            title="반복듣기 (R)"
          >
            <Repeat className="h-3.5 w-3.5" />
            <span>{isLooping ? `반복 중${loopCount > 0 ? ` · ${loopCount}회` : ''}` : '반복듣기'}</span>
          </button>
        </div>

        <p
          className="text-2xl font-semibold leading-snug text-gray-900 dark:text-gray-50"
          aria-label={`자막: ${caption.text}`}
        >
          {caption.text.split(/(\s+)/).map((token, i) =>
            /^\s+$/.test(token) ? (
              token
            ) : (
              <span
                key={i}
                onClick={(e) => handleWordTap(token, e)}
                className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 hover:underline hover:decoration-dotted dark:hover:bg-brand-900/40 ${
                  wordLookupMode ? 'underline decoration-dotted decoration-brand-400 underline-offset-4' : ''
                }`}
              >
                {token}
              </span>
            )
          )}
        </p>

        <TranslationArea caption={caption} enabled={translationMode} />

        <AnimatePresence mode="wait">
          {showTranscript && (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              className="mt-3 overflow-hidden rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60"
            >
              <p
                className={`text-sm leading-relaxed ${
                  isFinal ? 'font-medium text-gray-900 dark:text-gray-100' : 'italic text-gray-500 dark:text-gray-400'
                }`}
                aria-live="polite"
              >
                {displayText}
              </p>
            </motion.div>
          )}
          {matchResult && (
            <ShadowingCard
              key="result"
              matchResult={matchResult}
              captionText={caption.text}
              onRetry={handleMicClick}
              onAiChat={onAiChat}
              onNextCaption={handleNext}
            />
          )}
        </AnimatePresence>

        <div className="mt-4 grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={handleMicClick}
            disabled={micDisabled}
            className={`relative flex min-h-[40px] items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1.5 py-2 text-xs font-semibold transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50 ${
              isListening ? 'bg-red-500 text-white'
                : isResultMic ? 'bg-green-500 text-white'
                  : isErrorMic ? 'bg-red-400 text-white'
                    : 'bg-brand-500 text-white hover:bg-brand-600'
            }`}
            aria-pressed={isListening || isProcessing}
          >
            {isListening && !shouldReduceMotion && (
              <motion.span
                className="absolute inset-0 rounded-lg bg-red-400 opacity-50"
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.15, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1">
              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : isResultMic ? <CheckCircle2 className="h-3.5 w-3.5" />
                  : isErrorMic ? <XCircle className="h-3.5 w-3.5" />
                    : <Mic className="h-3.5 w-3.5" />}
              <span>{micLabel}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setWordLookupMode((v) => !v)}
            className={`flex min-h-[40px] items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1.5 py-2 text-xs font-semibold transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              wordLookupMode
                ? 'bg-yellow-300 text-yellow-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-pressed={wordLookupMode}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>단어</span>
          </button>

          <button
            type="button"
            onClick={() => setTranslationMode((v) => !v)}
            className={`flex min-h-[40px] items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1.5 py-2 text-xs font-semibold transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              translationMode
                ? 'bg-indigo-200 text-indigo-900 dark:bg-indigo-500/30 dark:text-indigo-100'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-pressed={translationMode}
          >
            <Languages className="h-3.5 w-3.5" />
            <span>번역</span>
          </button>

          <button
            type="button"
            onClick={() => onAiChat?.(caption.text)}
            disabled={!onAiChat}
            className="flex min-h-[40px] items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 px-1.5 py-2 text-xs font-semibold text-white transition-all active:scale-95 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={aiChatLocked ? 'AI 대화 일일 한도 도달' : 'AI 튜터와 이 문장으로 대화하기'}
          >
            {aiChatLocked ? <Lock className="h-3 w-3" /> : <MessageCircle className="h-3.5 w-3.5" />}
            <span>AI 대화</span>
          </button>
        </div>

        <InlineAllCaptions captions={captions} onSelect={goTo} />
      </motion.div>

      {displayIndex < captions.length - 1 && (
        <PreviewCard caption={captions[displayIndex + 1]} position="next" onClick={handleNext} />
      )}

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
    </div>
  );
}
