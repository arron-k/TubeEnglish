export interface Caption {
  text: string;
  offset: number;
  duration: number;
}

export interface TranscriptResponse {
  videoId: string;
  captions: Caption[];
}

export type SpeechRecognitionState = 'idle' | 'listening' | 'processing' | 'result' | 'error';

export interface WordResult {
  word: string;
  matched: boolean;
  index: number;
}

export interface MatchResult {
  score: number;
  wordResults: WordResult[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiTutorResponse {
  conversation_reply: string;
  correction_needed: boolean;
  corrected_sentence: string | null;
  error_type: string | null;
  tutor_feedback: string | null;
  key_expression: {
    expression: string;
    example: string;
  } | null;
}

export interface VideoContext {
  videoId: string;
  title?: string;
  topic?: string;
}

export type UILang = 'ko' | 'en' | 'ja' | 'zh' | 'th';
export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';
