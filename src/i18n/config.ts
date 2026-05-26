export const locales = ['ko', 'en', 'ja', 'zh', 'th'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ko';
