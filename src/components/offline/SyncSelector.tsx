'use client';

import { useEffect, useState } from 'react';
import { useOffline } from '@/components/offline/OfflineProvider';
import { listSyncConflicts, type SyncConflict } from '@/lib/offline';

export default function SyncSelector() {
  const { isOnline, pendingCount, syncState, syncError, syncNow, manualOffline, toggleManualOffline } = useOffline();
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const disabled = !isOnline || manualOffline || syncState === 'syncing';

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void listSyncConflicts().then(setConflicts);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [syncState]);

  return (
    <section className="mx-auto w-full max-w-lg px-4 py-3">
      <button
        type="button"
        onClick={() => void toggleManualOffline()}
        className="mb-2 w-full rounded-2xl px-4 py-3 text-sm font-semibold"
        style={{
          background: manualOffline ? 'var(--color-warning-soft)' : 'var(--color-surface-elevated)',
          color: manualOffline ? 'var(--color-warning)' : 'var(--color-text-secondary)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        Modo offline {manualOffline ? 'ON' : 'OFF'}
      </button>
      <button
        type="button"
        onClick={() => void syncNow()}
        disabled={disabled}
        aria-label="Toque para iniciar la sincronizacion"
        className="w-full rounded-2xl px-4 py-4 text-center text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: isOnline ? 'var(--color-accent)' : 'var(--color-surface-elevated)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        {syncState === 'syncing'
          ? 'Sincronizando…'
          : manualOffline
            ? 'Modo offline activo'
            : !isOnline
              ? 'Sin conexión: sincronización no disponible'
            : pendingCount > 0
              ? `Toque para iniciar la sincronizacion (${pendingCount} pendiente${pendingCount === 1 ? '' : 's'})`
              : 'Toque para iniciar la sincronizacion'}
      </button>
      {syncError && (
        <p className="mt-2 text-center text-xs" style={{ color: 'var(--color-expense)' }} role="alert">
          {syncError}
        </p>
      )}
      {conflicts.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowConflicts((value) => !value)}
            className="mt-2 w-full text-center text-xs font-semibold underline"
            style={{ color: 'var(--color-warning)' }}
          >
            {conflicts.length} conflicto{conflicts.length === 1 ? '' : 's'} pendiente{conflicts.length === 1 ? '' : 's'}
          </button>
          {showConflicts && (
            <div className="mt-2 rounded-2xl p-3 text-xs" style={{ background: 'var(--color-warning-soft)', color: 'var(--color-warning)' }}>
              {conflicts.map((conflict) => (
                <p key={conflict.id} className="mb-2 last:mb-0">{conflict.message}</p>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
