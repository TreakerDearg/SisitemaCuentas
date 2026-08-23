'use client';

import { useState, useRef, useEffect } from 'react';
import type { Transaction } from '@/types';
import { createTransaction, generateRequestId } from '@/lib/api';
import { useLastChoice } from '@/hooks/useLastChoice';
import Button from '@/components/ui/Button';
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

interface IncomeFormProps {
  sessionId: string;
  onSaved: (transaction: Transaction) => void;
  onCancel: () => void;
}

export default function IncomeForm({ sessionId, onSaved, onCancel }: IncomeFormProps) {
  const [amount, setAmount] = useState('');
  const [platform, setPlatform] = useLastChoice('income_platform', 'uber');
  const [paymentMethod, setPaymentMethod] = useLastChoice('income_method', 'cash');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; general?: string }>({});

  // Prevención de doble envío con ref (más confiable que state solo)
  const submittingRef = useRef(false);
  const amountRef = useRef<HTMLInputElement>(null);

  // Foco automático al abrir
  useEffect(() => {
    const t = setTimeout(() => amountRef.current?.focus(), 100);
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
    if (submittingRef.current) return; // prevención de doble tap
    if (!validate()) return;

    submittingRef.current = true;
    setSubmitting(true);
    setErrors({});

    // Generar clientRequestId para idempotencia
    const clientRequestId = generateRequestId();

    try {
      const tx = await createTransaction({
        sessionId,
        type: 'income',
        amount: parseFloat(amount.replace(',', '.')),
        platform: platform as 'uber' | 'didi' | 'other',
        paymentMethod: paymentMethod as 'cash' | 'transfer' | 'other',
        description: description.trim() || undefined,
        clientRequestId,
      });
      onSaved(tx);
    } catch (e) {
      setErrors({
        general: e instanceof Error ? e.message : 'No se pudo guardar el ingreso. Intentá nuevamente.',
      });
      submittingRef.current = false;
      setSubmitting(false);
    }
    // No resetear submittingRef en éxito — el modal se cierra, el form se desmonta
  }

  // Enter en el campo de monto guarda directamente
  function handleAmountKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-5">

      {/* ── Monto — campo principal, prominente ── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="income-amount" className="section-label">¿Cuánto recibiste?</label>
        <div
          className="flex items-center rounded-2xl px-4 gap-2"
          style={{
            background: 'var(--color-income-softer)',
            border: errors.amount
              ? '1px solid var(--color-expense)'
              : '1px solid var(--color-income-border)',
            minHeight: '80px',
          }}
        >
          <span className="text-3xl font-light select-none" style={{ color: 'var(--color-income)' }}>
            $
          </span>
          <input
            ref={amountRef}
            id="income-amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="any"
            placeholder="0"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors({}); }}
            onKeyDown={handleAmountKeyDown}
            className="flex-1 bg-transparent text-5xl font-bold outline-none tabular"
            style={{ color: 'var(--color-income)' }}
            aria-label="Monto del ingreso"
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? 'income-amount-error' : undefined}
            disabled={submitting}
          />
        </div>
        {errors.amount && (
          <p id="income-amount-error" className="text-xs" style={{ color: 'var(--color-expense)' }} role="alert">
            {errors.amount}
          </p>
        )}
      </div>

      {/* ── Plataforma — con última elección recordada ── */}
      <SegmentedControl
        label="Plataforma"
        options={PLATFORM_OPTIONS}
        value={platform}
        onChange={setPlatform}
        accent="income"
      />

      {/* ── Método de pago ── */}
      <SegmentedControl
        label="Método de pago"
        options={METHOD_OPTIONS}
        value={paymentMethod}
        onChange={setPaymentMethod}
        accent={paymentMethod === 'transfer' ? 'transfer' : 'default'}
      />

      {/* ── Descripción ── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="income-desc" className="section-label">
          Nota{' '}
          <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            (opcional)
          </span>
        </label>
        <input
          id="income-desc"
          type="text"
          inputMode="text"
          placeholder="Anotá algo si querés..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-2xl px-4 py-3 text-base outline-none"
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
          className="text-sm rounded-2xl px-4 py-3"
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

      <div className="flex flex-col gap-3 pt-1 pb-2">
        <Button
          variant="income"
          size="xl"
          fullWidth
          onClick={handleSave}
          loading={submitting}
          disabled={submitting}
        >
          {submitting ? 'Registrando...' : '+ Guardar ingreso'}
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
