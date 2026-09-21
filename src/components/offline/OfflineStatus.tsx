'use client';

import { useOffline } from '@/components/offline/OfflineProvider';

export default function OfflineStatus() {
  const { isOnline, pendingCount, syncState, syncError, syncNow } = useOffline();

  if (isOnline && pendingCount === 0 && syncState === 'idle') return null;

  const label = !isOnline
    ? 'Sin conexión: los cambios se guardarán en este dispositivo'
    : syncState === 'syncing'
      ? 'Sincronizando cambios…'
      : syncError
        ? `Sincronización pendiente: ${syncError}`
        : `${pendingCount} cambio${pendingCount === 1 ? '' : 's'} pendiente${pendingCount === 1 ? '' : 's'}`;

  return (
    <div
      role="status"
      className="fixed left-3 right-3 top-3 z-50 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm shadow-lg"
      style={{
        background: !isOnline ? 'var(--color-surface-elevated)' : 'var(--color-accent)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <span>{label}</span>
      {isOnline && pendingCount > 0 && syncState !== 'syncing' && (
        <button type="button" onClick={() => void syncNow()} className="font-bold underline">
          Reintentar
        </button>
      )}
    </div>
  );
}
