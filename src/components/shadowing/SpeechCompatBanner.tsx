'use client';

import { Globe, Mic, Lock } from 'lucide-react';
import { detectBrowser, type BrowserType } from '@/lib/utils/browserCompat';

export type CompatIssue = 'unsupported' | 'insecure' | 'denied';

interface Props {
  issue: CompatIssue;
}

const MIC_SETTINGS_GUIDE: Record<BrowserType, string> = {
  chrome: '주소창 왼쪽 자물쇠 아이콘 → 사이트 설정 → 마이크 → 허용',
  edge: '주소창 왼쪽 자물쇠 아이콘 → 사이트 권한 → 마이크 → 허용',
  safari: 'Safari 메뉴 → 설정 → 웹사이트 → 마이크 → 이 사이트 허용',
  firefox: '주소창 왼쪽 방패 아이콘 → 권한 → 마이크 접근 허용',
  other: '브라우저 설정 → 사이트 권한 → 마이크 → 허용',
};

export default function SpeechCompatBanner({ issue }: Props) {
  const browser = detectBrowser();

  if (issue === 'unsupported') {
    return (
      <div
        role="alert"
        className="mb-3 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40"
      >
        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            쉐도잉 기능을 사용하려면 Chrome 또는 Edge가 필요합니다
          </p>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
            현재 브라우저는 Web Speech API를 지원하지 않습니다. Chrome 또는 Edge에서 접속해주세요.
          </p>
        </div>
      </div>
    );
  }

  if (issue === 'insecure') {
    return (
      <div
        role="alert"
        className="mb-3 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40"
      >
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            마이크 기능은 HTTPS 환경에서만 사용 가능합니다
          </p>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
            보안 연결(https://)을 통해 접속해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="mb-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40"
    >
      <Mic className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
      <div>
        <p className="text-sm font-medium text-red-700 dark:text-red-300">
          마이크 권한이 차단되어 있습니다
        </p>
        <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
          {MIC_SETTINGS_GUIDE[browser]}
        </p>
      </div>
    </div>
  );
}
