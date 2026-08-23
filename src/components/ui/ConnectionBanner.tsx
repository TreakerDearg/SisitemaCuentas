'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * Banner discreto que aparece solo cuando el usuario está offline.
 * No ocupa espacio cuando está online.
 */
export default function ConnectionBanner() {
  const status = useOnlineStatus();

  if (status === 'online' || status === 'checking') return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold"
      style={{
        background: 'var(--color-warning-soft)',
        borderBottom: '1px solid var(--color-warning-border)',
        color: 'var(--color-warning)',
      }}
      role="status"
      aria-live="polite"
      aria-label="Sin conexión a internet"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M6 2L1 10h10L6 2z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M6 5v3M6 8.5v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      Sin conexión — los cambios se guardarán cuando vuelvas a conectarte
    </div>
  );
}
