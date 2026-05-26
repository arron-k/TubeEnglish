'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const REFRESH_FLAG_KEY = 'vt:dashboard_refresh_pending';

export default function DashboardRefresher() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const flag = sessionStorage.getItem(REFRESH_FLAG_KEY);
    if (!flag) return;
    sessionStorage.removeItem(REFRESH_FLAG_KEY);
    const timer = setTimeout(() => router.refresh(), 1500);
    return () => clearTimeout(timer);
  }, [router]);
  return null;
}

export function markDashboardForRefresh() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(REFRESH_FLAG_KEY, String(Date.now()));
}
