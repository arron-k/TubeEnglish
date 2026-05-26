'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useShadowingStore } from '@/stores/shadowingStore';
import type { SpeechRecognitionState } from '@/types';

const SILENCE_TIMEOUT_MS = 10000;
const RESULT_DISPLAY_MS = 2000;

export function useSpeechRecognition() {
  const [state, setState] = useState<SpeechRecognitionState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');

  const stateRef = useRef<SpeechRecognitionState>('idle');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setStoreRecognitionState = useShadowingStore((s) => s.setRecognitionState);
  const setStoreInterimTranscript = useShadowingStore((s) => s.setInterimTranscript);
  const setStoreFinalTranscript = useShadowingStore((s) => s.setFinalTranscript);

  const updateState = useCallback(
    (newState: SpeechRecognitionState) => {
      stateRef.current = newState;
      setState(newState);
      setStoreRecognitionState(newState);
    },
    [setStoreRecognitionState],
  );

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
    silenceTimerRef.current = null;
    autoResetTimerRef.current = null;
  }, []);

  // webkitSpeechRecognition is Chrome-only and not in standard TS DOM types
  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback(() => {
    if (!isSupported) return;
    if (
      stateRef.current !== 'idle' &&
      stateRef.current !== 'result' &&
      stateRef.current !== 'error'
    )
      return;

    clearTimers();
    setInterimTranscript('');
    setFinalTranscript('');
    setStoreInterimTranscript('');
    setStoreFinalTranscript('');
    updateState('listening');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const recognition: SpeechRecognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;

    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      clearTimers();

      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
        setStoreInterimTranscript(interim);
      }

      if (final) {
        setFinalTranscript(final);
        setStoreFinalTranscript(final);
        updateState('processing');

        autoResetTimerRef.current = setTimeout(() => {
          updateState('result');
          autoResetTimerRef.current = setTimeout(() => {
            updateState('idle');
            setInterimTranscript('');
            setFinalTranscript('');
            setStoreInterimTranscript('');
            setStoreFinalTranscript('');
          }, RESULT_DISPLAY_MS);
        }, 400);
      } else {
        silenceTimerRef.current = setTimeout(() => recognition.stop(), SILENCE_TIMEOUT_MS);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      clearTimers();
      if (event.error !== 'aborted') {
        updateState('error');
        autoResetTimerRef.current = setTimeout(() => updateState('idle'), 2000);
      }
    };

    recognition.onend = () => {
      // Only cancel the silence timer; auto-reset timer must keep running
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (stateRef.current === 'listening') {
        updateState('idle');
      }
    };

    silenceTimerRef.current = setTimeout(() => recognition.stop(), SILENCE_TIMEOUT_MS);
    recognition.start();
  }, [
    isSupported,
    clearTimers,
    updateState,
    setStoreInterimTranscript,
    setStoreFinalTranscript,
  ]);

  const stop = useCallback(() => {
    clearTimers();
    recognitionRef.current?.stop();
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    recognitionRef.current?.abort();
    setInterimTranscript('');
    setFinalTranscript('');
    setStoreInterimTranscript('');
    setStoreFinalTranscript('');
    updateState('idle');
  }, [clearTimers, updateState, setStoreInterimTranscript, setStoreFinalTranscript]);

  useEffect(() => {
    return () => {
      clearTimers();
      recognitionRef.current?.abort();
    };
  }, [clearTimers]);

  return { state, interimTranscript, finalTranscript, isSupported, start, stop, reset };
}
