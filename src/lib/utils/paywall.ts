export const PREMIUM_EMAILS = ['youdae.k@gmail.com'] as const;
export const FREE_DAILY_AI_LIMIT = 3;

export function isPremiumEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (PREMIUM_EMAILS as readonly string[]).includes(email.toLowerCase());
}
