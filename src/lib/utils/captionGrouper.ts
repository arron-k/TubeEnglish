import type { Caption } from '@/types';

const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'vs', 'etc', 'approx',
  'dept', 'est', 'govt', 'inc', 'ltd', 'max', 'min', 'no', 'st', 'ave',
  'blvd', 'corp', 'co', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug',
  'sep', 'oct', 'nov', 'dec',
]);

const GAP_THRESHOLD_MS = 1000;
const MAX_SENTENCE_DURATION_MS = 12_000;
const SAFETY_MAX_WORDS = 16;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Auto-captions capitalize the first word of each sentence; a segment that
// starts uppercase signals a new sentence. Only reliable when the transcript
// actually mixes case (some segments start lowercase).
function startsWithCapital(text: string): boolean {
  const firstLetter = text.trim().match(/[A-Za-z]/)?.[0];
  return firstLetter !== undefined && firstLetter !== firstLetter.toLowerCase();
}

function isSentenceEnd(text: string): boolean {
  const trimmed = text.trim();

  if (/\.\.\.$/.test(trimmed)) return false;

  if (!/[.!?]$/.test(trimmed)) return false;

  if (/[.!?]$/.test(trimmed) && trimmed.length === 1) return false;

  // Single letter before period = likely initial (e.g. "J.")
  if (/\b[a-zA-Z]\.$/.test(trimmed)) return false;

  const wordBeforePeriod = trimmed.replace(/[.!?]+$/, '').split(/\s+/).pop() ?? '';
  if (ABBREVIATIONS.has(wordBeforePeriod.toLowerCase())) return false;

  return true;
}

// A single raw segment can itself contain several sentences (e.g. Supadata
// returns paragraph-sized chunks, or a transcript keeps mid-segment periods).
// Split on sentence-ending punctuation followed by whitespace, then re-merge
// pieces whose predecessor is not a real sentence end (abbreviation, initial,
// ellipsis) so boundary detection stays consistent with isSentenceEnd.
function splitTextIntoSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const rawParts = trimmed.split(/(?<=[.!?])\s+/);
  const merged: string[] = [];

  for (const part of rawParts) {
    if (merged.length === 0) {
      merged.push(part);
      continue;
    }
    const prev = merged[merged.length - 1];
    if (isSentenceEnd(prev)) {
      merged.push(part);
    } else {
      merged[merged.length - 1] = `${prev} ${part}`;
    }
  }

  return merged;
}

// Distribute a segment's timing across its split sentences proportionally to
// character length so caption highlighting stays roughly in sync.
function splitCaptionByTiming(caption: Caption): Caption[] {
  const sentences = splitTextIntoSentences(caption.text);
  if (sentences.length <= 1) return [caption];

  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0) || 1;
  let elapsed = 0;

  return sentences.map((sentence) => {
    const fraction = sentence.length / totalChars;
    const offset = Math.round(caption.offset + elapsed);
    const duration = Math.round(caption.duration * fraction);
    elapsed += caption.duration * fraction;
    return { text: sentence, offset, duration };
  });
}

export function groupCaptionsIntoSentences(rawCaptions: Caption[]): Caption[] {
  if (rawCaptions.length === 0) return [];

  // Break paragraph-sized segments into sentences first, so grouping can
  // operate on real sentence boundaries instead of arbitrary source chunks.
  const captions = rawCaptions.flatMap(splitCaptionByTiming);

  // YouTube ASR capitalizes the first word of each sentence; continuation
  // segments are lowercase. Only enable this heuristic when the transcript
  // actually contains lowercase-starting segments (mixed-case transcript).
  const usesMixedCase = captions.some((c) => {
    const firstLetter = c.text.trim().match(/[A-Za-z]/)?.[0];
    return firstLetter !== undefined && firstLetter === firstLetter.toLowerCase();
  });

  const grouped: Caption[] = [];
  let buffer: Caption[] = [];
  let bufferWords = 0;

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    const first = buffer[0];
    const last = buffer[buffer.length - 1];
    grouped.push({
      text: buffer.map((c) => c.text.trim()).join(' '),
      offset: first.offset,
      duration: last.offset + last.duration - first.offset,
    });
    buffer = [];
    bufferWords = 0;
  };

  for (let i = 0; i < captions.length; i++) {
    const current = captions[i];
    const next = captions[i + 1];

    buffer.push(current);
    bufferWords += countWords(current.text);

    const bufferStart = buffer[0].offset;
    const bufferDurationSoFar = current.offset + current.duration - bufferStart;
    const timeGapToNext = next ? next.offset - (current.offset + current.duration) : Infinity;
    const nextStartsSentence = !!next && usesMixedCase && startsWithCapital(next.text);
    const endsWithComma = /,$/.test(current.text.trim());

    const shouldFlush =
      isSentenceEnd(current.text) ||
      nextStartsSentence ||
      timeGapToNext > GAP_THRESHOLD_MS ||
      bufferDurationSoFar >= MAX_SENTENCE_DURATION_MS ||
      (bufferWords >= SAFETY_MAX_WORDS && endsWithComma);

    if (shouldFlush) flushBuffer();
  }

  flushBuffer();
  return grouped;
}
