import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] session exchange error:', error.message);
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  // public.users 레코드는 DB 트리거(on_auth_user_created)가 자동 생성
  return NextResponse.redirect(`${origin}${next}`);
}
