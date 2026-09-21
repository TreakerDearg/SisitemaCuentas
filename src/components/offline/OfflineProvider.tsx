'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { countPendingOperations } from '@/lib/offline';
import { syncPendingOperations } from '@/lib/sync';

type SyncState = 'idle' | 'syncing' | 'error';

interface OfflineContextValue {
  isOnline: boolean;
  pendingCount: number;
  syncState: SyncState;
  syncError: string | null;
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  const refreshPending = useCallback(async () => {
    setPendingCount(await countPendingOperations());
  }, []);

  const syncNow = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    setSyncState('syncing');
    setSyncError(null);
    try {
      await syncPendingOperations();
      await refreshPending();
      setSyncState('idle');
    } catch (error) {
      setSyncState('error');
      setSyncError(error instanceof Error ? error.message : 'No se pudo sincronizar');
      await refreshPending();
    }
  }, [refreshPending]);

  useEffect(() => {
    const updateOnline = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) void syncNow();
    };

    countPendingOperations().then((count) => setPendingCount(count));
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    const interval = window.setInterval(() => {
      void refreshPending();
      if (navigator.onLine) void syncNow();
    }, 30_000);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.clearInterval(interval);
    };
  }, [refreshPending, syncNow]);

  const value = useMemo(
    () => ({ isOnline, pendingCount, syncState, syncError, syncNow }),
    [isOnline, pendingCount, syncState, syncError, syncNow]
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline debe usarse dentro de OfflineProvider');
  return context;
}
