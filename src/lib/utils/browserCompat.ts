export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function isSecureContextForSpeech(): boolean {
  if (typeof window === 'undefined') return true;
  return window.isSecureContext;
}

export type BrowserType = 'chrome' | 'edge' | 'safari' | 'firefox' | 'other';

export function detectBrowser(): BrowserType {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'edge';
  if (ua.includes('Chrome/')) return 'chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'safari';
  if (ua.includes('Firefox/')) return 'firefox';
  return 'other';
}
