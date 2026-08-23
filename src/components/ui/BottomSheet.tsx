'use client';

import { useEffect, useRef } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'var(--color-surface-overlay)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative z-10 w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden animate-slide-up"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderBottom: 'none',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
          <div
            className="w-9 h-1 rounded-full"
            style={{ background: 'var(--color-border-strong)' }}
          />
        </div>

        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between px-5 pt-2 pb-4"
            style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
          >
            <h2 className="text-sm font-semibold tracking-widest uppercase section-label" style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-tertiary)' }}
              aria-label="Cerrar"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div
          className="overflow-y-auto bottom-sheet-content"
          style={{
            maxHeight: '85dvh',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
