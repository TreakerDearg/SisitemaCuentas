'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { countPendingOperations, getManualOffline, setManualOffline } from '@/lib/offline';
import { syncPendingOperations } from '@/lib/sync';

type SyncState = 'idle' | 'syncing' | 'error';

interface OfflineContextValue {
  isOnline: boolean;
  pendingCount: number;
  syncState: SyncState;
  syncError: string | null;
  syncNow: () => Promise<void>;
  manualOffline: boolean;
  toggleManualOffline: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [manualOffline, setManualOfflineState] = useState(false);

  const refreshPending = useCallback(async () => {
    setPendingCount(await countPendingOperations());
  }, []);

  const toggleManualOffline = useCallback(async () => {
    const next = !manualOffline;
    await setManualOffline(next);
    setManualOfflineState(next);
    if (!next && navigator.onLine) await syncPendingOperations();
  }, [manualOffline]);

  const syncNow = useCallback(async () => {
    if (manualOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
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
  }, [manualOffline, refreshPending]);

  useEffect(() => {
    const updateOnline = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online && !manualOffline) void syncNow();
    };

    Promise.all([countPendingOperations(), getManualOffline()]).then(([count, offline]) => {
      setPendingCount(count);
      setManualOfflineState(offline);
    });
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    const interval = window.setInterval(() => {
      void refreshPending();
      if (navigator.onLine && !manualOffline) void syncNow();
    }, 30_000);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.clearInterval(interval);
    };
  }, [manualOffline, refreshPending, syncNow]);

  const value = useMemo(
    () => ({ isOnline, pendingCount, syncState, syncError, syncNow, manualOffline, toggleManualOffline }),
    [isOnline, pendingCount, syncState, syncError, syncNow, manualOffline, toggleManualOffline]
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline debe usarse dentro de OfflineProvider');
  return context;
}
