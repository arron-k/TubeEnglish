'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useToast } from '@/components/common/ToastProvider';
import { saveChatMessage } from '@/lib/supabase/db';
import MessageBubble from './MessageBubble';
import RePracticeOverlay from './RePracticeOverlay';
import PaywallBanner from '@/components/paywall/PaywallBanner';
import { FREE_DAILY_AI_LIMIT } from '@/lib/utils/paywall';
import type { AiTutorResponse, VideoContext } from '@/types';

function TypingIndicator() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-bold text-white shadow-sm">
        T
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-gray-100 px-3.5 py-3 dark:bg-gray-800">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500"
            animate={shouldReduceMotion ? {} : { y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface Props {
  videoContext?: VideoContext;
  initialGreeting?: string;
}

export default function AiTutorChat({ videoContext, initialGreeting }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const [inputText, setInputText] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    isPracticeBlocked,
    repracticeTarget,
    uiLang,
    level,
    history,
    sessionId,
    addUserMessage,
    addAssistantMessage,
    setIsLoading,
    setVideoContext,
    startRepractice,
    pendingPrompt,
    setPendingPrompt,
  } = useChatStore();

  const { user, isPremium, dailyAiRemaining, decrementDailyAi } = useAuthStore();
  const { showToast } = useToast();
  const isPaywallHit = !isPremium && dailyAiRemaining === 0;

  const { state: speechState, finalTranscript, interimTranscript, isSupported, start: startSTT, reset: resetSTT } = useSpeechRecognition();

  useEffect(() => {
    if (videoContext) setVideoContext(videoContext);
  }, [videoContext, setVideoContext]);

  useEffect(() => {
    if (pendingPrompt) {
      setInputText(pendingPrompt);
      setPendingPrompt(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [pendingPrompt, setPendingPrompt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
  }, [messages, isLoading, shouldReduceMotion]);

  useEffect(() => {
    if (finalTranscript && speechState === 'result') {
      setInputText(finalTranscript);
      resetSTT();
      setIsVoiceMode(false);
    }
  }, [finalTranscript, speechState, resetSTT]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading || isPracticeBlocked) return;

      setInputText('');
      addUserMessage(trimmed);
      setIsLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage: trimmed,
            currentLevel: level,
            uiLang,
            videoContext: videoContext?.topic ?? videoContext?.title,
            history: history.slice(-20),
          }),
        });

        if (res.status === 429) {
          decrementDailyAi();
          return;
        }

        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data: AiTutorResponse = await res.json();
        addAssistantMessage(data);
        decrementDailyAi();

        if (user && videoContext?.videoId) {
          const vid = videoContext.videoId;
          const sid = sessionId;
          saveChatMessage({
            userId: user.id,
            videoId: vid,
            sessionId: sid,
            role: 'user',
            messageContent: { text: trimmed },
            correctionNeeded: false,
          });
          saveChatMessage({
            userId: user.id,
            videoId: vid,
            sessionId: sid,
            role: 'assistant',
            messageContent: data,
            correctionNeeded: data.correction_needed,
          });
        }
      } catch {
        showToast('AI 튜터 연결에 실패했어요. 잠시 후 다시 시도해주세요.', 'error');
        addAssistantMessage({
          conversation_reply: '죄송합니다, 잠시 오류가 발생했어요. 다시 시도해주세요.',
          correction_needed: false,
          corrected_sentence: null,
          error_type: null,
          tutor_feedback: null,
          key_expression: null,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, isPracticeBlocked, level, uiLang, videoContext, history, addUserMessage, addAssistantMessage, setIsLoading, decrementDailyAi, showToast]
  );

  const handleRepractice = useCallback(
    (correctedSentence: string) => {
      startRepractice(correctedSentence);
    },
    [startRepractice]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const handleVoiceToggle = () => {
    if (!isSupported) return;
    if (speechState === 'listening') {
      resetSTT();
      setIsVoiceMode(false);
    } else {
      setIsVoiceMode(true);
      startSTT();
    }
  };

  const isListening = speechState === 'listening';
  const isProcessing = speechState === 'processing';
  const canSend = inputText.trim().length > 0 && !isLoading && !isPracticeBlocked && !isPaywallHit;

  const showGreeting = messages.length === 0 && !isLoading;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {showGreeting && (
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-accent-50 p-4 dark:border-brand-900/40 dark:from-brand-950/30 dark:to-accent-950/30"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-base font-bold text-white shadow-sm">
                T
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">Tube</p>
                <p className="mt-0.5 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                  {initialGreeting ??
                    '안녕하세요! 저는 영어 튜터 Tube예요. 방금 본 영상에 대해 영어로 이야기해볼까요? 자유롭게 말씀해주세요 — 틀려도 괜찮아요! 😊'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                tutorResponse={msg.tutorResponse}
                onRepractice={!repracticeTarget ? handleRepractice : undefined}
              />
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TypingIndicator />
            </motion.div>
          )}
        </div>

        <div ref={bottomRef} />
      </div>

      {repracticeTarget && <RePracticeOverlay />}

      {isPaywallHit && (
        <PaywallBanner usedCount={FREE_DAILY_AI_LIMIT} />
      )}

      <div className="border-t border-gray-100 p-3 dark:border-gray-800">
        {isVoiceMode && (
          <div className="mb-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
            {isListening && '🎙️ 듣고 있어요...'}
            {isProcessing && '⏳ 인식 중...'}
            {(interimTranscript || finalTranscript) && (
              <span className="italic">{interimTranscript || finalTranscript}</span>
            )}
          </div>
        )}

        <div className="flex items-end gap-2">
          {isSupported && (
            <button
              onClick={handleVoiceToggle}
              disabled={isPracticeBlocked}
              aria-label={isListening ? '음성 입력 중지' : '음성으로 입력'}
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all disabled:opacity-40 ${
                isListening
                  ? 'bg-red-500 text-white shadow-md shadow-red-200 dark:shadow-red-900/50'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {isListening ? (
                <motion.span
                  animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </motion.span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              )}
            </button>
          )}

          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPracticeBlocked || isLoading || isPaywallHit}
            placeholder={
              isPaywallHit
                ? '내일 다시 만나요 🌙'
                : isPracticeBlocked
                  ? '재연습 후 계속할 수 있어요'
                  : '영어로 말해보세요... (Enter로 전송)'
            }
            rows={1}
            aria-label="메시지 입력"
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-brand-500 dark:focus:ring-brand-900/40 dark:disabled:bg-gray-800"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />

          <button
            onClick={() => sendMessage(inputText)}
            disabled={!canSend}
            aria-label="메시지 전송"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 dark:bg-brand-500 dark:hover:bg-brand-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
