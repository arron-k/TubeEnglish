import { useState, useCallback } from 'react';

export interface CaptionItem {
  text: string;
  offset: number;
  duration: number;
}

interface TranscriptState {
  videoId: string | null;
  captions: CaptionItem[];
  isLoading: boolean;
  error: string | null;
}

export function useTranscript() {
  const [state, setState] = useState<TranscriptState>({
    videoId: null,
    captions: [],
    isLoading: false,
    error: null,
  });

  const fetchTranscript = useCallback(async (videoUrl: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `/api/transcript?videoUrl=${encodeURIComponent(videoUrl)}`
      );
      const data = await response.json();

      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: data.message ?? '자막을 불러오는 데 실패했습니다.',
        }));
        return;
      }

      setState({
        videoId: data.videoId,
        captions: data.captions,
        isLoading: false,
        error: null,
      });
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ videoId: null, captions: [], isLoading: false, error: null });
  }, []);

  return { ...state, fetchTranscript, reset };
}
