'use client';

import { useState } from 'react';
import type { Transaction } from '@/types';
import { deleteTransaction, updateTransaction } from '@/lib/api';
import { formatCurrency, formatTime, platformLabel, paymentLabel } from '@/lib/format';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SegmentedControl from '@/components/ui/SegmentedControl';

const PLATFORM_OPTIONS = [
  { value: 'uber', label: 'Uber' },
  { value: 'didi', label: 'DiDi' },
  { value: 'other', label: 'Otro' },
];

const METHOD_OPTIONS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transfer.' },
  { value: 'other', label: 'Otro' },
];

interface TransactionDetailProps {
  transaction: Transaction;
  sessionOpen: boolean;
  onUpdated: (transaction: Transaction) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
}

type Mode = 'view' | 'edit';

export default function TransactionDetail({
  transaction,
  sessionOpen,
  onUpdated,
  onDeleted,
  onClose,
}: TransactionDetailProps) {
  const [mode, setMode] = useState<Mode>('view');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [amount, setAmount] = useState(String(transaction.amount));
  const [platform, setPlatform] = useState<string>(transaction.platform ?? 'uber');
  const [paymentMethod, setPaymentMethod] = useState<string>(transaction.paymentMethod);
  const [description, setDescription] = useState(transaction.description ?? '');
  const [amountError, setAmountError] = useState('');

  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'var(--color-income)' : 'var(--color-expense)';
  const amountBg = isIncome ? 'var(--color-income-softer)' : 'var(--color-expense-softer)';
  const amountBorder = isIncome ? 'var(--color-income-border)' : 'var(--color-expense-border)';

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTransaction(transaction._id);
      onDeleted(transaction._id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar. Intentá nuevamente.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleSave() {
    const val = parseFloat(amount);
    if (!amount || isNaN(val) || val <= 0) {
      setAmountError('Ingresá un monto mayor a 0.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await updateTransaction(transaction._id, {
        amount: val,
        paymentMethod: paymentMethod as 'cash' | 'transfer' | 'other',
        platform: isIncome ? (platform as 'uber' | 'didi' | 'other') : undefined,
        description: description.trim() || undefined,
      });
      onUpdated(updated);
      setMode('view');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar. Intentá nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  /* ── Modo vista ── */
  if (mode === 'view') {
    return (
      <div className="flex flex-col gap-5 px-5 py-5">
        {/* Hero monto */}
        <div className="flex flex-col items-center gap-1 py-5">
          <div
            className="w-14 h-14 rounded-3xl flex items-center justify-center mb-2"
            style={{ background: amountBg, border: `1px solid ${amountBorder}` }}
            aria-hidden="true"
          >
            {isIncome ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 19V5M5 12l7-7 7 7" stroke={amountColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M19 12l-7 7-7-7" stroke={amountColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="money-lg tabular" style={{ color: amountColor }}>
            {isIncome ? '+' : '−'}&thinsp;{formatCurrency(transaction.amount)}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {formatTime(transaction.createdAt)}
          </span>
        </div>

        {/* Detalle */}
        <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid var(--color-border-subtle)' }}>
          {isIncome && transaction.platform && (
            <DetailRow label="Plataforma" value={platformLabel(transaction.platform)} />
          )}
          {!isIncome && transaction.category && (
            <DetailRow label="Categoría" value={transaction.category.name} />
          )}
          <DetailRow
            label="Método"
            value={paymentLabel(transaction.paymentMethod)}
            valueColor={transaction.paymentMethod === 'transfer' ? 'var(--color-transfer)' : undefined}
          />
          {transaction.description && (
            <DetailRow label="Descripción" value={transaction.description} last />
          )}
        </div>

        {error && (
          <p
            className="text-sm rounded-2xl px-4 py-3"
            style={{
              color: 'var(--color-expense)',
              background: 'var(--color-expense-soft)',
              border: '1px solid var(--color-expense-border)',
            }}
            role="alert"
          >
            {error}
          </p>
        )}

        {sessionOpen && (
          <div className="flex flex-col gap-3 pt-1 pb-2">
            <Button variant="outline" size="lg" fullWidth onClick={() => setMode('edit')}>
              Editar
            </Button>
            <Button variant="danger" size="md" fullWidth onClick={() => setConfirmDelete(true)}>
              Eliminar
            </Button>
          </div>
        )}

        <ConfirmDialog
          open={confirmDelete}
          title="Eliminar movimiento"
          message="¿Estás seguro que querés eliminar este movimiento? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
          variant="danger"
        />
      </div>
    );
  }

  /* ── Modo edición ── */
  return (
    <div className="flex flex-col gap-5 px-5 py-5">
      {/* Monto */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-amount" className="section-label">Monto</label>
        <div
          className="flex items-center rounded-2xl px-4 gap-2"
          style={{
            background: amountBg,
            border: `1px solid ${amountError ? 'var(--color-expense)' : amountBorder}`,
            minHeight: '80px',
          }}
        >
          <span className="text-3xl font-light" style={{ color: amountColor }}>$</span>
          <input
            id="edit-amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="any"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
            className="flex-1 bg-transparent text-5xl font-bold outline-none tabular"
            style={{ color: amountColor }}
            aria-label="Monto"
            autoFocus
          />
        </div>
        {amountError && (
          <p className="text-xs" style={{ color: 'var(--color-expense)' }} role="alert">
            {amountError}
          </p>
        )}
      </div>

      {isIncome && (
        <SegmentedControl
          label="Plataforma"
          options={PLATFORM_OPTIONS}
          value={platform}
          onChange={setPlatform}
          accent="income"
        />
      )}

      <SegmentedControl
        label="Método de pago"
        options={METHOD_OPTIONS}
        value={paymentMethod}
        onChange={setPaymentMethod}
        accent={paymentMethod === 'transfer' ? 'transfer' : isIncome ? 'income' : 'expense'}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-desc" className="section-label">
          Descripción{' '}
          <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            (opcional)
          </span>
        </label>
        <input
          id="edit-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-2xl px-4 py-3 text-base outline-none"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            minHeight: '52px',
          }}
        />
      </div>

      {error && (
        <p
          className="text-sm rounded-2xl px-4 py-3"
          style={{
            color: 'var(--color-expense)',
            background: 'var(--color-expense-soft)',
            border: '1px solid var(--color-expense-border)',
          }}
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1 pb-2">
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={() => { setMode('view'); setError(''); }}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button variant="primary" size="md" fullWidth onClick={handleSave} loading={saving}>
          Guardar
        </Button>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
  last = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3.5"
      style={{
        background: 'var(--color-surface)',
        borderBottom: last ? 'none' : '1px solid var(--color-border-subtle)',
      }}
    >
      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span
        className="text-sm font-semibold"
        style={{ color: valueColor ?? 'var(--color-text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}
