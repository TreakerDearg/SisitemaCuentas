// ──────────────────────────────────────────────
// Cliente API – thin wrapper sobre fetch
// ──────────────────────────────────────────────
import {
  makeLocalId,
  queueOperation,
  saveOfflineRecord,
  removeOfflineRecord,
  isNetworkError,
  type OfflineEntity,
  getOfflineRecord,
  listOfflineRecords,
} from '@/lib/offline';
import { calculateLocalAnalytics } from '@/lib/localAnalytics';
import { updateActiveSessionSnapshot, removeFromActiveSessionSnapshot } from '@/lib/activeSession';
import { fetchWithTimeout } from '@/lib/network';
import type {
  ActiveSessionData,
  CloseSessionPayload,
  CreateSessionPayload,
  CreateTransactionPayload,
  CreateVehiclePayload,
  ExpenseCategory,
  Transaction,
  UpdateTransactionPayload,
  Vehicle,
  WorkSession,
} from '@/types';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function apiFetch<T>(
  url: string,
  options?: RequestInit,
  offline?: OfflineMutation<T>
): Promise<T> {
  try {
    const res = await fetchWithTimeout(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    const json: ApiResponse<T> = await res.json();

    if (!json.success || !res.ok) {
      const error = new Error(json.error ?? `Error ${res.status}`) as Error & { status?: number; code?: string; data?: unknown; existingSession?: unknown };
      error.status = res.status;
      error.code = (json as ApiResponse<T> & { code?: string }).code;
      error.data = json.data;
      error.existingSession = (json as ApiResponse<T> & { existingSession?: unknown }).existingSession;
      throw error;
    }

    if (offline?.entityId && json.data !== undefined) {
      await saveOfflineRecord(offline.entity, offline.entityId, json.data);
    }
    return json.data as T;
  } catch (error) {
    if (!offline || !isNetworkError(error)) throw error;
    await queueOperation({
      entity: offline.entity,
      kind: offline.kind,
      entityId: offline.entityId,
      url,
      method: offline.method,
      body: offline.body,
    });
    if (offline.optimistic !== undefined) {
      await saveOfflineRecord(offline.entity, offline.entityId, offline.optimistic);
      return offline.optimistic;
    }
    throw error;
  }
}

type OfflineMutation<T> = {
  entity: OfflineEntity;
  kind: 'create' | 'update' | 'delete';
  entityId: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  optimistic?: T;
};

// ─── Sessions ─────────────────────────────────

export async function getActiveSession(): Promise<ActiveSessionData | null> {
  try {
    const res = await fetchWithTimeout('/api/sessions/active', {
      headers: { 'Content-Type': 'application/json' },
    });

    // 404 = no hay jornada activa (respuesta esperada y válida)
    if (res.status === 404) return null;

    const json: ApiResponse<ActiveSessionData> & { code?: string } = await res.json();
    if (!json.success || !res.ok) {
      const error = new Error(json.error ?? `Error ${res.status}`) as Error & { status?: number; code?: string; data?: unknown };
      error.status = res.status;
      error.code = json.code;
      error.data = json.data;
      throw error;
    }

    const data = json.data as ActiveSessionData;
    await saveOfflineRecord('sessions', 'active', data);
    if (data.session?._id) await saveOfflineRecord('sessions', data.session._id, data);
    return data;
  } catch (error) {
    const typed = error as Error & { status?: number; code?: string; data?: { existingSessionId?: string } };
    if (typed.code === 'SESSION_ACTIVE_READ_FAILED' && typed.data?.existingSessionId) {
      const result = await getSessionById(typed.data.existingSessionId);
      const active = { session: result.session, transactions: result.transactions, summary: result.summary };
      await saveOfflineRecord('sessions', 'active', active);
      return active;
    }
    if (!isNetworkError(error) && typed.status !== 503 && typed.status !== 500) throw error;
    const cached = await getOfflineRecord<ActiveSessionData>('sessions', 'active');
    if (cached) return cached;
    throw new Error('No se pudo consultar la jornada activa y no hay una copia local disponible.');
  }
}

/**
 * Genera un ID de idempotencia para prevenir transacciones duplicadas.
 */
export function generateRequestId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// getSessions() eliminada — reemplazada por getSessionsHistory() que devuelve { data, meta }

export async function getSessionById(
  id: string
): Promise<{ session: WorkSession; transactions: Transaction[]; summary: ActiveSessionData['summary'] }> {
  try {
    const res = await fetchWithTimeout(`/api/sessions/${id}`, { headers: { 'Content-Type': 'application/json' } });
    const json: ApiResponse<{ session: WorkSession; transactions: Transaction[]; summary: ActiveSessionData['summary'] }> & { code?: string } = await res.json();
    if (!json.success || !res.ok) throw new Error(json.error ?? `Error ${res.status}`);
    await saveOfflineRecord('sessions', id, json.data);
    return json.data as { session: WorkSession; transactions: Transaction[]; summary: ActiveSessionData['summary'] };
  } catch (error) {
    if (!isNetworkError(error)) {
      const cached = await getOfflineRecord<{ session: WorkSession; transactions: Transaction[]; summary: ActiveSessionData['summary'] }>('sessions', id);
      if (cached) return cached;
    }
    const cached = await getOfflineRecord<{ session: WorkSession; transactions: Transaction[]; summary: ActiveSessionData['summary'] }>('sessions', id);
    if (cached) return cached;
    throw error;
  }
}

export async function createSession(
  payload: CreateSessionPayload
): Promise<WorkSession> {
  const id = makeLocalId('session');
  const now = new Date().toISOString();
  const optimistic = {
    _id: id,
    ...payload,
    vehicleId: payload.vehicleId as unknown as WorkSession['vehicleId'],
    status: 'open',
    clientRequestId: id,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  } as WorkSession;
  try {
    return await apiFetch<WorkSession>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ ...payload, clientRequestId: id }),
    }, {
      entity: 'sessions', kind: 'create', entityId: id, method: 'POST',
      body: { ...payload, clientRequestId: id }, optimistic,
    });
  } catch (error) {
    const typed = error as Error & { code?: string; data?: { existingSessionId?: string } };
    if (typed.code === 'SESSION_ALREADY_ACTIVE' && typed.data?.existingSessionId) {
      const active = await getSessionById(typed.data.existingSessionId);
      const data = { session: active.session, transactions: active.transactions, summary: active.summary };
      await saveOfflineRecord('sessions', 'active', data);
      throw Object.assign(new Error('Ya existe una jornada activa.'), { code: 'SESSION_ALREADY_ACTIVE', activeData: data });
    }
    throw error;
  }
}

export async function closeSession(
  id: string,
  payload: CloseSessionPayload
): Promise<WorkSession> {
  const body = { ...payload, clientRequestId: generateRequestId() };
  const cached = await getOfflineRecord<ActiveSessionData>('sessions', 'active');
  const optimistic = cached ? { ...cached.session, ...payload, status: 'closed' as const, endTime: new Date().toISOString() } : undefined;
  return apiFetch<WorkSession>(`/api/sessions/${id}/close`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, {
    entity: 'sessions', kind: 'update', entityId: id, method: 'PATCH', body, optimistic,
  });
}

// ─── Transactions ──────────────────────────────

export async function createTransaction(
  payload: CreateTransactionPayload
): Promise<Transaction> {
  const id = payload.clientRequestId ?? generateRequestId();
  const optimistic = {
    _id: id,
    ...payload,
    revision: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Transaction;
  const body = { ...payload, clientRequestId: id };
  const transaction = await apiFetch<Transaction>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(body),
  }, {
    entity: 'transactions', kind: 'create', entityId: id, method: 'POST', body, optimistic,
  });
  await updateActiveSessionSnapshot(transaction);
  return transaction;
}

export async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload
): Promise<Transaction> {
  const transaction = await apiFetch<Transaction>(`/api/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, { entity: 'transactions', kind: 'update', entityId: id, method: 'PATCH', body: { ...payload, expectedRevision: await getRevision('transactions', id) } });
  await updateActiveSessionSnapshot(transaction);
  return transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    await apiFetch<void>(`/api/transactions/${id}`, { method: 'DELETE' });
    await removeOfflineRecord('transactions', id);
    await removeFromActiveSessionSnapshot(id);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    await queueOperation({ entity: 'transactions', kind: 'delete', entityId: id, url: `/api/transactions/${id}`, method: 'DELETE' });
    await removeOfflineRecord('transactions', id);
    await removeFromActiveSessionSnapshot(id);
  }
}

// ─── Vehicles ─────────────────────────────────

export async function getVehicles(includeInactive = false): Promise<Vehicle[]> {
  try {
    const data = await apiFetch<Vehicle[]>(`/api/vehicles${includeInactive ? '?includeInactive=true' : ''}`);
    await Promise.all(data.map((vehicle) => saveOfflineRecord('vehicles', vehicle._id, vehicle)));
    return data;
  } catch (error) {
    if (!isNetworkError(error) && !(error instanceof Error && /500|503/i.test(error.message))) throw error;
    const cached = await listOfflineRecords<Vehicle>('vehicles');
    return includeInactive ? cached : cached.filter((vehicle) => vehicle.active);
  }
}

export async function createVehicle(
  payload: CreateVehiclePayload
): Promise<Vehicle> {
  const id = makeLocalId('vehicle');
  const now = new Date().toISOString();
  const optimistic = { _id: id, ...payload, active: true, revision: 1, createdAt: now, updatedAt: now } as Vehicle;
  const body = { ...payload, clientRequestId: id };
  const vehicle = await apiFetch<Vehicle>('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { entity: 'vehicles', kind: 'create', entityId: id, method: 'POST', body, optimistic });
  await saveOfflineRecord('vehicles', vehicle._id, vehicle);
  return vehicle;
}

export async function updateVehicle(id: string, payload: Partial<CreateVehiclePayload> & { active?: boolean }): Promise<Vehicle> {
  const vehicle = await apiFetch<Vehicle>(`/api/vehicles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, { entity: 'vehicles', kind: 'update', entityId: id, method: 'PATCH', body: { ...payload, expectedRevision: await getRevision('vehicles', id) } });
  await saveOfflineRecord('vehicles', id, vehicle);
  return vehicle;
}

// ─── Categories ───────────────────────────────

export async function getCategories(includeInactive = false): Promise<ExpenseCategory[]> {
  try {
    const data = await apiFetch<ExpenseCategory[]>(`/api/categories${includeInactive ? '?includeInactive=true' : ''}`);
    await Promise.all(data.map((category) => saveOfflineRecord('categories', category._id, category)));
    return data;
  } catch (error) {
    if (!isNetworkError(error) && !(error instanceof Error && /500|503/i.test(error.message))) throw error;
    const cached = await listOfflineRecords<ExpenseCategory>('categories');
    return includeInactive ? cached : cached.filter((category) => category.active);
  }
}

export async function createCategory(
  name: string
): Promise<ExpenseCategory> {
  const id = makeLocalId('category');
  const now = new Date().toISOString();
  const optimistic = { _id: id, name, active: true, revision: 1, createdAt: now, updatedAt: now } as ExpenseCategory;
  const body = { name, clientRequestId: id };
  const category = await apiFetch<ExpenseCategory>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { entity: 'categories', kind: 'create', entityId: id, method: 'POST', body, optimistic });
  await saveOfflineRecord('categories', category._id, category);
  return category;
}

export async function updateCategory(id: string, payload: { name?: string; active?: boolean }): Promise<ExpenseCategory> {
  const category = await apiFetch<ExpenseCategory>(`/api/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, { entity: 'categories', kind: 'update', entityId: id, method: 'PATCH', body: { ...payload, expectedRevision: await getRevision('categories', id) } });
  await saveOfflineRecord('categories', id, category);
  return category;
}

// ─── Analytics (Fase 4) ───────────────────────

import type {
  AnalyticsSummary,
  PlatformBreakdown,
  PaymentMethodBreakdown,
  ExpenseBreakdown,
  TrendData,
} from '@/types';

export interface AnalyticsFilter {
  from?: string;
  to?: string;
  vehicleId?: string;
}

function buildAnalyticsParams(filter: AnalyticsFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
  if (filter.vehicleId) params.set('vehicleId', filter.vehicleId);
  return params;
}

export async function getAnalyticsSummary(
  filter: AnalyticsFilter = {}
): Promise<AnalyticsSummary> {
  const params = buildAnalyticsParams(filter);
  try {
    return await apiFetch<AnalyticsSummary>(`/api/analytics/summary?${params}`);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return (await getLocalAnalytics(filter)).summary;
  }
}

export async function getAnalyticsPlatforms(
  filter: AnalyticsFilter = {}
): Promise<PlatformBreakdown> {
  const params = buildAnalyticsParams(filter);
  try {
    return await apiFetch<PlatformBreakdown>(`/api/analytics/platforms?${params}`);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return (await getLocalAnalytics(filter)).platforms;
  }
}

export async function getAnalyticsPaymentMethods(
  filter: AnalyticsFilter = {}
): Promise<PaymentMethodBreakdown> {
  const params = buildAnalyticsParams(filter);
  try {
    return await apiFetch<PaymentMethodBreakdown>(`/api/analytics/payment-methods?${params}`);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return (await getLocalAnalytics(filter)).paymentMethods;
  }
}

export async function getAnalyticsExpenses(
  filter: AnalyticsFilter = {}
): Promise<ExpenseBreakdown> {
  const params = buildAnalyticsParams(filter);
  try {
    return await apiFetch<ExpenseBreakdown>(`/api/analytics/expenses?${params}`);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return (await getLocalAnalytics(filter)).expenses;
  }
}

export async function getAnalyticsTrends(
  filter: AnalyticsFilter = {}
): Promise<TrendData> {
  const params = buildAnalyticsParams(filter);
  try {
    return await apiFetch<TrendData>(`/api/analytics/trends?${params}`);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    return (await getLocalAnalytics(filter)).trends;
  }
}

async function getRevision(entity: OfflineEntity, id: string): Promise<number | undefined> {
  const record = await getOfflineRecord<{ revision?: number }>(entity, id);
  return record?.revision;
}

async function getLocalAnalytics(filter: AnalyticsFilter) {
  const sessions = await listOfflineRecords<WorkSession>('sessions');
  const transactions = await listOfflineRecords<Transaction>('transactions');
  return calculateLocalAnalytics(sessions, transactions, filter);
}

export async function getSessionsHistory(filter: {
  from?: string;
  to?: string;
  vehicleId?: string;
  status?: 'open' | 'closed' | 'all';
  limit?: number;
  page?: number;
} = {}): Promise<{ data: WorkSession[]; meta: { total: number; page: number; limit: number; pages: number } }> {
  const params = new URLSearchParams();
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
  if (filter.vehicleId) params.set('vehicleId', filter.vehicleId);
  if (filter.status) params.set('status', filter.status);
  if (filter.limit) params.set('limit', String(filter.limit));
  if (filter.page) params.set('page', String(filter.page));

  const url = `/api/sessions?${params}`;
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    const json = await res.json();
    if (!json.success || !res.ok) throw new Error(json.error ?? `Error ${res.status}`);
    const result = { data: json.data as WorkSession[], meta: json.meta };
    await Promise.all(result.data.map((session) => saveOfflineRecord('sessions', session._id, session)));
    return result;
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    let sessions = await listOfflineRecords<WorkSession>('sessions');
    sessions = sessions.filter((session) => session._id !== 'active');
    if (filter.vehicleId) sessions = sessions.filter((session) => {
      const vehicleId = typeof session.vehicleId === 'string' ? session.vehicleId : session.vehicleId?._id;
      return vehicleId === filter.vehicleId;
    });
    if (filter.status && filter.status !== 'all') sessions = sessions.filter((session) => session.status === filter.status);
    if (filter.from) sessions = sessions.filter((session) => new Date(session.date) >= new Date(filter.from!));
    if (filter.to) sessions = sessions.filter((session) => new Date(session.date) <= new Date(`${filter.to}T23:59:59.999`));
    const limit = filter.limit ?? 50;
    const page = filter.page ?? 1;
    const start = (page - 1) * limit;
    return { data: sessions.slice(start, start + limit), meta: { total: sessions.length, page, limit, pages: Math.ceil(sessions.length / limit) } };
  }
}

// getSessionById se define arriba para permitir recuperación de una jornada activa.
