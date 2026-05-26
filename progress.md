# TubeEnglish 개발 진행 현황

> 최종 업데이트: 2026-05-26  
> 프로덕션 URL: https://tube-english.vercel.app  
> 레포지토리: https://github.com/arron-k/TubeEnglish

---

## 전체 진행률

```
Phase 1 (자막 동기화 플레이어)  ██████████ 6/6  ✅ 완료
Phase 2 (쉐도잉 + 발음 매칭)    ██████████ 5/5  ✅ 완료
Phase 3 (AI 튜터 교정 루프)     ██████████ 6/6  ✅ 완료
버그픽스 / 고도화                ████░░░░░░ 진행 중
```

---

## Phase 1 — 자막 동기화 플레이어 ✅

| # | 기능 | 주요 파일 | 상태 |
|---|------|-----------|------|
| 1-1 | 프로젝트 초기 셋업 | `src/`, `tailwind.config`, `.env.local` | ✅ |
| 1-2 | 자막 추출 API | `app/api/transcript/route.ts`, `lib/utils/youtubeParser.ts`, `lib/utils/captionGrouper.ts` | ✅ |
| 1-3 | 유튜브 플레이어 컴포넌트 | `components/player/YoutubePlayer.tsx`, `PlaybackControls.tsx` | ✅ |
| 1-4 | 자막 동기화 하이라이트 | `components/player/CaptionList.tsx`, `CaptionItem.tsx`, `lib/utils/timeFormat.ts` | ✅ |
| 1-5 | URL 입력 + 랜딩 페이지 | `app/page.tsx`, `components/common/UrlInputBar.tsx` | ✅ |
| 1-6 | 반응형 레이아웃 + 다크모드 토글 | `app/watch/page.tsx`, `components/common/Header.tsx`, `Footer.tsx`, `ThemeProvider.tsx` | ✅ |

### Phase 1 주요 특이사항
- 자막 추출: 로컬은 `youtube-transcript` 패키지, 프로덕션(Vercel)은 Supadata API 사용 (유튜브 IP 제한 우회)
- Supabase에 자막 7일 캐시 적용 → 동일 영상 재접속 시 API 호출 절약

---

## Phase 2 — 쉐도잉 + 발음 매칭 ✅

| # | 기능 | 주요 파일 | 상태 |
|---|------|-----------|------|
| 2-1 | Web Speech API STT | `hooks/useSpeechRecognition.ts`, `components/shadowing/MicButton.tsx` | ✅ |
| 2-2 | 텍스트 매칭 알고리즘 (LCS) | `lib/utils/textMatching.ts` | ✅ |
| 2-3 | 점수 시각화 컴포넌트 | `components/shadowing/ScoreDisplay.tsx`, `WordDiffView.tsx` | ✅ |
| 2-4 | 단어 사전 팝업 + TTS | `components/common/DictionaryPopup.tsx`, `hooks/useSpeechSynthesis.ts` | ✅ |
| 2-5 | 마이크 권한 + 브라우저 호환성 | `hooks/useMicPermission.ts`, `components/shadowing/SpeechCompatBanner.tsx`, `lib/utils/browserCompat.ts` | ✅ |

---

## Phase 3 — AI 튜터 교정 루프 ✅

| # | 기능 | 주요 파일 | 상태 |
|---|------|-----------|------|
| 3-1 | AI 채팅 API (Groq + Gemini 폴백) | `app/api/chat/route.ts`, `lib/ai/groq.ts`, `lib/ai/gemini.ts`, `lib/ai/prompts.ts` | ✅ |
| 3-2 | 채팅 UI + 교정 카드 | `components/tutor/AiTutorChat.tsx`, `MessageBubble.tsx` | ✅ |
| 3-3 | 재연습 강제 루프 ★ | `components/tutor/RePracticeOverlay.tsx` | ✅ |
| 3-4 | Supabase 인증 + 학습 히스토리 저장 | `app/auth/callback/route.ts`, `components/auth/AuthButton.tsx`, `AuthProvider.tsx`, `app/api/save-session/route.ts`, `lib/supabase/` | ✅ |
| 3-5 | Streak 관리 + 대시보드 | `app/dashboard/page.tsx`, `components/dashboard/ActivityHeatmap.tsx`, `DashboardRefresher.tsx` | ✅ |
| 3-6 | 에러 처리 + 상용화 마무리 | `components/common/ErrorBoundary.tsx`, `Skeleton.tsx`, `ToastProvider.tsx`, `app/api/og/route.tsx` | ✅ |

---

## 버그픽스 / 고도화 이력

| 날짜 | 커밋 | 내용 |
|------|------|------|
| 2026-05-26 | `d7cec4e` | **단어 번역 기능 복구**: Lingva/MyMemory 무료 API가 Vercel IP에서 전부 실패 → Groq/Gemini LLM으로 교체 (`lib/ai/translate.ts` 신규) |
| 2026-05-26 | `7e17f84` | **AI 튜터 한자 누출 차단**: 한국어 피드백에 漢字(료리→料理 등)가 섞이는 문제 → 프롬프트 강화 + 언어 검증/재시도 레이어 추가 (`lib/ai/languageGuard.ts` 신규) |
| 2026-05-26 | `73f5665` | Supabase 자막 캐시 7일 TTL 추가 |
| 2026-05-26 | `94fd9f7` | 로컬/프로덕션 자막 추출 분기 처리 |
| 2026-05-26 | `3efa902` | 자막 추출 Supadata API 도입 |
| 2026-05-26 | `e61dd30` | 자막 실패 시 Mock 캡션 폴백 |

---

## 현재 알려진 이슈 / 다음 작업 후보

### 🔴 High (사용자 경험 직접 영향)
- [ ] **자막 추출 실패율** — Supadata API도 일부 영상에서 실패 → Mock 캡션으로 폴백됨. 영상 선택 가이드 UI 또는 수동 자막 입력 옵션 고려
- [ ] **STT 모바일 미지원** — iOS Safari는 Web Speech API 미지원. 안내 UI는 있으나 대안 없음

### 🟡 Medium (품질/안정성)
- [ ] **AI 응답 속도** — Groq 응답 평균 1~2초, 간헐적 3초+ → 스트리밍(SSE) 적용 고려
- [ ] **재연습 루프 UX** — 3회 실패 후 "나중에 복습" 버튼은 있으나, 스킵한 문장을 나중에 다시 볼 수 있는 UI 없음
- [ ] **다크모드 세부 보정** — 일부 컴포넌트에서 다크모드 색상 미적용 구간 존재

### 🟢 Low (개선/확장)
- [ ] **학습 리포트 강화** — 대시보드에 쉐도잉 평균 점수, 교정 횟수 등 세부 통계 추가
- [ ] **단어장 기능** — 사전 팝업에서 저장 → 나만의 단어장 페이지 (Phase 4 후보)
- [ ] **번역 언어 선택** — 현재 한국어 고정, UI 언어 설정과 연동 필요
- [ ] **Vercel 함수 타임아웃 최적화** — 번역 함수 병렬 호출 시 cold start 위험

---

## 기술 스택 요약

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 App Router + TypeScript |
| 스타일링 | Tailwind CSS + framer-motion |
| 상태관리 | Zustand (playerStore, shadowingStore, chatStore, authStore) |
| AI | Groq (llama-3.3-70b) primary / Gemini 2.5 Flash fallback |
| 음성인식 | Web Speech API (webkitSpeechRecognition) |
| DB / 인증 | Supabase (PostgreSQL + Auth) |
| 배포 | Vercel (main 브랜치 푸시 → 자동 배포) |
| 자막 추출 | youtube-transcript (로컬) / Supadata API (프로덕션) |
| 번역 | Groq LLM primary / Gemini LLM fallback |

---

## 환경 변수 목록

```env
GROQ_API_KEY=               # Groq API (AI 튜터 + 번역)
GEMINI_API_KEY=             # Google Gemini (폴백)
NEXT_PUBLIC_SUPABASE_URL=   # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon 키
SUPABASE_SERVICE_ROLE_KEY=  # Supabase 서버 전용 (자막 캐시)
SUPADATA_API_KEY=           # Supadata 자막 추출 (프로덕션)
```
