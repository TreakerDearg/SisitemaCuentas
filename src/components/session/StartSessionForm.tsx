'use client';

import { useState, useEffect, useRef } from 'react';
import type { Vehicle, WorkSession } from '@/types';
import { getVehicles, createSession, createTransaction, getCategories, createCategory, generateRequestId, getActiveSession } from '@/lib/api';
import { clearDraft, getDraft, saveDraft } from '@/lib/offline';
import { todayISO, nowTimeHHMM, parseKm, parseMoney } from '@/lib/format';
import Button from '@/components/ui/Button';

interface StartSessionFormProps {
  onSessionStarted: (session: WorkSession) => void;
  onActiveSessionFound?: (data: { session: WorkSession; transactions: import('@/types').Transaction[]; summary: import('@/types').SessionSummary }) => void;
}

export default function StartSessionForm({ onSessionStarted, onActiveSessionFound }: StartSessionFormProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Campos principales: KM del tablero, Carga de combustible inicial, y Caja para cambio
  const [initialKm, setInitialKm] = useState('');
  const [fuelAmount, setFuelAmount] = useState('');
  const [fuelPaymentMethod, setFuelPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [initialCash, setInitialCash] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [notes, setNotes] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const submittingRef = useRef(false);

  useEffect(() => {
    void getDraft<{
      initialKm?: string;
      fuelAmount?: string;
      fuelPaymentMethod?: 'cash' | 'transfer';
      initialCash?: string;
      selectedVehicleId?: string;
    }>('start-session-v2').then((draft) => {
      if (draft) {
        if (draft.initialKm) setInitialKm(draft.initialKm);
        if (draft.fuelAmount) setFuelAmount(draft.fuelAmount);
        if (draft.fuelPaymentMethod) setFuelPaymentMethod(draft.fuelPaymentMethod);
        if (draft.initialCash) setInitialCash(draft.initialCash);
        if (draft.selectedVehicleId) setSelectedVehicleId(draft.selectedVehicleId);
      }
    }).catch(() => undefined);

    getVehicles()
      .then((vs) => {
        setVehicles(vs);
        if (vs.length > 0) {
          setSelectedVehicleId((prev) => prev || vs[0]._id);
        }
      })
      .finally(() => setLoadingVehicles(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void saveDraft('start-session-v2', {
        initialKm,
        fuelAmount,
        fuelPaymentMethod,
        initialCash,
        selectedVehicleId,
      }).catch(() => undefined);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [initialKm, fuelAmount, fuelPaymentMethod, initialCash, selectedVehicleId]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const km = parseKm(initialKm);
    if (!initialKm || isNaN(km) || km < 0) {
      errs.initialKm = 'Ingresá el kilometraje actual del auto.';
    }

    if (!selectedVehicleId && vehicles.length > 0) {
      errs.vehicle = 'Seleccioná un vehículo.';
    }

    const cash = initialCash === '' ? 0 : parseMoney(initialCash);
    if (isNaN(cash) || cash < 0) {
      errs.initialCash = 'El efectivo debe ser 0 o un monto positivo.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleStart() {
    if (submittingRef.current) return;
    if (!validate()) return;

    submittingRef.current = true;
    setSubmitting(true);
    setError('');

    try {
      const now = new Date();
      // 1. Crear sesión de trabajo
      const session = await createSession({
        vehicleId: selectedVehicleId || vehicles[0]?._id,
        date: todayISO(),
        startTime: now.toISOString(),
        initialCash: initialCash === '' ? 0 : parseMoney(initialCash),
        initialKm: parseKm(initialKm),
        notes: notes.trim() || undefined,
      });

      // 2. Si cargó combustible al inicio, registrar el gasto automáticamente
      const fuelNum = parseMoney(fuelAmount);
      if (fuelNum > 0) {
        try {
          const cats = await getCategories();
          let fuelCategory = cats.find((c) => /combustible|nafta|gnc|gas/i.test(c.name));
          if (!fuelCategory) {
            try {
              fuelCategory = await createCategory('Combustible');
            } catch {
              fuelCategory = cats[0];
            }
          }

          await createTransaction({
            sessionId: session._id,
            type: 'expense',
            amount: fuelNum,
            category: fuelCategory?._id,
            paymentMethod: fuelPaymentMethod,
            description: 'Carga inicial de combustible',
            clientRequestId: generateRequestId(),
          });
        } catch (e) {
          console.warn('[StartSession] No se pudo guardar el combustible inicial de forma automática:', e);
        }
      }

      await clearDraft('start-session-v2');
      await clearDraft('start-session');
      onSessionStarted(session);
    } catch (e) {
      const typed = e as any;
      if (
        typed?.code === 'SESSION_ALREADY_ACTIVE' ||
        typed?.status === 409 ||
        /ya existe una jornada abierta|already active/i.test(typed?.message)
      ) {
        if (typed.activeData && onActiveSessionFound) {
          onActiveSessionFound(typed.activeData);
          return;
        }
        try {
          const active = await getActiveSession();
          if (active && onActiveSessionFound) {
            onActiveSessionFound(active);
            return;
          }
        } catch {
          window.location.reload();
          return;
        }
      }
      setError(typed?.message || 'No se pudo iniciar la jornada. Intentá nuevamente.');
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (loadingVehicles) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>Preparando inicio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-5 animate-fade-in">

      {/* ── Encabezado ágil ── */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          Arrancar jornada
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Anotá el odómetro y la carga en la estación de servicio.
        </p>
      </div>

      {/* ── 1. KM Actual (Obligatorio) ── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="initialKm" className="section-label">
          KM del tablero
        </label>
        <div
          className="flex items-center rounded-2xl px-4 gap-2"
          style={{
            background: 'var(--color-surface)',
            border: fieldErrors.initialKm
              ? '2px solid var(--color-expense)'
              : '1.5px solid var(--color-border)',
            minHeight: '64px',
          }}
        >
          <input
            id="initialKm"
            type="text"
            inputMode="numeric"
            placeholder="Ej: 235000"
            value={initialKm}
            onChange={(e) => {
              setInitialKm(e.target.value);
              setFieldErrors((p) => ({ ...p, initialKm: '' }));
            }}
            className="flex-1 bg-transparent text-2xl font-bold outline-none tabular"
            style={{ color: 'var(--color-text-primary)' }}
            autoFocus
          />
          <span className="text-base font-bold select-none" style={{ color: 'var(--color-text-tertiary)' }}>
            km
          </span>
        </div>
        {fieldErrors.initialKm && (
          <p className="text-xs font-semibold" style={{ color: 'var(--color-expense)' }}>
            {fieldErrors.initialKm}
          </p>
        )}
      </div>

      {/* ── 2. Carga de Combustible Inicial ── */}
      <div
        className="rounded-3xl p-4 flex flex-col gap-3"
        style={{
          background: 'var(--color-surface-elevated)',
          border: '1.5px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">⛽</span>
          <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Carga de combustible
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-auto" style={{ background: 'var(--color-income-soft)', color: 'var(--color-income)' }}>
            Inicio
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <div
            className="flex items-center rounded-2xl px-4 gap-2"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              minHeight: '56px',
            }}
          >
            <span className="text-xl font-bold select-none" style={{ color: 'var(--color-text-muted)' }}>$</span>
            <input
              id="fuelAmount"
              type="number"
              inputMode="decimal"
              placeholder="¿Cuánto cargaste? (0 si no cargaste)"
              value={fuelAmount}
              onChange={(e) => setFuelAmount(e.target.value)}
              className="flex-1 bg-transparent text-xl font-bold outline-none tabular"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>

        {parseFloat(fuelAmount) > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setFuelPaymentMethod('cash')}
              className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              style={{
                background: fuelPaymentMethod === 'cash' ? 'var(--color-surface)' : 'transparent',
                border: fuelPaymentMethod === 'cash' ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                color: fuelPaymentMethod === 'cash' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              }}
            >
              <span>💵 Pagado en Efectivo</span>
            </button>
            <button
              type="button"
              onClick={() => setFuelPaymentMethod('transfer')}
              className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              style={{
                background: fuelPaymentMethod === 'transfer' ? 'var(--color-surface)' : 'transparent',
                border: fuelPaymentMethod === 'transfer' ? '2px solid var(--color-transfer)' : '1px solid var(--color-border)',
                color: fuelPaymentMethod === 'transfer' ? 'var(--color-transfer)' : 'var(--color-text-muted)',
              }}
            >
              <span>📱 Transferencia</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Dinero para cambio (Caja inicial) ── */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="initialCash" className="section-label">
          Efectivo en billetera (para cambio)
        </label>
        <div
          className="flex items-center rounded-2xl px-4 gap-2"
          style={{
            background: 'var(--color-surface)',
            border: fieldErrors.initialCash
              ? '2px solid var(--color-expense)'
              : '1.5px solid var(--color-border)',
            minHeight: '60px',
          }}
        >
          <span className="text-xl font-bold select-none" style={{ color: 'var(--color-cash)' }}>$</span>
          <input
            id="initialCash"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={initialCash}
            onChange={(e) => setInitialCash(e.target.value)}
            className="flex-1 bg-transparent text-xl font-bold outline-none tabular"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>

      {/* ── 4. Selector de Vehículo si hay más de 1 ── */}
      {vehicles.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <span className="section-label">Vehículo</span>
          <div className="flex gap-2 flex-wrap">
            {vehicles.map((v) => (
              <button
                key={v._id}
                type="button"
                onClick={() => setSelectedVehicleId(v._id)}
                className="px-4 py-2 rounded-2xl text-sm font-bold transition-all cursor-pointer"
                style={{
                  background: selectedVehicleId === v._id ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: selectedVehicleId === v._id ? '#fff' : 'var(--color-text-secondary)',
                  border: selectedVehicleId === v._id ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                }}
              >
                🚗 {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p
          className="text-sm font-semibold rounded-2xl px-4 py-3"
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

      {/* ── Botón directo de arranque (Sin pantallas intermedias) ── */}
      <div className="pt-2 pb-2">
        <Button
          variant="primary"
          size="xl"
          fullWidth
          onClick={handleStart}
          loading={submitting}
        >
          Arrancar jornada →
        </Button>
      </div>

    </div>
  );
}
