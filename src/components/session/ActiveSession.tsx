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
import FuelKmModal from '@/components/fuel/FuelKmModal';
import Toast, { ToastType } from '@/components/ui/Toast';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Link from 'next/link';

interface ActiveSessionProps {
  data: ActiveSessionData;
  onDataChange: (data: ActiveSessionData) => void;
  onSessionClosed: (session: WorkSession, actualCash: number) => void;
}

type Sheet = 'income' | 'expense' | 'fuel' | 'close' | 'detail' | null;
interface ToastState { message: string; type: ToastType; }

export default function ActiveSession({ data, onDataChange, onSessionClosed }: ActiveSessionProps) {
  const { session, transactions, summary } = data;
  const [activeSheet, setActiveSheet] = useState<Sheet>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [txFilter, setTxFilter] = useState<'all' | 'fuel'>('all');
  const [toast, setToast] = useState<ToastState | null>(null);

  const vehicleName =
    typeof session.vehicleId === 'object' && session.vehicleId !== null
      ? (session.vehicleId as { name?: string }).name ?? ''
      : '';

  // Odómetro más reciente: última transacción con KM o KM inicial
  const latestKm =
    transactions.find((t) => t.km && t.km > 0)?.km ??
    session.finalKm ??
    session.initialKm;

  const currentDistance = latestKm > session.initialKm ? latestKm - session.initialKm : 0;

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

  function handleFuelSaved(tx: Transaction, newKm: number) {
    const next = [tx, ...transactions];
    const updated = recalculate(data, next);
    updated.session.finalKm = newKm;
    onDataChange(updated);
    closeAllSheets();
    showToast(`Carga registrada · Odómetro: ${formatKm(newKm)} km`, 'success');
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

  // Filtrado de movimientos
  const fuelTransactions = transactions.filter((t) => {
    const catName = t.category?.name ?? '';
    return /combustible|nafta|gnc|gas/i.test(catName) || /combustible/i.test(t.description ?? '');
  });

  const displayedTransactions = txFilter === 'fuel' ? fuelTransactions : transactions;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--color-background)' }}>

      {/* ── HEADER SUPERIOR COMPACTO ── */}
      <header
        className="sticky top-0 z-20 px-4 backdrop-blur-md"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <span className="badge-active">
              <span
                className="w-2 h-2 rounded-full animate-pulse-soft"
                style={{ background: 'var(--color-income)' }}
                aria-hidden="true"
              />
              En jornada
            </span>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              {formatTime(session.startTime)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {vehicleName && (
              <span
                className="text-xs font-bold px-2 py-1 rounded-xl max-w-[90px] truncate"
                style={{
                  background: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                🚗 {vehicleName}
              </span>
            )}

            <button
              type="button"
              onClick={() => setActiveSheet('close')}
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              style={{
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              title="Cerrar jornada"
            >
              <span>🔒</span>
              <span>Cerrar</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── CUERPO PRINCIPAL DEL COCKPIT ── */}
      <main className="max-w-md mx-auto px-4 py-4 flex flex-col gap-4">

        {/* ── 1. COCKPIT UNIFICADO DE CAJA & RESULTADO (Todo visible en 1 vistazo) ── */}
        <section
          className="rounded-3xl p-5 flex flex-col gap-3.5 shadow-md"
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
          }}
          aria-label="Panel de Control de Caja"
        >
          {/* Fila Principal: Efectivo en Mano */}
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">Efectivo en caja</p>
              <p className="text-3xl font-extrabold tabular tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                {formatCurrency(summary.expectedCash)}
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Caja inicial: {formatCurrency(session.initialCash)}
              </p>
            </div>

            {/* Ganancia Neta Destacada */}
            <div className="text-right">
              <p className="section-label">Ganancia neta</p>
              <p className="text-2xl font-extrabold tabular" style={{ color: netColor }}>
                {summary.netResult >= 0 ? '+' : '−'}{formatCurrency(Math.abs(summary.netResult))}
              </p>
              <p className="text-xs font-medium mt-0.5 tabular" style={{ color: 'var(--color-transfer)' }}>
                {formatCurrency(summary.transferIncome - summary.transferExpense)} transf.
              </p>
            </div>
          </div>

          {/* Sub-barra de Resumen Rápido */}
          <div
            className="flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-bold border-t"
            style={{
              background: 'var(--color-surface-elevated)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <span style={{ color: 'var(--color-income)' }}>▲</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>Ingresos:</span>
              <span className="tabular font-extrabold" style={{ color: 'var(--color-income)' }}>
                +{formatCurrency(summary.totalIncome)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span style={{ color: 'var(--color-expense)' }}>▼</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>Gastos:</span>
              <span className="tabular font-extrabold" style={{ color: 'var(--color-expense)' }}>
                −{formatCurrency(summary.totalExpense)}
              </span>
            </div>
          </div>
        </section>

        {/* ── 2. BOTONERA DE ACCIÓN ERGONÓMICA (3 Botones principales) ── */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Ingreso */}
          <button
            type="button"
            onClick={() => setActiveSheet('income')}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3.5 px-2 cursor-pointer active:scale-95 transition-all text-white font-extrabold shadow-sm"
            style={{
              background: 'var(--color-income-solid)',
              boxShadow: 'var(--shadow-income)',
            }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <ArrowUpIcon color="#FFFFFF" size={18} />
            </div>
            <span className="text-sm">+ Ingreso</span>
          </button>

          {/* Gasto */}
          <button
            type="button"
            onClick={() => setActiveSheet('expense')}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3.5 px-2 cursor-pointer active:scale-95 transition-all text-white font-extrabold shadow-sm"
            style={{
              background: 'var(--color-expense-solid)',
              boxShadow: 'var(--shadow-expense)',
            }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <ArrowDownIcon color="#FFFFFF" size={18} />
            </div>
            <span className="text-sm">− Gasto</span>
          </button>

          {/* Cargar Combustible & KM */}
          <button
            type="button"
            onClick={() => setActiveSheet('fuel')}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3.5 px-2 cursor-pointer active:scale-95 transition-all text-white font-extrabold shadow-sm"
            style={{
              background: '#D97706', // Ámbar combustible
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
            }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 text-base">
              ⛽
            </div>
            <span className="text-sm">Cargar KM</span>
          </button>
        </div>

        {/* ── 3. TIRA DE ODÓMETRO & AVANCE DEL TURNO ── */}
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🚗</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Odómetro del vehículo
              </p>
              <p className="text-base font-extrabold tabular" style={{ color: 'var(--color-text-primary)' }}>
                {formatKm(latestKm)} km
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentDistance > 0 ? (
              <span
                className="text-xs font-extrabold px-2.5 py-1 rounded-xl tabular"
                style={{
                  background: 'var(--color-income-soft)',
                  color: 'var(--color-income)',
                }}
              >
                +{formatKm(currentDistance)} km hoy
              </span>
            ) : (
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Inicio: {formatKm(session.initialKm)} km
              </span>
            )}

            <button
              type="button"
              onClick={() => setActiveSheet('fuel')}
              className="text-xs font-bold px-2 py-1 rounded-xl transition-all"
              style={{
                background: 'var(--color-surface-elevated)',
                color: 'var(--color-accent)',
                border: '1px solid var(--color-border)',
              }}
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* ── 4. MOVIMIENTOS Y CARGAS DE LA JORNADA ── */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTxFilter('all')}
                className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                style={{
                  background: txFilter === 'all' ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: txFilter === 'all' ? '#FFFFFF' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                Todos ({transactions.length})
              </button>

              <button
                type="button"
                onClick={() => setTxFilter('fuel')}
                className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                style={{
                  background: txFilter === 'fuel' ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: txFilter === 'fuel' ? '#FFFFFF' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span>⛽ Combustible</span>
                <span>({fuelTransactions.length})</span>
              </button>
            </div>

            <Link
              href="/combustible"
              className="text-xs font-semibold hover:underline"
              style={{ color: 'var(--color-accent)' }}
            >
              Ver rendimiento →
            </Link>
          </div>

          <TransactionList
            transactions={displayedTransactions}
            sessionOpen
            onSelect={(tx) => {
              setSelectedTx(tx);
              setActiveSheet('detail');
            }}
          />
        </section>

        {/* ── 5. CIERRE DE JORNADA AL FINAL NATURAL DEL CONTENIDO ── */}
        <section className="pt-2 pb-6">
          <Button
            variant="outline"
            size="xl"
            fullWidth
            onClick={() => setActiveSheet('close')}
            className="font-bold py-4 text-base shadow-sm"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          >
            🔒 Finalizar jornada de trabajo
          </Button>
          <p className="text-xs text-center mt-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Completá el odómetro final y efectivo real para ver tu balance
          </p>
        </section>

      </main>

      {/* ── BOTTOM SHEETS ── */}
      <BottomSheet open={activeSheet === 'income'} onClose={closeAllSheets} title="Nuevo ingreso">
        <IncomeForm sessionId={session._id} onSaved={handleTransactionSaved} onCancel={closeAllSheets} />
      </BottomSheet>

      <BottomSheet open={activeSheet === 'expense'} onClose={closeAllSheets} title="Nuevo gasto">
        <ExpenseForm sessionId={session._id} onSaved={handleTransactionSaved} onCancel={closeAllSheets} />
      </BottomSheet>

      <BottomSheet open={activeSheet === 'fuel'} onClose={closeAllSheets} title="Cargar combustible & KM">
        <FuelKmModal
          session={session}
          lastKm={latestKm}
          onSaved={handleFuelSaved}
          onCancel={closeAllSheets}
        />
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
