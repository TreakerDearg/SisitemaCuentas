// ──────────────────────────────────────────────
// Cliente API – Conexión directa a Next.js / MongoDB
// ──────────────────────────────────────────────
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
  AnalyticsSummary,
  PlatformBreakdown,
  PaymentMethodBreakdown,
  ExpenseBreakdown,
  TrendData,
} from '@/types';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  existingSession?: unknown;
};

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetchWithTimeout(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success || !res.ok) {
    const error = new Error(json.error ?? `Error ${res.status}`) as Error & {
      status?: number;
      code?: string;
      data?: unknown;
      existingSession?: unknown;
    };
    error.status = res.status;
    error.code = json.code;
    error.data = json.data;
    error.existingSession = json.existingSession;
    throw error;
  }

  return json.data as T;
}

/**
 * Genera un ID de idempotencia para prevenir transacciones duplicadas.
 */
export function generateRequestId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Sessions ─────────────────────────────────

export async function getActiveSession(): Promise<ActiveSessionData | null> {
  try {
    const res = await fetchWithTimeout('/api/sessions/active', {
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.status === 404) {
      return null;
    }

    const json: ApiResponse<ActiveSessionData> = await res.json();
    if (!json.success || !res.ok) {
      const error = new Error(json.error ?? `Error ${res.status}`) as Error & { status?: number; code?: string };
      error.status = res.status;
      error.code = json.code;
      throw error;
    }

    return json.data as ActiveSessionData;
  } catch (error) {
    const typed = error as Error & { status?: number; code?: string };
    if (typed.status === 404) return null;
    throw error;
  }
}

export async function getSessionById(
  id: string
): Promise<{ session: WorkSession; transactions: Transaction[]; summary: ActiveSessionData['summary'] }> {
  return apiFetch<{ session: WorkSession; transactions: Transaction[]; summary: ActiveSessionData['summary'] }>(
    `/api/sessions/${id}`
  );
}

export async function createSession(
  payload: CreateSessionPayload
): Promise<WorkSession> {
  return apiFetch<WorkSession>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ ...payload, clientRequestId: generateRequestId() }),
  });
}

export async function closeSession(
  id: string,
  payload: CloseSessionPayload
): Promise<WorkSession> {
  return apiFetch<WorkSession>(`/api/sessions/${id}/close`, {
    method: 'PATCH',
    body: JSON.stringify({ ...payload, clientRequestId: generateRequestId() }),
  });
}

// ─── Transactions ──────────────────────────────

export async function createTransaction(
  payload: CreateTransactionPayload
): Promise<Transaction> {
  return apiFetch<Transaction>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      clientRequestId: payload.clientRequestId ?? generateRequestId(),
    }),
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

export async function getVehicles(includeInactive = false): Promise<Vehicle[]> {
  return apiFetch<Vehicle[]>(`/api/vehicles${includeInactive ? '?includeInactive=true' : ''}`);
}

export async function createVehicle(
  payload: CreateVehiclePayload
): Promise<Vehicle> {
  return apiFetch<Vehicle>('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify({ ...payload, clientRequestId: generateRequestId() }),
  });
}

export async function updateVehicle(
  id: string,
  payload: Partial<CreateVehiclePayload> & { active?: boolean }
): Promise<Vehicle> {
  return apiFetch<Vehicle>(`/api/vehicles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ─── Categories ───────────────────────────────

export async function getCategories(includeInactive = false): Promise<ExpenseCategory[]> {
  return apiFetch<ExpenseCategory[]>(`/api/categories${includeInactive ? '?includeInactive=true' : ''}`);
}

export async function createCategory(
  name: string
): Promise<ExpenseCategory> {
  return apiFetch<ExpenseCategory>('/api/categories', {
    method: 'POST',
    body: JSON.stringify({ name, clientRequestId: generateRequestId() }),
  });
}

export async function updateCategory(
  id: string,
  payload: { name?: string; active?: boolean }
): Promise<ExpenseCategory> {
  return apiFetch<ExpenseCategory>(`/api/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ─── Analytics ────────────────────────────────

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

  const res = await fetchWithTimeout(`/api/sessions?${params}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  if (!json.success || !res.ok) throw new Error(json.error ?? `Error ${res.status}`);
  return { data: json.data as WorkSession[], meta: json.meta };
}
