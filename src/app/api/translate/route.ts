import { NextRequest, NextResponse } from 'next/server';

interface LingvaResponse {
  translation: string;
}

interface MyMemoryResponse {
  responseData: { translatedText: string };
  responseStatus: number;
}

// Lingva public instances — tried in order until one succeeds
const LINGVA_INSTANCES = [
  'https://lingva.ml',
  'https://translate.plausibility.cloud',
  'https://lingva.thedaviddelta.com',
];

async function translateViaLingva(text: string, target: string): Promise<string | null> {
  for (const base of LINGVA_INSTANCES) {
    try {
      const url = `${base}/api/v1/en/${target}/${encodeURIComponent(text)}`;
      const res = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(4000) });
      if (!res.ok) continue;
      const data: LingvaResponse = await res.json();
      if (data.translation) return data.translation;
    } catch {
      continue;
    }
  }
  return null;
}

async function translateViaMyMemory(text: string, target: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${target}`;
    const res = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data: MyMemoryResponse = await res.json();
    if (data.responseStatus !== 200) return null;
    return data.responseData.translatedText;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const text = searchParams.get('text');
  const target = searchParams.get('target') ?? 'ko';

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  const translation =
    (await translateViaLingva(text, target)) ??
    (await translateViaMyMemory(text, target));

  if (!translation) {
    return NextResponse.json({ error: 'Translation unavailable' }, { status: 502 });
  }

  return NextResponse.json(
    { translation },
    { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' } },
  );
}
