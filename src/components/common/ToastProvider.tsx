'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContext {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastCtx = createContext<ToastContext>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
};

const COLORS: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-brand-500',
};

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-lg dark:bg-gray-800"
      style={{ minWidth: '280px', maxWidth: '360px' }}
    >
      <span
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${COLORS[item.type]}`}
      >
        {ICONS[item.type]}
      </span>
      <p className="flex-1 text-sm text-gray-800 dark:text-gray-100">{item.message}</p>
      <button
        onClick={() => onDismiss(item.id)}
        aria-label="알림 닫기"
        className="flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </motion.div>
  );
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div
        aria-label="알림"
        className="fixed right-4 top-4 z-[9999] flex flex-col gap-2"
        style={{ pointerEvents: 'none' }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <div key={item.id} style={{ pointerEvents: 'auto' }}>
              <Toast item={item} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
