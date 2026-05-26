'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/watch')) return null;

  return (
    <footer className="border-t border-gray-100 px-4 py-6 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-600">
      © 2025 TubeEnglish — AI 영어 학습 서비스
    </footer>
  );
}
