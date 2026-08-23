'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  onDismiss: () => void;
  duration?: number;
}

const config: Record<ToastType, { bg: string; color: string; border: string; icon: React.ReactNode }> = {
  success: {
    bg: 'var(--color-income-soft)',
    color: 'var(--color-income)',
    border: 'var(--color-income-border)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    bg: 'var(--color-expense-soft)',
    color: 'var(--color-expense)',
    border: 'var(--color-expense-border)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  warning: {
    bg: 'var(--color-warning-soft)',
    color: 'var(--color-warning)',
    border: 'var(--color-warning-border)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 2L2 17h16L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 9v4M10 14.5v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  info: {
    bg: 'var(--color-info-soft)',
    color: 'var(--color-info)',
    border: 'var(--color-info-border)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 9v5M10 7v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
};

export default function Toast({ message, type = 'info', onDismiss, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  const { bg, color, border, icon } = config[type];

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-3 rounded-2xl animate-fade-in max-w-[90vw]"
      style={{
        background: bg,
        color,
        border: `1px solid ${border}`,
        boxShadow: 'var(--shadow-md)',
        minWidth: '220px',
      }}
      role="status"
      aria-live="polite"
    >
      <span style={{ color }} className="shrink-0">{icon}</span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
