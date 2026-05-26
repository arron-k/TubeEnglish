import { create } from 'zustand';
import type { SpeechRecognitionState, MatchResult } from '@/types';

interface ShadowingState {
  recognitionState: SpeechRecognitionState;
  interimTranscript: string;
  finalTranscript: string;
  matchResult: MatchResult | null;
  activeCaptionText: string | null;
  attemptCount: number;
  scoreHistory: number[];
  isPracticeMode: boolean;
  practiceSentence: string | null;
  practiceAttempts: number;

  setRecognitionState: (state: SpeechRecognitionState) => void;
  setInterimTranscript: (text: string) => void;
  setFinalTranscript: (text: string) => void;
  setMatchResult: (result: MatchResult | null) => void;
  recordResult: (result: MatchResult) => void;
  setActiveCaptionText: (text: string | null) => void;
  incrementAttempt: () => void;
  resetAttempt: () => void;
  resetSession: () => void;
  enterPracticeMode: (sentence: string) => void;
  exitPracticeMode: () => void;
  incrementPracticeAttempt: () => void;
}

export const useShadowingStore = create<ShadowingState>((set) => ({
  recognitionState: 'idle',
  interimTranscript: '',
  finalTranscript: '',
  matchResult: null,
  activeCaptionText: null,
  attemptCount: 0,
  scoreHistory: [],
  isPracticeMode: false,
  practiceSentence: null,
  practiceAttempts: 0,

  setRecognitionState: (state) => set({ recognitionState: state }),
  setInterimTranscript: (text) => set({ interimTranscript: text }),
  setFinalTranscript: (text) => set({ finalTranscript: text }),
  setMatchResult: (result) => set({ matchResult: result }),
  recordResult: (result) =>
    set((s) => ({
      matchResult: result,
      scoreHistory: [...s.scoreHistory, result.score],
      attemptCount: s.attemptCount + 1,
    })),
  setActiveCaptionText: (text) => set({ activeCaptionText: text }),
  incrementAttempt: () => set((s) => ({ attemptCount: s.attemptCount + 1 })),
  resetAttempt: () => set({ attemptCount: 0, matchResult: null, finalTranscript: '', interimTranscript: '' }),
  resetSession: () =>
    set({
      attemptCount: 0,
      scoreHistory: [],
      matchResult: null,
      finalTranscript: '',
      interimTranscript: '',
      isPracticeMode: false,
      practiceSentence: null,
      practiceAttempts: 0,
    }),
  enterPracticeMode: (sentence) => set({ isPracticeMode: true, practiceSentence: sentence, practiceAttempts: 0 }),
  exitPracticeMode: () => set({ isPracticeMode: false, practiceSentence: null, practiceAttempts: 0 }),
  incrementPracticeAttempt: () => set((s) => ({ practiceAttempts: s.practiceAttempts + 1 })),
}));
