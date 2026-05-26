import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { extractVideoId } from '@/lib/utils/youtubeParser';
import { groupCaptionsIntoSentences } from '@/lib/utils/captionGrouper';

interface CaptionItem {
  text: string;
  offset: number;
  duration: number;
}

const cache = new Map<string, { data: CaptionItem[]; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

const MOCK_CAPTIONS: CaptionItem[] = [
  { text: "Welcome to this lesson on English conversation.", offset: 1000, duration: 3000 },
  { text: "Today we're going to practice some common phrases.", offset: 4500, duration: 3200 },
  { text: "Let's start with greetings and introductions.", offset: 8200, duration: 2800 },
  { text: "When you meet someone new, you can say 'Nice to meet you'.", offset: 11500, duration: 3500 },
  { text: "Another common greeting is 'How are you doing?'", offset: 15500, duration: 2900 },
  { text: "You can reply with 'I'm doing well, thanks for asking'.", offset: 19000, duration: 3100 },
  { text: "Now let's talk about making plans with friends.", offset: 22500, duration: 2800 },
  { text: "You might say 'Are you free this weekend?'", offset: 25800, duration: 2700 },
  { text: "Or 'Would you like to grab some coffee sometime?'", offset: 29000, duration: 3000 },
  { text: "These phrases will help you sound more natural in conversation.", offset: 32500, duration: 3500 },
  { text: "Practice saying them out loud to build your confidence.", offset: 36500, duration: 3200 },
  { text: "Remember, the key to fluency is consistent practice.", offset: 40200, duration: 3000 },
];

async function fetchFromYoutubeTranscript(videoId: string): Promise<CaptionItem[] | null> {
  const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
  if (!transcript || transcript.length === 0) return null;
  return transcript.map((item) => ({
    text: item.text,
    offset: Math.round(item.offset),
    duration: Math.round(item.duration),
  }));
}

async function fetchFromSupadata(videoId: string): Promise<CaptionItem[] | null> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=en`,
    { headers: { 'x-api-key': apiKey } }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const content = data?.content;
  if (!Array.isArray(content) || content.length === 0) return null;

  return content.map((item: { text: string; offset: number; duration: number }) => ({
    text: item.text,
    offset: Math.round(item.offset),
    duration: Math.round(item.duration),
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('videoUrl');

  if (!videoUrl) {
    return NextResponse.json(
      { error: 'INVALID_URL', message: '유튜브 URL을 입력해주세요.' },
      { status: 400 }
    );
  }

  const videoId = extractVideoId(videoUrl);

  if (!videoId) {
    return NextResponse.json(
      { error: 'INVALID_URL', message: '올바른 유튜브 URL 형식이 아닙니다.' },
      { status: 400 }
    );
  }

  const cached = cache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ videoId, captions: cached.data });
  }

  const isProduction = process.env.NODE_ENV === 'production';

  try {
    const raw = isProduction
      ? await fetchFromSupadata(videoId)
      : await fetchFromYoutubeTranscript(videoId);

    if (raw && raw.length > 0) {
      const captions = groupCaptionsIntoSentences(raw);
      cache.set(videoId, { data: captions, expiresAt: Date.now() + CACHE_TTL_MS });
      return NextResponse.json({ videoId, captions });
    }
  } catch (error) {
    if (!isProduction) {
      console.error('[transcript] fetch failed:', error);
    }
  }

  const mockGrouped = groupCaptionsIntoSentences(MOCK_CAPTIONS);
  cache.set(videoId, { data: mockGrouped, expiresAt: Date.now() + CACHE_TTL_MS });
  return NextResponse.json({ videoId, captions: mockGrouped });
}
