'use client';

import { useEffect, useState } from 'react';
import { retryFailedOperations } from '@/lib/offline';
import { getFailedSyncOperations, syncPendingOperations } from '@/lib/sync';
import type { PendingOperation } from '@/lib/offline';

export default function SyncDiagnostics() {
  const [failed, setFailed] = useState<PendingOperation[]>([]);
  const [open, setOpen] = useState(false);

  async function load() {
    setFailed(await getFailedSyncOperations());
  }

  useEffect(() => {
    let cancelled = false;
    getFailedSyncOperations().then((operations) => {
      if (!cancelled) setFailed(operations);
    });
    return () => { cancelled = true; };
  }, []);

  if (failed.length === 0) return null;

  async function retry() {
    await retryFailedOperations();
    await syncPendingOperations();
    await load();
  }

  return (
    <section className="mx-auto w-full max-w-lg px-4 pb-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full rounded-2xl px-4 py-3 text-left text-sm"
        style={{ background: 'var(--color-warning-soft)', color: 'var(--color-warning)', border: '1px solid var(--color-warning-border)' }}
      >
        {failed.length} operación{failed.length === 1 ? '' : 'es'} requiere{failed.length === 1 ? '' : 'n'} atención
      </button>
      {open && (
        <div className="mt-2 rounded-2xl p-4 text-sm" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Estas operaciones fueron rechazadas por el servidor y no se reintentan automáticamente.
          </p>
          <ul className="mt-3 flex flex-col gap-2" style={{ color: 'var(--color-text-muted)' }}>
            {failed.map((operation) => (
              <li key={operation.id}>
                {operation.kind} {operation.entity}: {operation.lastError ?? 'Error desconocido'}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => void retry()} className="mt-4 font-bold underline" style={{ color: 'var(--color-accent)' }}>
            Reintentar operaciones
          </button>
        </div>
      )}
    </section>
  );
}
