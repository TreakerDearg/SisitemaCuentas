// ──────────────────────────────────────────────
// Cliente API – thin wrapper sobre fetch
// ──────────────────────────────────────────────
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
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success || !res.ok) {
    throw new Error(json.error ?? `Error ${res.status}`);
  }

  return json.data as T;
}

// ─── Sessions ─────────────────────────────────

export async function getActiveSession(): Promise<ActiveSessionData | null> {
  try {
    return await apiFetch<ActiveSessionData>('/api/sessions/active');
  } catch {
    return null;
  }
}

/**
 * Genera un ID de idempotencia para prevenir transacciones duplicadas.
 * Formato: timestamp_random (no necesita crypto fuerte, solo unicidad práctica).
 */
export function generateRequestId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function getSessions(): Promise<WorkSession[]> {
  return apiFetch<WorkSession[]>('/api/sessions');
}

export async function createSession(
  payload: CreateSessionPayload
): Promise<WorkSession> {
  return apiFetch<WorkSession>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function closeSession(
  id: string,
  payload: CloseSessionPayload
): Promise<WorkSession> {
  return apiFetch<WorkSession>(`/api/sessions/${id}/close`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ─── Transactions ──────────────────────────────

export async function createTransaction(
  payload: CreateTransactionPayload
): Promise<Transaction> {
  return apiFetch<Transaction>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload
): Promise<Transaction> {
  return apiFetch<Transaction>(`/api/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiFetch<void>(`/api/transactions/${id}`, { method: 'DELETE' });
}

// ─── Vehicles ─────────────────────────────────

export async function getVehicles(): Promise<Vehicle[]> {
  return apiFetch<Vehicle[]>('/api/vehicles');
}

export async function createVehicle(
  payload: CreateVehiclePayload
): Promise<Vehicle> {
  return apiFetch<Vehicle>('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Categories ───────────────────────────────

export async function getCategories(): Promise<ExpenseCategory[]> {
  return apiFetch<ExpenseCategory[]>('/api/categories');
}

export async function createCategory(
  name: string
): Promise<ExpenseCategory> {
  return apiFetch<ExpenseCategory>('/api/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
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
  return apiFetch<AnalyticsSummary>(`/api/analytics/summary?${params}`);
}

export async function getAnalyticsPlatforms(
  filter: AnalyticsFilter = {}
): Promise<PlatformBreakdown> {
  const params = buildAnalyticsParams(filter);
  return apiFetch<PlatformBreakdown>(`/api/analytics/platforms?${params}`);
}

export async function getAnalyticsPaymentMethods(
  filter: AnalyticsFilter = {}
): Promise<PaymentMethodBreakdown> {
  const params = buildAnalyticsParams(filter);
  return apiFetch<PaymentMethodBreakdown>(`/api/analytics/payment-methods?${params}`);
}

export async function getAnalyticsExpenses(
  filter: AnalyticsFilter = {}
): Promise<ExpenseBreakdown> {
  const params = buildAnalyticsParams(filter);
  return apiFetch<ExpenseBreakdown>(`/api/analytics/expenses?${params}`);
}

export async function getAnalyticsTrends(
  filter: AnalyticsFilter = {}
): Promise<TrendData> {
  const params = buildAnalyticsParams(filter);
  return apiFetch<TrendData>(`/api/analytics/trends?${params}`);
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
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  const json = await res.json();
  if (!json.success || !res.ok) throw new Error(json.error ?? `Error ${res.status}`);
  return { data: json.data, meta: json.meta };
}

export async function getSessionById(
  id: string
): Promise<{ session: WorkSession; transactions: Transaction[]; summary: ActiveSessionData['summary'] }> {
  const res = await fetch(`/api/sessions/${id}`, { headers: { 'Content-Type': 'application/json' } });
  const json = await res.json();
  if (!json.success || !res.ok) throw new Error(json.error ?? `Error ${res.status}`);
  return json.data;
}
