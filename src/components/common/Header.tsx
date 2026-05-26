'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import AuthButton from '@/components/auth/AuthButton';

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function DarkModeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export default function Header() {
  const pathname = usePathname();
  const isWatch = pathname?.startsWith('/watch');

  if (isWatch) {
    return (
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-2 backdrop-blur-sm dark:border-gray-800 dark:bg-[#1a1a1a]/90">
        <Link
          href="/"
          className="text-sm font-bold text-gray-900 dark:text-white"
          aria-label="TubeEnglish 홈으로"
        >
          Tube<span className="text-brand-600 dark:text-brand-400">English</span>
        </Link>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <AuthButton />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-[#1a1a1a]/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
          Tube<span className="text-brand-600 dark:text-brand-400">English</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            대시보드
          </Link>
          <DarkModeToggle />
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
