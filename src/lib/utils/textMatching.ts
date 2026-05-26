import type { MatchResult, WordResult } from '@/types';

const CONTRACTION_MAP: Record<string, string> = {
  "i'm": 'im', "i've": 'ive', "i'll": 'ill', "i'd": 'id',
  "you're": 'youre', "you've": 'youve', "you'll": 'youll', "you'd": 'youd',
  "he's": 'hes', "he'd": 'hed', "he'll": 'hell',
  "she's": 'shes', "she'd": 'shed', "she'll": 'shell',
  "it's": 'its', "it'll": 'itll',
  "we're": 'were', "we've": 'weve', "we'll": 'well', "we'd": 'wed',
  "they're": 'theyre', "they've": 'theyve', "they'll": 'theyll', "they'd": 'theyd',
  "that's": 'thats', "that'll": 'thatll', "that'd": 'thatd',
  "there's": 'theres', "there're": 'therere',
  "don't": 'dont', "doesn't": 'doesnt', "didn't": 'didnt',
  "won't": 'wont', "wouldn't": 'wouldnt', "shouldn't": 'shouldnt',
  "couldn't": 'couldnt', "can't": 'cant', "isn't": 'isnt',
  "aren't": 'arent', "wasn't": 'wasnt', "weren't": 'werent',
  "haven't": 'havent', "hasn't": 'hasnt', "hadn't": 'hadnt',
  "let's": 'lets', "what's": 'whats', "who's": 'whos',
};

const HOMOPHONES: Record<string, string[]> = {
  their: ['there', 'theyre', 'they\'re'],
  there: ['their', 'theyre', 'they\'re'],
  to: ['too', 'two'],
  too: ['to', 'two'],
  two: ['to', 'too'],
  your: ['you\'re', 'youre'],
  youre: ['your'],
  its: ['it\'s'],
  know: ['no'],
  no: ['know'],
  hear: ['here'],
  here: ['hear'],
  write: ['right'],
  right: ['write'],
  meet: ['meat', 'met'],
  met: ['meet'],
};

function normalize(text: string): string {
  let result = text.toLowerCase();
  for (const [contraction, expanded] of Object.entries(CONTRACTION_MAP)) {
    result = result.replace(new RegExp(contraction.replace(/'/g, "[''']"), 'g'), expanded);
  }
  // Remove punctuation except apostrophes (handled above)
  result = result.replace(/[^\w\s]/g, ' ');
  result = result.replace(/\s+/g, ' ').trim();
  return result;
}

function tokenize(text: string): string[] {
  return normalize(text).split(' ').filter(Boolean);
}

// LCS dp table — returns matched indices in `b` for each matched word in `a`
function lcs(a: string[], b: string[], allowHomophones: boolean): boolean[] {
  const m = a.length;
  const n = b.length;

  const wordsMatch = (wa: string, wb: string): boolean => {
    if (wa === wb) return true;
    if (allowHomophones) {
      const homos = HOMOPHONES[wa] ?? [];
      return homos.includes(wb);
    }
    return false;
  };

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (wordsMatch(a[i - 1], b[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find which words in `a` are matched
  const matched = new Array(m).fill(false);
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (wordsMatch(a[i - 1], b[j - 1])) {
      matched[i - 1] = true;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return matched;
}

export function calculateMatchScore(
  originalText: string,
  spokenText: string,
  allowHomophones = false,
): MatchResult {
  if (!spokenText.trim()) {
    const wordResults: WordResult[] = tokenize(originalText).map((word, index) => ({
      word,
      matched: false,
      index,
    }));
    return { score: 0, wordResults };
  }

  const originalTokens = tokenize(originalText);
  const spokenTokens = tokenize(spokenText);

  if (originalTokens.length === 0) {
    return { score: 100, wordResults: [] };
  }

  const matchedFlags = lcs(originalTokens, spokenTokens, allowHomophones);

  const wordResults: WordResult[] = originalTokens.map((word, index) => ({
    word,
    matched: matchedFlags[index],
    index,
  }));

  const matchedCount = matchedFlags.filter(Boolean).length;
  const score = Math.round((matchedCount / originalTokens.length) * 100);

  return { score, wordResults };
}
