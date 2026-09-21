'use client';

import { useEffect, useState } from 'react';
import { OfflineProvider } from '@/components/offline/OfflineProvider';
import OfflineStatus from '@/components/offline/OfflineStatus';
import ServiceWorkerRegister from '@/components/offline/ServiceWorkerRegister';
import SyncDiagnostics from '@/components/offline/SyncDiagnostics';
import SyncSelector from '@/components/offline/SyncSelector';

export default function ClientOfflineShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <OfflineProvider>
      <ServiceWorkerRegister />
      {children}
      <OfflineStatus />
      <SyncSelector />
      <SyncDiagnostics />
    </OfflineProvider>
  );
}
