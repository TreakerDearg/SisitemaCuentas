'use client';

import { useState, useMemo } from 'react';
import type { WorkSession, Transaction } from '@/types';
import { createTransaction, getCategories, createCategory, generateRequestId } from '@/lib/api';
import { formatCurrency, formatKm, parseKm, parseMoney } from '@/lib/format';
import Button from '@/components/ui/Button';

interface FuelKmModalProps {
  session: WorkSession;
  lastKm: number; // KM del último punto de referencia (inicio o carga anterior)
  onSaved: (tx: Transaction, newKm: number) => void;
  onCancel: () => void;
}

export default function FuelKmModal({ session, lastKm, onSaved, onCancel }: FuelKmModalProps) {
  const [currentKm, setCurrentKm] = useState('');
  const [amount, setAmount] = useState('');
  const [liters, setLiters] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [fuelType, setFuelType] = useState<'nafta' | 'gnc' | 'diesel'>('nafta');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cálculos en tiempo real
  const parsedKm = parseKm(currentKm);
  const parsedAmount = parseMoney(amount);
  const parsedLiters = parseFloat(liters.replace(',', '.'));

  const deltaKm = useMemo(() => {
    if (!isNaN(parsedKm) && parsedKm > lastKm) {
      return parsedKm - lastKm;
    }
    return 0;
  }, [parsedKm, lastKm]);

  const costPerKm = useMemo(() => {
    if (deltaKm > 0 && parsedAmount > 0) {
      return parsedAmount / deltaKm;
    }
    return null;
  }, [deltaKm, parsedAmount]);

  const kmPerLiter = useMemo(() => {
    if (deltaKm > 0 && !isNaN(parsedLiters) && parsedLiters > 0) {
      return deltaKm / parsedLiters;
    }
    return null;
  }, [deltaKm, parsedLiters]);

  async function handleSave() {
    if (isNaN(parsedKm) || parsedKm < lastKm) {
      setError(`El odómetro debe ser igual o mayor que la marca anterior (${formatKm(lastKm)} km).`);
      return;
    }
    if (parsedAmount <= 0) {
      setError('Ingresá el importe cargado.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. Obtener o crear la categoría de Combustible
      const cats = await getCategories();
      let fuelCat = cats.find((c) => /combustible|nafta|gnc|gas/i.test(c.name));
      if (!fuelCat) {
        try {
          fuelCat = await createCategory('Combustible');
        } catch {
          fuelCat = cats[0];
        }
      }

      // 2. Registrar el gasto con los metadatos de km y litros
      const tx = await createTransaction({
        sessionId: session._id,
        type: 'expense',
        amount: parsedAmount,
        category: fuelCat?._id,
        paymentMethod,
        km: parsedKm,
        liters: !isNaN(parsedLiters) && parsedLiters > 0 ? parsedLiters : undefined,
        description: `Carga combustible ${fuelType.toUpperCase()}${!isNaN(parsedLiters) && parsedLiters > 0 ? ` (${parsedLiters}L)` : ''} · Odómetro: ${formatKm(parsedKm)} km`,
        clientRequestId: generateRequestId(),
      });

      onSaved(tx, parsedKm);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar la carga. Intentá nuevamente.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-5 animate-fade-in">
      {/* ── Título y contexto ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">⛽</span>
          <h2 className="text-xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
            Cargar combustible & KM
          </h2>
        </div>
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Actualizá el odómetro para calcular el rendimiento y registrar el gasto.
        </p>
      </div>

      {/* ── 1. Odómetro actual (KM) ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="fuel-km" className="section-label">
            Odómetro actual
          </label>
          <span className="text-xs font-semibold tabular" style={{ color: 'var(--color-text-muted)' }}>
            Anterior: {formatKm(lastKm)} km
          </span>
        </div>
        <div
          className="flex items-center rounded-2xl px-4 gap-2"
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            minHeight: '60px',
          }}
        >
          <input
            id="fuel-km"
            type="text"
            inputMode="numeric"
            placeholder={String(lastKm + 50)}
            value={currentKm}
            onChange={(e) => {
              setCurrentKm(e.target.value);
              setError('');
            }}
            className="flex-1 bg-transparent text-2xl font-bold outline-none tabular"
            style={{ color: 'var(--color-text-primary)' }}
            autoFocus
          />
          <span className="text-base font-bold select-none" style={{ color: 'var(--color-text-tertiary)' }}>
            km
          </span>
        </div>
      </div>

      {/* ── 2. Importe cargado ($) ── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fuel-amount" className="section-label">
          Importe cargado
        </label>
        <div
          className="flex items-center rounded-2xl px-4 gap-2"
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            minHeight: '60px',
          }}
        >
          <span className="text-2xl font-light" style={{ color: 'var(--color-text-muted)' }}>
            $
          </span>
          <input
            id="fuel-amount"
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
            className="flex-1 bg-transparent text-3xl font-extrabold outline-none tabular"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>

      {/* ── 3. Método de pago & Tipo de combustible ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Forma de pago */}
        <div className="flex flex-col gap-1.5">
          <span className="section-label">Pagado con</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className="py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              style={{
                background: paymentMethod === 'cash' ? 'var(--color-income-solid)' : 'var(--color-surface)',
                color: paymentMethod === 'cash' ? '#FFFFFF' : 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              💵 Efec.
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('transfer')}
              className="py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              style={{
                background: paymentMethod === 'transfer' ? 'var(--color-accent)' : 'var(--color-surface)',
                color: paymentMethod === 'transfer' ? '#FFFFFF' : 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              📱 Transf.
            </button>
          </div>
        </div>

        {/* Litros opcionales */}
        <div className="flex flex-col gap-1.5">
          <span className="section-label">Litros cargados <span className="font-normal normal-case">(opc.)</span></span>
          <div
            className="flex items-center rounded-2xl px-3 gap-1"
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              minHeight: '44px',
            }}
          >
            <input
              type="text"
              inputMode="decimal"
              placeholder="Ej: 20"
              value={liters}
              onChange={(e) => setLiters(e.target.value)}
              className="flex-1 bg-transparent text-sm font-bold outline-none tabular text-center"
              style={{ color: 'var(--color-text-primary)' }}
            />
            <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>L</span>
          </div>
        </div>
      </div>

      {/* ── 4. Tarjeta de Rendimiento en Tiempo Real ── */}
      {deltaKm > 0 && (
        <div
          className="rounded-2xl p-4 flex flex-col gap-2.5 animate-fade-in"
          style={{
            background: 'var(--color-surface-elevated)',
            border: '1.5px solid var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
            <span>📊 Rendimiento en este tramo:</span>
            <span className="tabular text-sm font-extrabold" style={{ color: 'var(--color-accent)' }}>
              +{formatKm(deltaKm)} km recorridos
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <div>
              <p className="section-label">Costo por KM</p>
              <p className="text-base font-extrabold tabular" style={{ color: 'var(--color-text-primary)' }}>
                {costPerKm !== null ? `$${costPerKm.toFixed(1)}/km` : '—'}
              </p>
            </div>
            <div>
              <p className="section-label">Rendimiento</p>
              <p className="text-base font-extrabold tabular" style={{ color: 'var(--color-income)' }}>
                {kmPerLiter !== null ? `${kmPerLiter.toFixed(1)} km/L` : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p
          className="text-xs rounded-xl p-3 font-semibold"
          style={{
            background: 'var(--color-expense-soft)',
            color: 'var(--color-expense)',
            border: '1px solid var(--color-expense-border)',
          }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* ── Botones de acción ── */}
      <div className="flex flex-col gap-2.5 pt-1">
        <Button
          variant="primary"
          size="xl"
          fullWidth
          loading={submitting}
          onClick={handleSave}
          className="text-base font-bold shadow-md"
        >
          Guardar carga y actualizar KM →
        </Button>
        <Button
          variant="ghost"
          size="md"
          fullWidth
          disabled={submitting}
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
