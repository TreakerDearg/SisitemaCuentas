'use client';

import { useEffect, useRef, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/** Aviso temporal cuando se pierde la conexión; no permanece fijo en pantalla. */
export default function ConnectionBanner() {
  const status = useOnlineStatus();
  const previousStatus = useRef(status);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const lostConnection = previousStatus.current === 'online' && status === 'offline';
    previousStatus.current = status;

    if (!lostConnection) return;

    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 4_000);
    return () => window.clearTimeout(timer);
  }, [status]);

  if (!visible) return null;

  return (
    <div
      className="fixed left-3 right-3 top-3 z-50 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-semibold shadow-lg"
      style={{
        background: 'var(--color-warning-soft)',
        border: '1px solid var(--color-warning-border)',
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
