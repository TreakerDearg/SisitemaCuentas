'use client';

import { useState, useEffect, useRef } from 'react';
import type { ExpenseCategory, Transaction } from '@/types';
import { createTransaction, getCategories, createCategory, generateRequestId } from '@/lib/api';
import { clearDraft, getDraft, saveDraft } from '@/lib/offline';
import { useLastChoice } from '@/hooks/useLastChoice';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Input from '@/components/ui/Input';

const METHOD_OPTIONS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transfer.' },
  { value: 'other', label: 'Otro' },
];

interface ExpenseFormProps {
  sessionId: string;
  onSaved: (transaction: Transaction) => void;
  onCancel: () => void;
}

export default function ExpenseForm({ sessionId, onSaved, onCancel }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useLastChoice('expense_category', '');
  const [paymentMethod, setPaymentMethod] = useLastChoice('expense_method', 'cash');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; category?: string; general?: string }>({});

  const submittingRef = useRef(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);
  const [newCatError, setNewCatError] = useState('');

  useEffect(() => {
    void getDraft<{ amount: string; categoryId: string; description: string }>(`expense:${sessionId}`).then((draft) => {
      if (draft) {
        setAmount(draft.amount ?? '');
        setCategoryId(draft.categoryId ?? '');
        setDescription(draft.description ?? '');
      }
    }).catch(() => undefined);
  }, [sessionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void saveDraft(`expense:${sessionId}`, { amount, categoryId, description }).catch(() => undefined);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [amount, categoryId, description, sessionId]);

  useEffect(() => {
    getCategories()
      .then((cats) => {
        setCategories(cats);
        // Si la última categoría guardada ya no existe, limpiarla
      })
      .finally(() => setLoadingCats(false));
  }, []);

  useEffect(() => {
    if (categories.length > 0 && categoryId && !categories.some((category) => category._id === categoryId)) {
      setCategoryId('');
    }
  }, [categories, categoryId, setCategoryId]);

  // Foco automático en monto
  useEffect(() => {
    const t = setTimeout(() => amountRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  function validate(): boolean {
    const errs: typeof errors = {};
    const val = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(val) || val <= 0) {
      errs.amount = 'Ingresá un monto mayor a 0.';
    }
    if (!categoryId) {
      errs.category = 'Seleccioná una categoría.';
    }
    setErrors(errs);
    if (errs.amount) amountRef.current?.focus();
    return Object.keys(errs).length === 0;
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) { setNewCatError('Ingresá un nombre.'); return; }
    setCreatingCat(true);
    setNewCatError('');
    try {
      const cat = await createCategory(newCatName.trim());
      setCategories((p) => [...p, cat]);
      setCategoryId(cat._id);
      setNewCatName('');
      setShowNewCat(false);
    } catch (e) {
      setNewCatError(e instanceof Error ? e.message : 'No se pudo crear la categoría.');
    } finally {
      setCreatingCat(false);
    }
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
        type: 'expense',
        amount: parseFloat(amount.replace(',', '.')),
        category: categoryId,
        paymentMethod: paymentMethod as 'cash' | 'transfer' | 'other',
        description: description.trim() || undefined,
        clientRequestId,
      });
      await clearDraft(`expense:${sessionId}`);
      onSaved(tx);
    } catch (e) {
      setErrors({
        general: e instanceof Error ? e.message : 'No se pudo guardar el gasto. Intentá nuevamente.',
      });
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-5">

      {/* ── Monto ── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="expense-amount" className="section-label">¿Cuánto gastaste?</label>
        <div
          className="flex items-center rounded-2xl px-4 gap-2"
          style={{
            background: 'var(--color-expense-softer)',
            border: errors.amount
              ? '2px solid var(--color-expense)'
              : '1px solid var(--color-expense-border)',
            minHeight: '80px',
          }}
        >
          <span className="text-3xl font-light select-none" style={{ color: 'var(--color-expense)' }}>
            $
          </span>
          <input
            ref={amountRef}
            id="expense-amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="any"
            placeholder="0"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: '' })); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            className="flex-1 bg-transparent text-5xl font-bold outline-none tabular"
            style={{ color: 'var(--color-expense)' }}
            aria-label="Monto del gasto"
            aria-invalid={!!errors.amount}
            disabled={submitting}
          />
        </div>
        {errors.amount && (
          <p className="text-xs" style={{ color: 'var(--color-expense)' }} role="alert">
            {errors.amount}
          </p>
        )}
      </div>

      {/* ── Categoría ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="section-label">Categoría</span>
          <button
            type="button"
            onClick={() => { setShowNewCat((s) => !s); setNewCatError(''); }}
            className="text-xs font-medium"
            style={{ color: 'var(--color-accent)' }}
          >
            {showNewCat ? 'Cancelar' : '+ Nueva'}
          </button>
        </div>

        {showNewCat && (
          <div
            className="rounded-2xl p-3 flex gap-2 items-end"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex-1">
              <Input
                placeholder="Nombre de la categoría"
                value={newCatName}
                onChange={(e) => { setNewCatName(e.target.value); setNewCatError(''); }}
                error={newCatError}
                autoFocus
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateCategory}
              loading={creatingCat}
              style={{ height: '52px', marginBottom: newCatError ? '22px' : '0' }}
            >
              Crear
            </Button>
          </div>
        )}

        {loadingCats ? (
          <p className="text-xs py-2" style={{ color: 'var(--color-text-muted)' }}>
            Cargando categorías...
          </p>
        ) : categories.length === 0 && !showNewCat ? (
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              No hay categorías disponibles.
            </p>
            <Button variant="outline" size="sm" onClick={() => setShowNewCat(true)}>
              + Crear categoría
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const selected = cat._id === categoryId;
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => {
                    setCategoryId(cat._id);
                    setErrors((p) => ({ ...p, category: '' }));
                  }}
                  className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all"
                  style={{
                    background: selected ? 'var(--color-expense-soft)' : 'var(--color-surface)',
                    color: selected ? 'var(--color-expense)' : 'var(--color-text-secondary)',
                    border: selected
                      ? '1px solid var(--color-expense-border)'
                      : '1px solid var(--color-border)',
                    minHeight: '44px',
                    transitionDuration: 'var(--motion-fast)',
                  }}
                  aria-pressed={selected}
                  disabled={submitting}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}

        {errors.category && (
          <p className="text-xs" style={{ color: 'var(--color-expense)' }} role="alert">
            {errors.category}
          </p>
        )}
      </div>

      {/* ── Método de pago ── */}
      <SegmentedControl
        label="Método de pago"
        options={METHOD_OPTIONS}
        value={paymentMethod}
        onChange={setPaymentMethod}
        accent={paymentMethod === 'transfer' ? 'transfer' : 'expense'}
      />

      {/* ── Descripción ── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="expense-desc" className="section-label">
          Nota{' '}
          <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            (opcional)
          </span>
        </label>
        <input
          id="expense-desc"
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
          variant="expense"
          size="xl"
          fullWidth
          onClick={handleSave}
          loading={submitting}
          disabled={submitting}
        >
          {submitting ? 'Registrando...' : '− Guardar gasto'}
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
