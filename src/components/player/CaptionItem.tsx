'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Mic, Loader2, CheckCircle2, XCircle, MessageCircle, BookOpen, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import ShadowingCard from '@/components/shadowing/ShadowingCard';
import type { Caption, SpeechRecognitionState, MatchResult, TranslationResult } from '@/types';

interface Props {
  caption: Caption;
  isActive: boolean;
  micState: SpeechRecognitionState;
  interimTranscript: string;
  finalTranscript: string;
  matchResult: MatchResult | null;
  micDisabled?: boolean;
  aiChatLocked?: boolean;
  onMicClick: () => void;
  onWordClick: (word: string, e: React.MouseEvent) => void;
  onAiChat?: (captionText: string) => void;
  onNextCaption?: () => void;
}

function TranslationArea({ caption, isActive }: { caption: Caption; isActive: boolean }) {
  const videoId = usePlayerStore((s) => s.videoId);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLiteral, setShowLiteral] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!isActive || hasFetchedRef.current || !videoId) return;
    hasFetchedRef.current = true;
    setIsLoading(true);

    const params = new URLSearchParams({
      text: caption.text,
      videoId,
      offset: String(caption.offset),
    });
    fetch(`/api/translate?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data && !data.error) setTranslation(data); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isActive, caption.text, caption.offset, videoId]);

  if (!isActive) return null;

  return (
    <div className="mt-1.5 space-y-1.5">
      {isLoading && (
        <div className="flex items-center gap-1.5 text-xs text-indigo-200/70">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>번역 중...</span>
        </div>
      )}

      {translation && (
        <>
          {translation.keyExpression && (
            <div className="flex flex-wrap gap-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-medium text-yellow-200 ring-1 ring-yellow-400/30">
                <span className="font-semibold">{translation.keyExpression.original}</span>
                <span className="opacity-70">→</span>
                <span>{translation.keyExpression.meaning}</span>
              </span>
            </div>
          )}

          <p className="text-xs leading-relaxed text-indigo-100/90">
            {translation.natural}
          </p>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowLiteral((v) => !v); }}
            className="flex items-center gap-0.5 text-[11px] text-indigo-200/60 transition-colors hover:text-indigo-100/80"
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
                className="overflow-hidden text-xs leading-relaxed text-indigo-200/60 italic"
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

export default function CaptionItem({
  caption,
  isActive,
  micState,
  interimTranscript,
  finalTranscript,
  matchResult,
  micDisabled,
  aiChatLocked,
  onMicClick,
  onWordClick,
  onAiChat,
  onNextCaption,
}: Props) {
  const seekTo = usePlayerStore((s) => s.seekTo);
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [wordLookupMode, setWordLookupMode] = useState(false);

  const showTranscript = isActive && (interimTranscript || finalTranscript) && !matchResult;
  const displayText = finalTranscript || interimTranscript;
  const isFinal = !!finalTranscript;

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) setWordLookupMode(false);
  }, [isActive]);

  const handleWordTap = (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onWordClick(word, e);
    if (wordLookupMode) setWordLookupMode(false);
  };

  const isListening = micState === 'listening';
  const isProcessing = micState === 'processing';
  const isResultMic = micState === 'result';
  const isErrorMic = micState === 'error';

  const micLabel = isListening
    ? '듣는 중…'
    : isProcessing
      ? '분석 중'
      : isResultMic
        ? '완료'
        : isErrorMic
          ? '다시 시도'
          : '따라하기';

  return (
    <motion.div
      ref={ref}
      animate={{
        backgroundColor: isActive ? '#6172f3' : 'rgba(0,0,0,0)',
      }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeInOut' }}
      className="relative rounded-lg px-3 py-2"
    >
      {isActive && (
        <motion.span
          key="accent"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: 'easeOut' }}
          className="pointer-events-none absolute left-1 top-2 bottom-2 w-1 rounded-full bg-white/80"
          aria-hidden="true"
        />
      )}

      <span
        className={`block cursor-pointer text-sm leading-relaxed transition-colors duration-200 ${
          isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'
        }`}
        onClick={() => seekTo(caption.offset)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') seekTo(caption.offset); }}
        aria-label={`자막: ${caption.text}`}
      >
        {caption.text.split(/(\s+)/).map((token, i) =>
          /^\s+$/.test(token) ? (
            token
          ) : (
            <span
              key={i}
              onClick={(e) => handleWordTap(token, e)}
              className={`rounded px-0.5 transition-colors hover:underline hover:decoration-dotted ${
                isActive
                  ? 'hover:bg-white/20'
                  : 'hover:bg-indigo-50 dark:hover:bg-indigo-950'
              } ${
                isActive && wordLookupMode
                  ? 'underline decoration-dotted decoration-white/70 underline-offset-4'
                  : ''
              }`}
            >
              {token}
            </span>
          )
        )}
      </span>

      <TranslationArea caption={caption} isActive={isActive} />

      <AnimatePresence mode="wait">
        {showTranscript && (
          <motion.div
            key="transcript"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="mt-1.5 overflow-hidden"
          >
            <p
              className={`text-xs leading-relaxed ${
                isFinal ? 'font-medium text-yellow-200' : 'italic text-indigo-200'
              }`}
              aria-live="polite"
              aria-label={`인식된 텍스트: ${displayText}`}
            >
              {displayText}
            </p>
          </motion.div>
        )}
        {isActive && matchResult && (
          <ShadowingCard
            key="result"
            matchResult={matchResult}
            captionText={caption.text}
            onRetry={onMicClick}
            onAiChat={onAiChat}
            onNextCaption={onNextCaption}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isActive && (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="mt-2 grid grid-cols-3 gap-2"
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMicClick(); }}
              disabled={micDisabled || isProcessing}
              className={`relative flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${
                isListening
                  ? 'bg-red-500 text-white'
                  : isResultMic
                    ? 'bg-green-500 text-white'
                    : isErrorMic
                      ? 'bg-red-400 text-white'
                      : 'bg-white/95 text-brand-600 hover:bg-white dark:bg-white/90'
              }`}
              aria-label={isListening ? '녹음 중지' : '쉐도잉 시작'}
              aria-pressed={isListening || isProcessing}
            >
              {isListening && !shouldReduceMotion && (
                <motion.span
                  className="absolute inset-0 rounded-lg bg-red-400 opacity-50"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.15, 0.5] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isResultMic ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isErrorMic ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                <span>{micLabel}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAiChat?.(caption.text); }}
              disabled={!onAiChat}
              className="relative flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-white/95 px-2 text-xs font-semibold text-accent-600 transition-all active:scale-95 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:bg-white/90"
              aria-label={aiChatLocked ? 'AI 대화 일일 한도 도달 (클릭하여 자세히 보기)' : 'AI 튜터와 이 문장으로 대화하기'}
            >
              {aiChatLocked ? (
                <>
                  <Lock className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-violet-500">AI 대화</span>
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  <span>AI와 대화</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setWordLookupMode((v) => !v); }}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                wordLookupMode
                  ? 'bg-yellow-300 text-yellow-900'
                  : 'bg-white/95 text-brand-600 hover:bg-white dark:bg-white/90'
              }`}
              aria-label="단어 사전 모드"
              aria-pressed={wordLookupMode}
            >
              <BookOpen className="h-4 w-4" />
              <span>{wordLookupMode ? '단어 선택' : '단어'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
