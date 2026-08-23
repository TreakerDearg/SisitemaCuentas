// ──────────────────────────────────────────────
// Tipos compartidos del dominio – Gestor Gastos
// ──────────────────────────────────────────────

export interface Vehicle {
  _id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  _id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  sessionId: string;
  type: 'income' | 'expense';
  amount: number;
  category?: ExpenseCategory | null;
  platform?: 'uber' | 'didi' | 'other' | null;
  paymentMethod: 'cash' | 'transfer' | 'other';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkSession {
  _id: string;
  vehicleId: Vehicle;
  date: string;
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed';
  initialCash: number;
  initialKm: number;
  finalKm?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionSummary {
  totalIncome: number;
  totalExpense: number;
  netResult: number;
  cashIncome: number;
  cashExpense: number;
  expectedCash: number;
  transferIncome: number;
  transferExpense: number;
  distance: number;
}

export interface ActiveSessionData {
  session: WorkSession;
  transactions: Transaction[];
  summary: SessionSummary;
}

// ─── Payloads de API ───────────────────────────

export interface CreateSessionPayload {
  vehicleId: string;
  date: string;
  startTime: string;
  initialCash: number;
  initialKm: number;
  notes?: string;
}

export interface CloseSessionPayload {
  finalKm: number;
  actualCash?: number;
  notes?: string;
}

export interface CreateTransactionPayload {
  sessionId: string;
  type: 'income' | 'expense';
  amount: number;
  paymentMethod: 'cash' | 'transfer' | 'other';
  platform?: 'uber' | 'didi' | 'other';
  category?: string;
  description?: string;
  /** Clave de idempotencia generada por el cliente */
  clientRequestId?: string;
}

export interface UpdateTransactionPayload {
  amount?: number;
  paymentMethod?: 'cash' | 'transfer' | 'other';
  platform?: 'uber' | 'didi' | 'other';
  category?: string;
  description?: string;
}

export interface CreateVehiclePayload {
  name: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
}

// ──────────────────────────────────────────────
// Tipos de Analytics — Fase 4
// ──────────────────────────────────────────────

export type PeriodPreset = 'today' | 'week' | 'month' | 'prev-month' | 'custom';

export interface PeriodFilter {
  preset: PeriodPreset;
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  vehicleId?: string;
}

export interface AnalyticsSummary {
  sessions: number;
  income: number;
  expense: number;
  net: number;
  distance: number;
  hours: number;
  incomePerHour: number | null;
  netPerHour: number | null;
  incomePerKm: number | null;
  netPerKm: number | null;
  averageIncome: number | null;
  averageExpense: number | null;
  averageNet: number | null;
}

export interface PlatformItem {
  platform: string;
  label: string;
  total: number;
  percentage: number;
}

export interface PlatformBreakdown {
  platforms: PlatformItem[];
  grandTotal: number;
}

export interface PaymentMethodItem {
  method: string;
  label: string;
  incomeTotal: number;
  expenseTotal: number;
  incomePercentage: number;
}

export interface PaymentMethodBreakdown {
  methods: PaymentMethodItem[];
  incomeGrandTotal: number;
  expenseGrandTotal: number;
}

export interface ExpenseCategoryItem {
  id: string;
  name: string;
  total: number;
  percentage: number;
}

export interface ExpenseBreakdown {
  categories: ExpenseCategoryItem[];
  total: number;
  topCategory: ExpenseCategoryItem | null;
}

export interface TrendPoint {
  sessionId: string;
  date: string;
  income: number;
  expense: number;
  net: number;
  distance: number;
}

export interface TrendData {
  points: TrendPoint[];
  previousPeriodNet: number | null;
}

export interface SessionListMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
