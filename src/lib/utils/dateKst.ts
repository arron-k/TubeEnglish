const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function toKstDateString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getTime() + KST_OFFSET_MS).toISOString().split('T')[0];
}

export function kstTodayString(): string {
  return toKstDateString(new Date());
}

export function kstYesterdayString(): string {
  return toKstDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
}
