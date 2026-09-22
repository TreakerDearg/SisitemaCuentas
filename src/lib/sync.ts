import { fetchWithTimeout } from '@/lib/network';
import {
  deletePendingOperation,
  isNetworkError,
  listPendingOperations,
  updatePendingOperation,
  markOperationFailed,
  saveOfflineRecord,
  removeOfflineRecord,
  type PendingOperation,
  getSyncCursor,
  setSyncCursor,
  saveSyncConflict,
  getManualOffline
} from '@/lib/offline';

export interface SyncResult {
  applied: number;
  failed: number;
  remaining: number;
}

export async function getFailedSyncOperations() {
  return (await listPendingOperations()).filter((operation) => operation.status === 'failed');
}

let syncPromise: Promise<SyncResult> | null = null;

/** Envía las operaciones locales en orden y conserva las que no pudieron aplicarse. */
export function syncPendingOperations(): Promise<SyncResult> {
  if (syncPromise) return syncPromise;
  syncPromise = syncQueue().finally(() => {
    syncPromise = null;
  });
  return syncPromise;
}

async function syncQueue(): Promise<SyncResult> {
  if (await getManualOffline()) {
    return { applied: 0, failed: 0, remaining: await countPendingSafe() };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { applied: 0, failed: 0, remaining: await countPendingSafe() };
  }

  const operations = await listPendingOperations();
  let applied = 0;
  let failed = 0;

  const pending = operations.filter((item) => item.status !== 'failed');
  if (pending.length > 0) {
    try {
      const batch = await sendBatch(pending);
      for (const operation of pending) {
        const result = batch.results.find((item) => item.id === operation.id);
        if (!result) continue;
        if (result.success) {
          await applySyncResult(operation, result.data);
          await deletePendingOperation(operation.id);
          applied += 1;
        } else {
          failed += 1;
          if (result.permanent) {
            if (result.conflict) {
              await saveSyncConflict({
                entity: operation.entity,
                entityId: operation.entityId,
                operationId: operation.id,
                localValue: operation.body,
                serverValue: result.serverValue,
                message: result.error ?? 'Conflicto de versión',
              });
            }
            await markOperationFailed(operation, result.error ?? 'Operación rechazada por el servidor');
          } else await updatePendingOperation({ ...operation, attempts: operation.attempts + 1, lastError: result.error ?? 'Error de sincronización' });
        }
      }
    } catch (error) {
      if (!isNetworkError(error)) throw error;
      for (const operation of pending) {
        await updatePendingOperation({ ...operation, attempts: operation.attempts + 1, lastError: error instanceof Error ? error.message : 'Error de red' });
      }
      return { applied: 0, failed: pending.length, remaining: await countPendingSafe() };
    }
  }

  await pullServerChanges();

  return {
    applied,
    failed,
    remaining: await countPendingSafe(),
  };
}

async function sendBatch(operations: PendingOperation[]): Promise<{
  results: Array<{ id: string; success: boolean; data?: unknown; error?: string; permanent?: boolean; conflict?: boolean; serverValue?: unknown }>;
}> {
  const response = await fetchWithTimeout('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operations: operations.map(({ id, entity, kind, entityId, method, body }) => ({ id, entity, kind, entityId, method, body })), lastSyncAt: await getSyncCursor() }),
  });
  const payload = await response.json() as { success?: boolean; error?: string; data?: { results?: Array<{ id: string; success: boolean; data?: unknown; error?: string; permanent?: boolean }> } };
  if (!response.ok || payload.success === false || !payload.data?.results) throw new Error(payload.error ?? `Error ${response.status}`);
  return { results: payload.data.results };
}

async function sendOperation(operation: PendingOperation): Promise<unknown> {
  const response = await fetchWithTimeout(operation.url, {
    method: operation.method,
    headers: { 'Content-Type': 'application/json' },
    body: operation.body === undefined ? undefined : JSON.stringify(operation.body),
  });

  let payload: { success?: boolean; error?: string; data?: unknown } = {};
  try {
    payload = await response.json();
  } catch {
    // Algunas respuestas pueden no tener JSON; el status seguirá siendo válido.
  }

  if (!response.ok || payload.success === false) {
    const error = new Error(payload.error ?? `Error ${response.status}`);
    // Los errores 4xx representan datos inválidos o conflictos y no deben reintentarse infinitamente.
    if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
      throw new PermanentSyncError(error.message);
    }
    throw error;
  }

  return payload.data;
}

async function applySyncResult(operation: PendingOperation, result: unknown): Promise<void> {
  if (operation.kind === 'delete') {
    await removeOfflineRecord(operation.entity, operation.entityId);
    return;
  }
  if (result !== undefined) {
    await saveOfflineRecord(operation.entity, operation.entityId, result);
  }
}

async function pullServerChanges(): Promise<void> {
  const lastSyncAt = await getSyncCursor();
  const response = await fetchWithTimeout('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operations: [], lastSyncAt }),
  });
  const payload = await response.json() as {
    success?: boolean;
    error?: string;
    data?: { serverTime?: string; changes?: Array<{ entity: 'sessions' | 'transactions' | 'vehicles' | 'categories'; value: { _id?: string } }> };
  };
  if (!response.ok || payload.success === false) throw new Error(payload.error ?? `Error ${response.status}`);
  for (const change of payload.data?.changes ?? []) {
    if (change.value._id) await saveOfflineRecord(change.entity, change.value._id, change.value);
  }
  if (payload.data?.serverTime) await setSyncCursor(payload.data.serverTime);
}

class PermanentSyncError extends Error {}

async function countPendingSafe(): Promise<number> {
  const operations = await listPendingOperations();
  return operations.filter((operation) => operation.status !== 'failed').length;
}

export { PermanentSyncError };
