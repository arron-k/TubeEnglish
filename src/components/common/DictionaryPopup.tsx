'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

interface DictionaryDefinition {
  definition: string;
  example?: string;
}

interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
}

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  meanings: DictionaryMeaning[];
}

interface PopupPosition {
  x: number;
  y: number;
}

interface Props {
  word: string;
  position: PopupPosition;
  onClose: () => void;
}

const POPUP_WIDTH = 300;
const POPUP_MAX_HEIGHT = 360;
const MARGIN = 12;

function clampPosition(x: number, y: number) {
  const vw = typeof window !== 'undefined'
    ? Math.max(window.innerWidth, document.documentElement.clientWidth, 400)
    : 800;

  const clampedX = Math.min(Math.max(x, MARGIN), vw - POPUP_WIDTH - MARGIN);
  const aboveY = y - POPUP_MAX_HEIGHT - MARGIN;
  const clampedY = aboveY > MARGIN ? aboveY : y + MARGIN;

  return { left: clampedX, top: clampedY };
}

function cleanWord(raw: string) {
  return raw.replace(/[^a-zA-Z'-]/g, '').toLowerCase();
}

async function fetchTranslation(text: string): Promise<string> {
  try {
    const res = await fetch(`/api/translate?text=${encodeURIComponent(text)}&target=ko`, {
      cache: 'no-store',
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.translation ?? '';
  } catch {
    return '';
  }
}

export default function DictionaryPopup({ word, position, onClose }: Props) {
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [wordTranslation, setWordTranslation] = useState('');
  const [translations, setTranslations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const { isSpeaking, speak } = useSpeechSynthesis();

  const coords = clampPosition(position.x, position.y);
  const cleanedWord = cleanWord(word);

  useEffect(() => {
    if (!cleanedWord) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);
    setEntry(null);
    setWordTranslation('');
    setTranslations([]);

    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanedWord}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(async (data: DictionaryEntry[]) => {
        const fetchedEntry = data[0];
        setEntry(fetchedEntry);
        setLoading(false);

        const definitionTexts = fetchedEntry.meanings
          .slice(0, 3)
          .map((m) => m.definitions[0]?.definition ?? '');

        const [wordKo, ...defResults] = await Promise.all([
          fetchTranslation(cleanedWord),
          ...definitionTexts.map(fetchTranslation),
        ]);
        setWordTranslation(wordKo);
        setTranslations(defResults);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [cleanedWord]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const firstDefinition = entry?.meanings[0]?.definitions[0];

  return (
    <motion.div
      ref={popupRef}
      initial={{ opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 4 }}
      transition={{ duration: 0.15 }}
      style={{ left: coords.left, top: coords.top, width: POPUP_WIDTH, zIndex: 9999 }}
      className="fixed rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
      role="dialog"
      aria-label={`${word} 단어 뜻`}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-semibold text-gray-900 dark:text-white">{cleanedWord}</span>
            {entry?.phonetic && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{entry.phonetic}</span>
            )}
          </div>
          {wordTranslation && (
            <span className="truncate text-xs font-medium text-indigo-500 dark:text-indigo-400">
              {wordTranslation}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => speak(cleanedWord)}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
              isSpeaking
                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300'
            }`}
            aria-label="발음 듣기"
            title="발음 듣기"
          >
            <SpeakerIcon isSpeaking={isSpeaking} />
          </button>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="닫기"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto px-4 py-3">
        {loading && (
          <div className="flex items-center justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        )}

        {notFound && !loading && (
          <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
            뜻을 찾을 수 없어요.
          </p>
        )}

        {entry && !loading && (
          <div className="flex flex-col gap-4">
            {entry.meanings.slice(0, 3).map((meaning, i) => (
              <div key={i}>
                <span className="mb-1.5 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-500 dark:bg-indigo-950 dark:text-indigo-400">
                  {meaning.partOfSpeech}
                </span>

                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {meaning.definitions[0]?.definition}
                </p>

                {translations[i] ? (
                  <p className="mt-1 text-sm leading-relaxed text-indigo-600 dark:text-indigo-400">
                    {translations[i]}
                  </p>
                ) : (
                  translations.length === 0 && (
                    <div className="mt-1 h-4 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                  )
                )}

                {meaning.definitions[0]?.example && (
                  <p className="mt-1.5 text-xs italic text-gray-400 dark:text-gray-500">
                    &ldquo;{meaning.definitions[0].example}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {firstDefinition && !loading && (
        <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-800">
          <button
            onClick={() => speak(`${cleanedWord}. ${firstDefinition.definition}`, 'en-US')}
            className="text-[11px] text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300"
          >
            예문까지 듣기
          </button>
        </div>
      )}
    </motion.div>
  );
}

function SpeakerIcon({ isSpeaking }: { isSpeaking: boolean }) {
  return isSpeaking ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}
