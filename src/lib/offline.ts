/*
 * Persistencia offline-first basada en IndexedDB.
 * Este módulo solo se ejecuta en el navegador; las funciones son no-op en SSR.
 */

export type OfflineEntity = 'vehicles' | 'categories' | 'sessions' | 'transactions' | 'conflicts';
export type SyncOperationKind = 'create' | 'update' | 'delete';

export interface PendingOperation {
  id: string;
  status?: 'pending' | 'failed';
  entity: OfflineEntity;
  kind: SyncOperationKind;
  entityId: string;
  url: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

interface StoredRecord {
  id: string;
  entity: OfflineEntity;
  value: unknown;
  updatedAt: string;
  deleted?: boolean;
}

const DB_NAME = 'gestor-gastos-offline';
const DB_VERSION = 2;
const RECORDS_STORE = 'records';
const OPERATIONS_STORE = 'operations';
const META_STORE = 'meta';

let databasePromise: Promise<IDBDatabase> | null = null;

function isBrowser() {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  if (!isBrowser()) return Promise.reject(new Error('IndexedDB no está disponible'));
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir IndexedDB'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RECORDS_STORE)) {
        const records = db.createObjectStore(RECORDS_STORE, { keyPath: 'id' });
        records.createIndex('entity', 'entity', { unique: false });
      }
      if (!db.objectStoreNames.contains(OPERATIONS_STORE)) {
        const operations = db.createObjectStore(OPERATIONS_STORE, { keyPath: 'id' });
        operations.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });

  return databasePromise;
}

function transactionRequest<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const request = action(transaction.objectStore(storeName));
        request.onerror = () => reject(request.error ?? new Error('Error de IndexedDB'));
        request.onsuccess = () => resolve(request.result);
      })
  );
}

function transactionComplete(storeName: string, action: (store: IDBObjectStore) => void): Promise<void> {
  return openDatabase().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('Error de IndexedDB'));
        action(transaction.objectStore(storeName));
      })
  );
}

export function makeLocalId(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `local_${prefix}_${random}`;
}

export async function saveOfflineRecord(
  entity: OfflineEntity,
  id: string,
  value: unknown,
  deleted = false
): Promise<void> {
  if (!isBrowser()) return;
  await transactionComplete(RECORDS_STORE, (store) => {
    store.put({ id: `${entity}:${id}`, entity, value, deleted, updatedAt: new Date().toISOString() } satisfies StoredRecord);
  });
}

export async function removeOfflineRecord(entity: OfflineEntity, id: string): Promise<void> {
  if (!isBrowser()) return;
  await transactionComplete(RECORDS_STORE, (store) => store.delete(`${entity}:${id}`));
}

export async function getOfflineRecord<T>(entity: OfflineEntity, id: string): Promise<T | null> {
  if (!isBrowser()) return null;
  const record = await transactionRequest<StoredRecord | undefined>(RECORDS_STORE, 'readonly', (store) =>
    store.get(`${entity}:${id}`)
  );
  if (!record || record.deleted) return null;
  return record.value as T;
}

export async function listOfflineRecords<T>(entity: OfflineEntity): Promise<T[]> {
  if (!isBrowser()) return [];
  const records = await transactionRequest<StoredRecord[]>(RECORDS_STORE, 'readonly', (store) =>
    store.index('entity').getAll(entity)
  );
  return records.filter((record) => !record.deleted).map((record) => record.value as T);
}

export async function queueOperation(operation: Omit<PendingOperation, 'id' | 'createdAt' | 'attempts'>): Promise<PendingOperation> {
  const complete: PendingOperation = {
    ...operation,
    id: makeLocalId('operation'),
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  if (!isBrowser()) return complete;
  await transactionComplete(OPERATIONS_STORE, (store) => store.add(complete));
  return complete;
}

export async function listPendingOperations(): Promise<PendingOperation[]> {
  if (!isBrowser()) return [];
  const operations = await transactionRequest<PendingOperation[]>(OPERATIONS_STORE, 'readonly', (store) =>
    store.index('createdAt').getAll()
  );
  return operations.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function updatePendingOperation(operation: PendingOperation): Promise<void> {
  if (!isBrowser()) return;
  await transactionComplete(OPERATIONS_STORE, (store) => store.put(operation));
}

export async function deletePendingOperation(id: string): Promise<void> {
  if (!isBrowser()) return;
  await transactionComplete(OPERATIONS_STORE, (store) => store.delete(id));
}

export async function countPendingOperations(): Promise<number> {
  if (!isBrowser()) return 0;
  const operations = await listPendingOperations();
  return operations.filter((operation) => operation.status !== 'failed').length;
}

export async function markOperationFailed(operation: PendingOperation, error: string): Promise<void> {
  await updatePendingOperation({ ...operation, status: 'failed', lastError: error, attempts: operation.attempts + 1 });
}

export async function retryFailedOperations(): Promise<void> {
  const operations = await listPendingOperations();
  await Promise.all(
    operations
      .filter((operation) => operation.status === 'failed')
      .map((operation) => updatePendingOperation({ ...operation, status: 'pending', lastError: undefined }))
  );
}

export async function getSyncCursor(): Promise<string | null> {
  if (!isBrowser()) return null;
  const item = await transactionRequest<{ key: string; value: string } | undefined>(META_STORE, 'readonly', (store) => store.get('syncCursor'));
  return item?.value ?? null;
}

export async function getManualOffline(): Promise<boolean> {
  if (!isBrowser()) return false;
  const item = await transactionRequest<{ key: string; value: boolean } | undefined>(META_STORE, 'readonly', (store) => store.get('manualOffline'));
  return item?.value === true;
}

export async function setManualOffline(value: boolean): Promise<void> {
  if (!isBrowser()) return;
  await transactionComplete(META_STORE, (store) => store.put({ key: 'manualOffline', value }));
}

export interface SyncConflict {
  id: string;
  entity: OfflineEntity;
  entityId: string;
  operationId: string;
  localValue: unknown;
  serverValue: unknown;
  message: string;
  createdAt: string;
}

export async function saveSyncConflict(conflict: Omit<SyncConflict, 'id' | 'createdAt'>): Promise<void> {
  await saveOfflineRecord('conflicts', makeLocalId('conflict'), { ...conflict, createdAt: new Date().toISOString() });
}

export async function listSyncConflicts(): Promise<SyncConflict[]> {
  return listOfflineRecords<SyncConflict>('conflicts');
}

export async function deleteSyncConflict(id: string): Promise<void> {
  await removeOfflineRecord('conflicts', id);
}

export async function setSyncCursor(value: string): Promise<void> {
  if (!isBrowser()) return;
  await transactionComplete(META_STORE, (store) => store.put({ key: 'syncCursor', value }));
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof Error && /network|fetch|offline|failed/i.test(error.message));
}
