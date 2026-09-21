'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      void navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('[offline] No se pudo registrar el Service Worker:', error);
      });
    });
  }, []);

  return null;
}
