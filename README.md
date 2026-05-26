# TubeEnglish

유튜브 영상으로 배우는 AI 영어 학습 서비스.

자막 동기화 · 쉐도잉 발음 매칭 · AI 튜터 교정 루프를 한 곳에서.

## 기술 스택

- **Frontend**: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion
- **State**: Zustand
- **Backend**: Next.js API Routes · Supabase (Auth + DB)
- **AI**: Groq (Llama 3 70B) · Google Gemini (폴백)
- **Speech**: Web Speech API (STT) · Web Speech Synthesis API (TTS)

## 로컬 실행

```bash
npm install
cp .env.example .env.local  # 환경변수 입력
npm run dev
```

## 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOCALE=ko
```

## MVP 기능

- **Phase 1** — 유튜브 자막 동기화 플레이어
- **Phase 2** — 쉐도잉 + 발음 매칭 (LCS 알고리즘)
- **Phase 3** — AI 튜터 교정 루프 · Supabase 인증 · Streak 대시보드
