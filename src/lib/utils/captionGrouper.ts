import type { Caption } from '@/types';

const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'vs', 'etc', 'approx',
  'dept', 'est', 'govt', 'inc', 'ltd', 'max', 'min', 'no', 'st', 'ave',
  'blvd', 'corp', 'co', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug',
  'sep', 'oct', 'nov', 'dec',
]);

const GAP_THRESHOLD_MS = 1500;
const MAX_SENTENCE_DURATION_MS = 20_000;

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

export function groupCaptionsIntoSentences(captions: Caption[]): Caption[] {
  if (captions.length === 0) return [];

  const grouped: Caption[] = [];
  let buffer: Caption[] = [];

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
  };

  for (let i = 0; i < captions.length; i++) {
    const current = captions[i];
    const next = captions[i + 1];

    buffer.push(current);

    const bufferStart = buffer[0].offset;
    const bufferDurationSoFar = current.offset + current.duration - bufferStart;
    const timeGapToNext = next ? next.offset - (current.offset + current.duration) : Infinity;

    const shouldFlush =
      isSentenceEnd(current.text) ||
      timeGapToNext > GAP_THRESHOLD_MS ||
      bufferDurationSoFar >= MAX_SENTENCE_DURATION_MS;

    if (shouldFlush) {
      flushBuffer();
    }
  }

  flushBuffer();

  return grouped;
}
