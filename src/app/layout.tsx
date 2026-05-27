import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import ThemeProvider from '@/components/common/ThemeProvider';
import AuthProvider from '@/components/auth/AuthProvider';
import ToastProvider from '@/components/common/ToastProvider';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tubeenglish.app';
const TITLE = 'TubeEnglish — 유튜브로 배우는 AI 영어';
const DESCRIPTION =
  '유튜브 영상을 보고, 따라 말하고, AI와 대화하며 실전 영어를 가장 빠르게 익혀보세요. 자막 동기화·쉐도잉·AI 튜터 교정 루프를 한 곳에서.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: TITLE,
    template: '%s | TubeEnglish',
  },
  description: DESCRIPTION,
  keywords: ['영어 학습', '유튜브 영어', '쉐도잉', 'AI 영어 튜터', '영어 자막', '발음 교정'],
  authors: [{ name: 'TubeEnglish' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: APP_URL,
    siteName: 'TubeEnglish',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TubeEnglish' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/api/og'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-white text-gray-900 dark:bg-[#1a1a1a] dark:text-gray-100">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s==='dark'||(s===null&&d)){document.documentElement.classList.add('dark');}})();`,
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Header />
              <div className="flex flex-1 flex-col">{children}</div>
              <Footer />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
