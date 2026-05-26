import type { Caption } from '@/types';

export function findActiveCaptionIndex(captions: Caption[], currentTimeMs: number): number {
  let lo = 0;
  let hi = captions.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const { offset, duration } = captions[mid];

    if (currentTimeMs < offset) {
      hi = mid - 1;
    } else if (currentTimeMs >= offset + duration) {
      lo = mid + 1;
    } else {
      return mid;
    }
  }

  return -1;
}
