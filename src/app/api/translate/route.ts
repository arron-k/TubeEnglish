import { NextRequest, NextResponse } from 'next/server';
import { translateFull } from '@/lib/ai/translate';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const text = searchParams.get('text');
  const videoId = searchParams.get('videoId') ?? '';
  const offsetStr = searchParams.get('offset') ?? '-1';
  const targetLang = searchParams.get('targetLang') ?? 'ko';
  const captionOffset = parseInt(offsetStr, 10);

  if (!text?.trim()) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  const supabase = await createClient();

  if (videoId && captionOffset >= 0) {
    const { data: cached } = await supabase
      .from('caption_translations')
      .select('natural_translation, literal_translation, key_expression')
      .eq('video_id', videoId)
      .eq('caption_offset', captionOffset)
      .eq('target_lang', targetLang)
      .maybeSingle();

    if (cached) {
      return NextResponse.json(
        {
          natural: cached.natural_translation,
          literal: cached.literal_translation,
          keyExpression: cached.key_expression ?? null,
          cached: true,
        },
        { headers: { 'Cache-Control': 'public, max-age=86400' } },
      );
    }
  }

  try {
    const result = await translateFull(text.trim(), targetLang);

    if (videoId && captionOffset >= 0) {
      await supabase.from('caption_translations').upsert(
        {
          video_id: videoId,
          caption_offset: captionOffset,
          original_text: text.trim(),
          natural_translation: result.natural,
          literal_translation: result.literal,
          key_expression: result.keyExpression,
          target_lang: targetLang,
        },
        { onConflict: 'video_id,caption_offset,target_lang', ignoreDuplicates: false },
      );
    }

    return NextResponse.json(
      { ...result, cached: false },
      { headers: { 'Cache-Control': 'public, max-age=86400' } },
    );
  } catch {
    return NextResponse.json({ error: 'Translation unavailable' }, { status: 502 });
  }
}
