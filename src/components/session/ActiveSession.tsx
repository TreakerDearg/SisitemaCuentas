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
import ThemeToggle from '@/components/ui/ThemeToggle';

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

      {/* ── HEADER CON SELECTOR DE TEMA ── */}
      <header
        className="sticky top-0 z-20 px-4"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between py-3">
          <div className="flex flex-col gap-1">
            <span className="badge-active">
              <span
                className="w-2 h-2 rounded-full animate-pulse-soft"
                style={{ background: 'var(--color-income)' }}
                aria-hidden="true"
              />
              Jornada activa
            </span>
            <p className="text-xs font-semibold pl-1" style={{ color: 'var(--color-text-muted)' }}>
              Inicio: {formatTime(session.startTime)} · {formatDateShort(session.date)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSheet('close')}
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              style={{
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
              title="Cerrar jornada"
            >
              <span>🔒</span>
              <span>Cerrar</span>
            </button>
            {vehicleName && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl max-w-[90px] truncate" style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                🚗 {vehicleName}
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── CUERPO PRINCIPAL ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-5 flex flex-col gap-5" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}>

          {/* ── 1. CAJA ESPERADA (Tarjeta Hero de alto contraste) ── */}
          <section
            className="rounded-3xl px-6 pt-6 pb-6 text-center"
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)',
            }}
            aria-label="Caja esperada"
          >
            <p className="section-label mb-1">Caja esperada</p>
            <p
              className="money-xl tabular"
              style={{ color: 'var(--color-text-primary)' }}
              aria-label={`Caja esperada: ${formatCurrency(summary.expectedCash)}`}
            >
              {formatCurrency(summary.expectedCash)}
            </p>
            <p className="text-xs font-semibold mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              Caja inicial en mano: {formatCurrency(session.initialCash)}
            </p>

            {/* Transferencias bajo la caja */}
            {summary.transferIncome - summary.transferExpense !== 0 && (
              <div
                className="mt-3.5 flex items-center justify-center gap-2 px-4 py-2 rounded-2xl mx-auto"
                style={{
                  background: 'var(--color-transfer-soft)',
                  border: '1px solid var(--color-transfer-border)',
                  width: 'fit-content',
                }}
              >
                <TransferIcon color="var(--color-transfer)" size={16} />
                <span className="text-xs font-bold" style={{ color: 'var(--color-transfer)' }}>
                  {formatCurrency(summary.transferIncome - summary.transferExpense)} en transferencias
                </span>
              </div>
            )}
          </section>

          {/* ── 2. BOTONES SÓLIDOS DE ACCIÓN RÁPIDA (Grandes, táctiles) ── */}
          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setActiveSheet('income')}
              className="flex flex-col items-center justify-center gap-2 rounded-3xl py-5 px-4 cursor-pointer active:scale-95 transition-all"
              style={{
                background: 'var(--color-income-solid)',
                color: '#FFFFFF',
                minHeight: '84px',
                boxShadow: 'var(--shadow-income)',
                border: 'none',
              }}
              aria-label="Registrar ingreso"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.22)' }}>
                <ArrowUpIcon color="#FFFFFF" size={22} />
              </div>
              <span className="text-lg font-extrabold tracking-wide">
                + Ingreso
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet('expense')}
              className="flex flex-col items-center justify-center gap-2 rounded-3xl py-5 px-4 cursor-pointer active:scale-95 transition-all"
              style={{
                background: 'var(--color-expense-solid)',
                color: '#FFFFFF',
                minHeight: '84px',
                boxShadow: 'var(--shadow-expense)',
                border: 'none',
              }}
              aria-label="Registrar gasto"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.22)' }}>
                <ArrowDownIcon color="#FFFFFF" size={22} />
              </div>
              <span className="text-lg font-extrabold tracking-wide">
                − Gasto
              </span>
            </button>
          </div>

          {/* ── 3. RESUMEN FINANCIERO ── */}
          <section
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
            }}
            aria-label="Resumen financiero"
          >
            <div
              className="px-5 py-3"
              style={{
                background: 'var(--color-surface-elevated)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span className="section-label">Resumen de la jornada</span>
            </div>

            <div>
              {/* Ingresos */}
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold"
                    style={{ background: 'var(--color-income-soft)', color: 'var(--color-income)' }}
                    aria-hidden="true"
                  >
                    +
                  </div>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>
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
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold"
                    style={{ background: 'var(--color-expense-soft)', color: 'var(--color-expense)' }}
                    aria-hidden="true"
                  >
                    −
                  </div>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                    Gastos
                  </span>
                </div>
                <span className="money-md" style={{ color: 'var(--color-expense)' }}>
                  −{formatCurrency(summary.totalExpense)}
                </span>
              </div>

              {/* Resultado neto */}
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
                  Ganancia neta
                </span>
                <span
                  className="money-md font-extrabold"
                  style={{ color: netColor }}
                >
                  {summary.netResult >= 0 ? '+' : '−'}{formatCurrency(Math.abs(summary.netResult))}
                </span>
              </div>
            </div>
          </section>

          {/* ── 4. EFECTIVO / TRANSFERENCIAS (Desglose nítido) ── */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-3xl p-4 flex flex-col gap-1"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">💵</span>
                <span className="section-label">Efectivo</span>
              </div>
              <p className="text-2xl font-extrabold tabular" style={{ color: 'var(--color-text-primary)' }}>
                {formatCurrency(summary.cashIncome - summary.cashExpense)}
              </p>
            </div>

            <div
              className="rounded-3xl p-4 flex flex-col gap-1"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">📱</span>
                <span className="section-label" style={{ color: 'var(--color-transfer)' }}>
                  Transfer.
                </span>
              </div>
              <p className="text-2xl font-extrabold tabular" style={{ color: 'var(--color-transfer)' }}>
                {formatCurrency(summary.transferIncome - summary.transferExpense)}
              </p>
            </div>
          </div>

          {/* ── 5. ODÓMETRO (KM) ── */}
          <div
            className="rounded-3xl px-5 py-4 flex items-center gap-3"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0"
              style={{ background: 'var(--color-info-soft)', color: 'var(--color-info)' }}
              aria-hidden="true"
            >
              🚗
            </div>
            <div className="flex-1">
              <p className="section-label">KM al iniciar</p>
              <p className="text-xl font-extrabold tabular" style={{ color: 'var(--color-text-primary)' }}>
                {formatKm(session.initialKm)} km
              </p>
            </div>
          </div>

          {/* ── 6. MOVIMIENTOS ── */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="section-label">Movimientos</span>
              {transactions.length > 0 && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-bold tabular"
                  style={{
                    background: 'var(--color-surface-elevated)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
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

          {/* ── CIERRE DE JORNADA AL FINAL DEL CONTENIDO (Sin tapar tarjetas) ── */}
          <section className="pt-2 pb-4">
            <Button
              variant="outline"
              size="xl"
              fullWidth
              onClick={() => setActiveSheet('close')}
              className="font-bold py-4 text-base"
            >
              🔒 Cerrar jornada
            </Button>
            <p className="text-xs text-center mt-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Cerrá la jornada cuando termines tu turno de trabajo
            </p>
          </section>
        </div>
      </main>

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

function ArrowUpIcon({ color = 'currentColor', size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDownIcon({ color = 'currentColor', size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M19 12l-7 7-7-7" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TransferIcon({ color = 'currentColor', size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 16l-4-4m0 0l4-4m-4 4h18M17 8l4 4m0 0l-4 4m4-4H3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
