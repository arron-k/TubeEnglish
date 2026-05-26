import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/lib/ai/translate';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const text = searchParams.get('text');
  const target = searchParams.get('target') ?? 'ko';

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  try {
    const translation = await translateText(text.trim(), target);
    return NextResponse.json(
      { translation },
      { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' } },
    );
  } catch {
    return NextResponse.json({ error: 'Translation unavailable' }, { status: 502 });
  }
}
