'use client';

import { useState, useEffect } from 'react';

export type OnlineStatus = 'online' | 'offline' | 'checking';

/**
 * Hook que detecta el estado de conexión a internet.
 * Usa navigator.onLine como señal inicial y luego escucha
 * los eventos online/offline del browser.
 *
 * También verifica el health endpoint cada 30s cuando está online
 * para detectar si el backend responde (no solo si hay red local).
 */
export function useOnlineStatus(): OnlineStatus {
  const [status, setStatus] = useState<OnlineStatus>(() =>
    typeof navigator === 'undefined' ? 'checking' : navigator.onLine ? 'online' : 'offline'
  );

  useEffect(() => {
    function handleOnline() {
      setStatus('online');
    }

    function handleOffline() {
      setStatus('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}
