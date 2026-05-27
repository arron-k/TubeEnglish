import { create } from 'zustand';
import type { ChatMessage, AiTutorResponse, VideoContext, UILang, LearningLevel } from '@/types';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tutorResponse?: AiTutorResponse;
  timestamp: number;
}

interface ChatState {
  messages: DisplayMessage[];
  history: ChatMessage[];
  isLoading: boolean;
  isPracticeBlocked: boolean;
  repracticeTarget: string | null;
  repracticeAttempts: number;
  videoContext: VideoContext | null;
  uiLang: UILang;
  level: LearningLevel;
  sessionId: string;
  pendingPrompt: string | null;

  addUserMessage: (content: string) => void;
  addAssistantMessage: (response: AiTutorResponse) => void;
  setIsLoading: (loading: boolean) => void;
  setIsPracticeBlocked: (blocked: boolean) => void;
  startRepractice: (sentence: string) => void;
  completeRepractice: () => void;
  skipRepractice: () => void;
  incrementRepracticeAttempts: () => void;
  setVideoContext: (ctx: VideoContext) => void;
  setUiLang: (lang: UILang) => void;
  setLevel: (level: LearningLevel) => void;
  setPendingPrompt: (prompt: string | null) => void;
  clearChat: () => void;
}

const generateId = () => Math.random().toString(36).slice(2, 9);
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  history: [],
  isLoading: false,
  isPracticeBlocked: false,
  repracticeTarget: null,
  repracticeAttempts: 0,
  videoContext: null,
  uiLang: 'ko',
  level: 'beginner',
  sessionId: generateSessionId(),
  pendingPrompt: null,

  addUserMessage: (content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: generateId(), role: 'user', content, timestamp: Date.now() },
      ],
      history: [...s.history.slice(-18), { role: 'user', content }],
    })),

  addAssistantMessage: (response) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: generateId(),
          role: 'assistant',
          content: response.conversation_reply,
          tutorResponse: response,
          timestamp: Date.now(),
        },
      ],
      history: [...s.history.slice(-18), { role: 'assistant', content: response.conversation_reply }],
    })),

  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsPracticeBlocked: (blocked) => set({ isPracticeBlocked: blocked }),

  startRepractice: (sentence) =>
    set({ repracticeTarget: sentence, repracticeAttempts: 0, isPracticeBlocked: true }),

  completeRepractice: () =>
    set({ repracticeTarget: null, repracticeAttempts: 0, isPracticeBlocked: false }),

  skipRepractice: () =>
    set({ repracticeTarget: null, repracticeAttempts: 0, isPracticeBlocked: false }),

  incrementRepracticeAttempts: () =>
    set((s) => ({ repracticeAttempts: s.repracticeAttempts + 1 })),

  setVideoContext: (ctx) => set({ videoContext: ctx }),
  setUiLang: (lang) => set({ uiLang: lang }),
  setLevel: (level) => set({ level }),
  setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),
  clearChat: () => set({ messages: [], history: [], sessionId: generateSessionId(), pendingPrompt: null }),
}));
