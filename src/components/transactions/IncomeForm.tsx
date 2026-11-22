'use client';

import { useState, useRef, useEffect } from 'react';
import type { Transaction } from '@/types';
import { createTransaction, generateRequestId } from '@/lib/api';
import { clearDraft, getDraft, saveDraft } from '@/lib/offline';
import { useLastChoice } from '@/hooks/useLastChoice';
import Button from '@/components/ui/Button';

interface IncomeFormProps {
  sessionId: string;
  onSaved: (transaction: Transaction) => void;
  onCancel: () => void;
}

export default function IncomeForm({ sessionId, onSaved, onCancel }: IncomeFormProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useLastChoice('income_method', 'cash');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; general?: string }>({});

  const submittingRef = useRef(false);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getDraft<{ amount: string; description: string }>(`income:${sessionId}`).then((draft) => {
      if (draft) {
        setAmount(draft.amount ?? '');
        setDescription(draft.description ?? '');
      }
    }).catch(() => undefined);
  }, [sessionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void saveDraft(`income:${sessionId}`, { amount, description }).catch(() => undefined);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [amount, description, sessionId]);

  // Foco automático en el monto al abrir
  useEffect(() => {
    const t = setTimeout(() => amountRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  function validate(): boolean {
    const val = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(val) || val <= 0) {
      setErrors({ amount: 'Ingresá un monto mayor a 0.' });
      amountRef.current?.focus();
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (submittingRef.current) return;
    if (!validate()) return;

    submittingRef.current = true;
    setSubmitting(true);
    setErrors({});

    const clientRequestId = generateRequestId();

    try {
      const tx = await createTransaction({
        sessionId,
        type: 'income',
        amount: parseFloat(amount.replace(',', '.')),
        paymentMethod: paymentMethod as 'cash' | 'transfer' | 'other',
        description: description.trim() || undefined,
        clientRequestId,
      });
      await clearDraft(`income:${sessionId}`);
      onSaved(tx);
    } catch (e) {
      setErrors({
        general: e instanceof Error ? e.message : 'No se pudo guardar el ingreso. Intentá nuevamente.',
      });
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function handleAmountKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-5 animate-fade-in">

      {/* ── Monto directo ── */}
      <div className="flex flex-col gap-2">
        <label htmlFor="income-amount" className="section-label">
          ¿Cuánto cobraste?
        </label>
        <div
          className="flex items-center rounded-2xl px-4 gap-2 transition-all"
          style={{
            background: 'var(--color-surface)',
            border: errors.amount
              ? '2px solid var(--color-expense)'
              : '2px solid var(--color-income-border)',
            boxShadow: 'var(--shadow-sm)',
            minHeight: '84px',
          }}
        >
          <span className="text-3xl font-bold select-none" style={{ color: 'var(--color-income)' }}>
            $
          </span>
          <input
            ref={amountRef}
            id="income-amount"
            type="number"
            inputMode="decimal"
            min="1"
            step="any"
            placeholder="0"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors({}); }}
            onKeyDown={handleAmountKeyDown}
            className="flex-1 bg-transparent text-4xl font-extrabold outline-none tabular"
            style={{ color: 'var(--color-text-primary)' }}
            aria-label="Monto del ingreso"
            disabled={submitting}
          />
        </div>
        {errors.amount && (
          <p className="text-sm font-semibold" style={{ color: 'var(--color-expense)' }} role="alert">
            {errors.amount}
          </p>
        )}
      </div>

      {/* ── Forma de pago (Botones grandes táctiles) ── */}
      <div className="flex flex-col gap-2">
        <label className="section-label">¿Cómo te pagaron?</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            className="flex items-center justify-center gap-2 py-4 px-3 rounded-2xl font-bold transition-all cursor-pointer"
            style={{
              background: paymentMethod === 'cash' ? 'var(--color-surface-elevated)' : 'var(--color-surface)',
              border: paymentMethod === 'cash'
                ? '2px solid var(--color-accent)'
                : '1px solid var(--color-border)',
              color: paymentMethod === 'cash' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              boxShadow: paymentMethod === 'cash' ? 'var(--shadow-sm)' : 'none',
              minHeight: '56px',
            }}
          >
            <span className="text-xl">💵</span>
            <span>Efectivo</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('transfer')}
            className="flex items-center justify-center gap-2 py-4 px-3 rounded-2xl font-bold transition-all cursor-pointer"
            style={{
              background: paymentMethod === 'transfer' ? 'var(--color-surface-elevated)' : 'var(--color-surface)',
              border: paymentMethod === 'transfer'
                ? '2px solid var(--color-transfer)'
                : '1px solid var(--color-border)',
              color: paymentMethod === 'transfer' ? 'var(--color-transfer)' : 'var(--color-text-muted)',
              boxShadow: paymentMethod === 'transfer' ? 'var(--shadow-sm)' : 'none',
              minHeight: '56px',
            }}
          >
            <span className="text-xl">📱</span>
            <span>Transferencia</span>
          </button>
        </div>
      </div>

      {/* ── Nota opcional ── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="income-desc" className="section-label">
          Nota corta <span style={{ textTransform: 'none', fontWeight: 'normal', color: 'var(--color-text-tertiary)' }}>(opcional)</span>
        </label>
        <input
          id="income-desc"
          type="text"
          placeholder="Ej: Viaje al centro, propina..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-2xl px-4 py-3 text-base outline-none transition-colors"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            minHeight: '52px',
          }}
          disabled={submitting}
        />
      </div>

      {errors.general && (
        <p
          className="text-sm font-medium rounded-2xl px-4 py-3"
          style={{
            color: 'var(--color-expense)',
            background: 'var(--color-expense-soft)',
            border: '1px solid var(--color-expense-border)',
          }}
          role="alert"
        >
          {errors.general}
        </p>
      )}

      {/* ── Botones ── */}
      <div className="flex flex-col gap-3 pt-2 pb-2">
        <Button
          variant="income-solid"
          size="xl"
          fullWidth
          onClick={handleSave}
          loading={submitting}
          disabled={submitting}
        >
          + Guardar ingreso
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
