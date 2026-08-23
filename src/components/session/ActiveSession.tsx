'use client';

import { useState } from 'react';
import type { ActiveSessionData, Transaction, WorkSession } from '@/types';
import { formatCurrency, formatKm, formatTime, formatDateShort } from '@/lib/format';
import Button from '@/components/ui/Button';
import BottomSheet from '@/components/ui/BottomSheet';
import IncomeForm from '@/components/transactions/IncomeForm';
import ExpenseForm from '@/components/transactions/ExpenseForm';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionDetail from '@/components/transactions/TransactionDetail';
import CloseSessionForm from './CloseSessionForm';
import Toast, { ToastType } from '@/components/ui/Toast';

interface ActiveSessionProps {
  data: ActiveSessionData;
  onDataChange: (data: ActiveSessionData) => void;
  onSessionClosed: (session: WorkSession, actualCash: number) => void;
}

type Sheet = 'income' | 'expense' | 'close' | 'detail' | null;
interface ToastState { message: string; type: ToastType; }

export default function ActiveSession({ data, onDataChange, onSessionClosed }: ActiveSessionProps) {
  const { session, transactions, summary } = data;
  const [activeSheet, setActiveSheet] = useState<Sheet>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const vehicleName =
    typeof session.vehicleId === 'object' && session.vehicleId !== null
      ? (session.vehicleId as { name?: string }).name ?? ''
      : '';

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type });
  }

  function closeAllSheets() {
    setActiveSheet(null);
    setSelectedTx(null);
  }

  function handleTransactionSaved(tx: Transaction) {
    const next = [tx, ...transactions];
    onDataChange(recalculate(data, next));
    closeAllSheets();
    showToast(tx.type === 'income' ? 'Ingreso registrado' : 'Gasto registrado',
      tx.type === 'income' ? 'success' : 'info');
  }

  function handleTransactionUpdated(updated: Transaction) {
    const next = transactions.map((t) => (t._id === updated._id ? updated : t));
    onDataChange(recalculate(data, next));
    closeAllSheets();
    showToast('Movimiento actualizado');
  }

  function handleTransactionDeleted(id: string) {
    const next = transactions.filter((t) => t._id !== id);
    onDataChange(recalculate(data, next));
    closeAllSheets();
    showToast('Movimiento eliminado', 'info');
  }

  const netColor =
    summary.netResult > 0
      ? 'var(--color-income)'
      : summary.netResult < 0
      ? 'var(--color-expense)'
      : 'var(--color-text-primary)';

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-background)' }}>

      {/* ── HEADER ── */}
      <header
        className="sticky top-0 z-20 px-4"
        style={{
          background: 'var(--color-background)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between py-3">
          <div className="flex flex-col gap-0.5">
            <span className="badge-active">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse-soft"
                style={{ background: 'var(--color-income)' }}
                aria-hidden="true"
              />
              Jornada activa
            </span>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Inicio: {formatTime(session.startTime)}
            </p>
          </div>
          <div className="text-right">
            {vehicleName && (
              <p className="text-xs font-medium" style={{ color: 'var(--color-info)' }}>
                <CarIcon /> {vehicleName}
              </p>
            )}
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {formatDateShort(session.date)}
            </p>
          </div>
        </div>
      </header>

      {/* ── CUERPO ── */}
      <main className="flex-1 overflow-y-auto">
        {/* pb suficiente para: botón cerrar (~68px) + BottomNav (~64px) + safe-area + margen */}
        <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5" style={{ paddingBottom: 'calc(9rem + env(safe-area-inset-bottom))' }}>

          {/* ── 1. CAJA ESPERADA — elemento principal ── */}
          <section
            className="rounded-3xl px-6 pt-7 pb-6 text-center"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
            }}
            aria-label="Caja esperada"
          >
            <p className="section-label mb-2">Caja esperada</p>
            <p
              className="money-xl tabular"
              style={{ color: 'var(--color-text-primary)' }}
              aria-label={`Caja esperada: ${formatCurrency(summary.expectedCash)}`}
            >
              {formatCurrency(summary.expectedCash)}
            </p>
            <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
              Caja inicial: {formatCurrency(session.initialCash)}
            </p>

            {/* Transferencias bajo la caja */}
            {summary.transferIncome - summary.transferExpense !== 0 && (
              <div
                className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-2xl mx-auto"
                style={{
                  background: 'var(--color-transfer-soft)',
                  border: '1px solid var(--color-transfer-border)',
                  width: 'fit-content',
                }}
              >
                <TransferIcon color="var(--color-transfer)" size={14} />
                <span className="text-xs font-semibold" style={{ color: 'var(--color-transfer)' }}>
                  {formatCurrency(summary.transferIncome - summary.transferExpense)} en transferencias
                </span>
              </div>
            )}
          </section>

          {/* ── 2. BOTONES PRINCIPALES ── */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveSheet('income')}
              className="flex flex-col items-center justify-center gap-2 rounded-3xl py-5 px-4 transition-all"
              style={{
                background: 'var(--color-income-soft)',
                border: '1px solid var(--color-income-border)',
                minHeight: '80px',
                transitionDuration: 'var(--motion-fast)',
              }}
              aria-label="Registrar ingreso"
            >
              <ArrowUpIcon color="var(--color-income)" />
              <span className="text-base font-bold" style={{ color: 'var(--color-income)' }}>
                + Ingreso
              </span>
            </button>

            <button
              onClick={() => setActiveSheet('expense')}
              className="flex flex-col items-center justify-center gap-2 rounded-3xl py-5 px-4 transition-all"
              style={{
                background: 'var(--color-expense-soft)',
                border: '1px solid var(--color-expense-border)',
                minHeight: '80px',
                transitionDuration: 'var(--motion-fast)',
              }}
              aria-label="Registrar gasto"
            >
              <ArrowDownIcon color="var(--color-expense)" />
              <span className="text-base font-bold" style={{ color: 'var(--color-expense)' }}>
                − Gasto
              </span>
            </button>
          </div>

          {/* ── 3. RESUMEN FINANCIERO ── */}
          <section
            className="rounded-3xl overflow-hidden"
            style={{ border: '1px solid var(--color-border-subtle)' }}
            aria-label="Resumen financiero"
          >
            <div
              className="px-5 py-3"
              style={{
                background: 'var(--color-surface-elevated)',
                borderBottom: '1px solid var(--color-border-subtle)',
              }}
            >
              <span className="section-label">Resumen</span>
            </div>

            <div style={{ background: 'var(--color-surface)' }}>
              {/* Ingresos */}
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--color-income-soft)' }}
                    aria-hidden="true"
                  >
                    <ArrowUpIcon color="var(--color-income)" size={14} />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Ingresos
                  </span>
                </div>
                <span className="money-md" style={{ color: 'var(--color-income)' }}>
                  +{formatCurrency(summary.totalIncome)}
                </span>
              </div>

              {/* Gastos */}
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--color-expense-soft)' }}
                    aria-hidden="true"
                  >
                    <ArrowDownIcon color="var(--color-expense)" size={14} />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Gastos
                  </span>
                </div>
                <span className="money-md" style={{ color: 'var(--color-expense)' }}>
                  −{formatCurrency(summary.totalExpense)}
                </span>
              </div>

              {/* Resultado */}
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Resultado
                </span>
                <span
                  className="money-md"
                  style={{ color: netColor }}
                >
                  {summary.netResult >= 0 ? '+' : '−'}{formatCurrency(Math.abs(summary.netResult))}
                </span>
              </div>
            </div>
          </section>

          {/* ── 4. EFECTIVO / TRANSFERENCIAS ── */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-3xl px-4 py-4"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-subtle)',
              }}
              aria-label="Efectivo en caja"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <CashIcon color="var(--color-text-muted)" size={13} />
                <span className="section-label">Efectivo</span>
              </div>
              <p
                className="text-xl font-bold tabular"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {formatCurrency(summary.cashIncome - summary.cashExpense)}
              </p>
            </div>

            <div
              className="rounded-3xl px-4 py-4"
              style={{
                background: 'var(--color-transfer-softer)',
                border: '1px solid var(--color-transfer-border)',
              }}
              aria-label="Transferencias"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <TransferIcon color="var(--color-transfer)" size={13} />
                <span className="section-label" style={{ color: 'var(--color-transfer)' }}>
                  Transfer.
                </span>
              </div>
              <p
                className="text-xl font-bold tabular"
                style={{ color: 'var(--color-transfer)' }}
              >
                {formatCurrency(summary.transferIncome - summary.transferExpense)}
              </p>
            </div>
          </div>

          {/* ── 5. KM ── */}
          <div
            className="rounded-3xl px-5 py-4 flex items-center gap-3"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
            }}
            aria-label="Kilómetros"
          >
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-info-soft)' }}
              aria-hidden="true"
            >
              <RouteIcon color="var(--color-info)" size={16} />
            </div>
            <div className="flex-1">
              <p className="section-label">KM inicial</p>
              <p className="text-lg font-bold tabular mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                {formatKm(session.initialKm)} km
              </p>
            </div>
            <div className="text-right">
              <p className="section-label">Recorridos</p>
              <p className="text-lg font-bold mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                —
              </p>
            </div>
          </div>

          {/* ── 6. MOVIMIENTOS ── */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="section-label">Movimientos</span>
              {transactions.length > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full tabular"
                  style={{
                    background: 'var(--color-surface-elevated)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {transactions.length}
                </span>
              )}
            </div>
            <TransactionList
              transactions={transactions}
              sessionOpen
              onSelect={(tx) => {
                setSelectedTx(tx);
                setActiveSheet('detail');
              }}
            />
          </section>
        </div>
      </main>

      {/* ── BOTÓN CERRAR — fijo arriba del BottomNav ── */}
      <div
        className="fixed left-0 right-0 z-20 px-4"
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, var(--color-background) 70%, transparent)',
          paddingTop: '1rem',
          paddingBottom: '0.75rem',
        }}
      >
        <div className="max-w-lg mx-auto">
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => setActiveSheet('close')}
          >
            <LockIcon />
            Cerrar jornada
          </Button>
        </div>
      </div>

      {/* ── BOTTOM SHEETS ── */}
      <BottomSheet open={activeSheet === 'income'} onClose={closeAllSheets} title="Nuevo ingreso">
        <IncomeForm sessionId={session._id} onSaved={handleTransactionSaved} onCancel={closeAllSheets} />
      </BottomSheet>

      <BottomSheet open={activeSheet === 'expense'} onClose={closeAllSheets} title="Nuevo gasto">
        <ExpenseForm sessionId={session._id} onSaved={handleTransactionSaved} onCancel={closeAllSheets} />
      </BottomSheet>

      <BottomSheet
        open={activeSheet === 'detail'}
        onClose={closeAllSheets}
        title={selectedTx ? (selectedTx.type === 'income' ? 'Detalle · Ingreso' : 'Detalle · Gasto') : 'Detalle'}
      >
        {selectedTx && (
          <TransactionDetail
            transaction={selectedTx}
            sessionOpen
            onUpdated={handleTransactionUpdated}
            onDeleted={handleTransactionDeleted}
            onClose={closeAllSheets}
          />
        )}
      </BottomSheet>

      <BottomSheet open={activeSheet === 'close'} onClose={closeAllSheets} title="Cerrar jornada">
        <CloseSessionForm
          data={data}
          onClosed={(closed, actualCash) => {
            closeAllSheets();
            onSessionClosed(closed, actualCash);
          }}
          onCancel={closeAllSheets}
        />
      </BottomSheet>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}

/* ── recalculate (local) ── */
function recalculate(data: ActiveSessionData, transactions: Transaction[]): ActiveSessionData {
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const cashIncome = transactions.filter((t) => t.type === 'income' && t.paymentMethod === 'cash').reduce((s, t) => s + t.amount, 0);
  const cashExpense = transactions.filter((t) => t.type === 'expense' && t.paymentMethod === 'cash').reduce((s, t) => s + t.amount, 0);
  const transferIncome = transactions.filter((t) => t.type === 'income' && t.paymentMethod === 'transfer').reduce((s, t) => s + t.amount, 0);
  const transferExpense = transactions.filter((t) => t.type === 'expense' && t.paymentMethod === 'transfer').reduce((s, t) => s + t.amount, 0);
  return {
    ...data,
    transactions,
    summary: {
      totalIncome,
      totalExpense,
      netResult: totalIncome - totalExpense,
      cashIncome,
      cashExpense,
      expectedCash: data.session.initialCash + cashIncome - cashExpense,
      transferIncome,
      transferExpense,
      distance: data.summary.distance,
    },
  };
}

/* ── Icons ── */
function ArrowUpIcon({ color = 'currentColor', size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowDownIcon({ color = 'currentColor', size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M19 12l-7 7-7-7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TransferIcon({ color = 'currentColor', size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 16l-4-4m0 0l4-4m-4 4h18M17 8l4 4m0 0l-4 4m4-4H3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CashIcon({ color = 'currentColor', size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}
function RouteIcon({ color = 'currentColor', size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="19" r="2" stroke={color} strokeWidth="1.8" />
      <circle cx="18" cy="5" r="2" stroke={color} strokeWidth="1.8" />
      <path d="M6 17V9a6 6 0 0 1 12 0v8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function CarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', marginRight: '2px' }} aria-hidden="true">
      <path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17a2 2 0 0 0 4 0M15 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
