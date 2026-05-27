# TubeEnglish

유튜브 영상을 영어 학습 교재로 바꿔주는 AI 영어 학습 서비스.

**자막 동기화 → 쉐도잉 발음 매칭 → AI 튜터 교정 루프**를 한 곳에서. "보는 영어"를 "말하는 영어"로 바꿉니다.

- 프로덕션: https://tube-english.vercel.app
- 상태: MVP 17개 기능 + Phase 4 UX 개선 8개 완료, 프로덕션 배포 완료

## 핵심 차별점 — 재연습 강제 루프

다른 앱은 틀려도 그냥 넘어가지만, TubeEnglish는 AI가 교정한 문장을 **직접 말해서 80% 이상 통과할 때까지** 잡아둡니다. (3회 실패 시 "나중에 복습하기"로 스킵 가능)

## 기술 스택

- **Frontend**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion
- **State**: Zustand
- **Backend**: Next.js API Routes · Supabase (Auth + DB + 캐시)
- **AI**: Groq (`llama-3.3-70b-versatile`) → Google Gemini (폴백)
- **Speech**: Web Speech API — STT(음성 인식) · TTS(음성 합성), 브라우저 내장(무료)
- **자막 추출**: youtube-transcript(로컬) / Supadata API(프로덕션)
- **사전**: Free Dictionary API
- **배포**: Vercel (`main` push 시 자동 배포)

## 주요 기능

### Phase 1 — 자막 동기화 플레이어
- 유튜브 URL → 영상 + 자막 나란히 표시
- 자막을 문장 단위로 그루핑, 이진 탐색 기반 실시간 하이라이트·자동 스크롤
- 자막 클릭 시 해당 시점으로 점프

### Phase 2 — 쉐도잉 + 발음 매칭
- 마이크로 따라 말하면 STT로 인식 → 자막과 비교
- **LCS(최장 공통 부분 수열) 알고리즘** 기반 점수(0~100%), 단어별 ✓/✗, 동음이의어 허용
- 원형 프로그레스·별점 애니메이션, 점수별 격려 메시지
- 단어 클릭 시 사전 팝업(영어 정의 + LLM 한국어 번역 + 발음 듣기)

### Phase 3 — AI 튜터 교정 루프 ★
- AI 튜터 "Tube"와 영상 주제로 영어 대화 (구조화된 JSON 응답)
- 문법 오류 시 부드러운 보라색 교정 카드 ("이렇게 말하면 더 자연스러워요")
- **재연습 강제 루프** — 교정 문장을 통과할 때까지 반복
- Google OAuth 로그인 · 학습 기록 저장 · Streak(연속 학습일) + 대시보드(히트맵)

### Phase 4 — UX 개선
- 자막 액션 바 재배치 · AI 튜터 FAB · 번역/의역 토글 · 다크 모드 기본화
- 페이월(AI 대화 일 3회 제한, 자막·쉐도잉은 무제한) · 마이크로 인터랙션 정비 · Streak 헤더 배지

## 자막 번역 / 단어 사전

영어 원본은 외부에서, 한국어 번역은 LLM이 담당하며 **단일 창구 `/api/translate`**를 공유합니다.

- **자막 번역**: 활성 자막 자동 번역(의역/직역/핵심표현). Supabase `caption_translations`에 영구 캐시 → 같은 영상 재호출 시 AI 호출 없음
- **단어 사전**: Free Dictionary API로 정의·예문·발음기호, LLM으로 한국어 번역(병렬 요청), 브라우저 TTS로 발음

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 아래 환경변수 입력
npm run dev                  # http://localhost:3000
```

| 명령어 | 용도 |
|--------|------|
| `npm run dev` | 로컬 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | 타입 체크 |

### 주요 테스트 URL

- 랜딩: `http://localhost:3000`
- 플레이어: `http://localhost:3000/watch?v=dQw4w9WgXcQ`
- 대시보드: `http://localhost:3000/dashboard`

## 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GEMINI_API_KEY=
SUPADATA_API_KEY=                 # 프로덕션 자막 추출
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOCALE=ko
```

## 아키텍처 메모

- **자막 폴백 체인**: Supabase 캐시(7일) → Supadata API → Mock 자막
- **AI 폴백 체인**: Groq → Gemini → 하드코딩 응답
- **음성 인식**: Chrome/Edge 권장 (Safari·iOS 제한). 미지원 시 안내 UI 표시
- 상세 기능 정의는 루트의 `../기능정의서.md`, 개발 진행 로그는 `../progress.md` 참고

> ⚠️ Next.js 16은 기존과 다른 부분이 있습니다. 코드 작성 전 `node_modules/next/dist/docs/`의 관련 가이드를 확인하세요. (`middleware.ts` 대신 `proxy.ts`, Tailwind는 `globals.css`의 `@theme` 사용 등)
