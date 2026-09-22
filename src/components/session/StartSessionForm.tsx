'use client';

import { useState, useEffect } from 'react';
import type { Vehicle, WorkSession } from '@/types';
import { getVehicles, createSession } from '@/lib/api';
import { clearDraft, getDraft, saveDraft } from '@/lib/offline';
import { todayISO, nowTimeHHMM, formatDate, formatCurrency, formatKm } from '@/lib/format';
import VehicleSelector from '@/components/vehicle/VehicleSelector';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type Step = 'form' | 'confirm';

interface StartSessionFormProps {
  onSessionStarted: (session: WorkSession) => void;
  onActiveSessionFound?: (data: { session: WorkSession; transactions: import('@/types').Transaction[]; summary: import('@/types').SessionSummary }) => void;
}

export default function StartSessionForm({ onSessionStarted, onActiveSessionFound }: StartSessionFormProps) {
  const [step, setStep] = useState<Step>('form');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    vehicleId: '',
    initialCash: '',
    initialKm: '',
    date: todayISO(),
    startTime: nowTimeHHMM(),
    notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  useEffect(() => {
    void getDraft<typeof form>('start-session').then((draft) => {
      if (draft) setForm((current) => ({ ...current, ...draft }));
    }).catch(() => undefined);
    getVehicles()
      .then((vs) => {
        setVehicles(vs);
        if (vs.length === 1) setForm((f) => ({ ...f, vehicleId: vs[0]._id }));
      })
      .finally(() => setLoadingVehicles(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void saveDraft('start-session', form).catch(() => undefined); }, 300);
    return () => window.clearTimeout(timer);
  }, [form]);

  function setField(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof typeof form, string>> = {};
    if (!form.vehicleId) errors.vehicleId = 'Seleccioná un vehículo.';
    const cash = parseFloat(form.initialCash);
    if (form.initialCash === '' || isNaN(cash) || cash < 0)
      errors.initialCash = 'Ingresá un monto válido (puede ser 0).';
    const km = parseInt(form.initialKm);
    if (form.initialKm === '' || isNaN(km) || km < 0)
      errors.initialKm = 'Ingresá un KM inicial válido.';
    if (!form.date) errors.date = 'Ingresá una fecha.';
    if (!form.startTime) errors.startTime = 'Ingresá una hora de inicio.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const startDateTime = new Date(`${form.date}T${form.startTime}:00`);
      const session = await createSession({
        vehicleId: form.vehicleId,
        date: new Date(form.date).toISOString(),
        startTime: startDateTime.toISOString(),
        initialCash: parseFloat(form.initialCash),
        initialKm: parseInt(form.initialKm),
        notes: form.notes.trim() || undefined,
      });
      await clearDraft('start-session');
      onSessionStarted(session);
    } catch (e) {
      const typed = e as Error & { code?: string; activeData?: { session: WorkSession; transactions: import('@/types').Transaction[]; summary: import('@/types').SessionSummary } };
      if (typed.code === 'SESSION_ALREADY_ACTIVE' && typed.activeData && onActiveSessionFound) {
        onActiveSessionFound(typed.activeData);
        return;
      }
      setError(typed.message || 'No se pudo iniciar la jornada. Intentá nuevamente.');
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedVehicle = vehicles.find((v) => v._id === form.vehicleId);

  if (loadingVehicles) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <FormSpinner />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Cargando...</span>
        </div>
      </div>
    );
  }

  /* ── Confirmación ── */
  if (step === 'confirm') {
    return (
      <div className="flex flex-col gap-5 px-5 py-6 animate-fade-in">
        <div>
          <p className="section-label mb-1">Nueva jornada</p>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Revisá los datos
          </h2>
        </div>

        <div
          className="rounded-3xl overflow-hidden"
          style={{ border: '1px solid var(--color-border-subtle)' }}
        >
          <ConfirmRow label="Vehículo" value={selectedVehicle?.name ?? '—'} />
          <ConfirmRow
            label="Caja inicial"
            value={formatCurrency(parseFloat(form.initialCash) || 0)}
            accent
          />
          <ConfirmRow label="KM inicial" value={`${formatKm(parseInt(form.initialKm) || 0)} km`} />
          <ConfirmRow label="Fecha" value={formatDate(form.date)} />
          <ConfirmRow label="Hora de inicio" value={form.startTime} last={!form.notes.trim()} />
          {form.notes.trim() && (
            <ConfirmRow label="Nota" value={form.notes.trim()} last />
          )}
        </div>

        {error && <ErrorBanner message={error} />}

        <div className="flex flex-col gap-3 pt-1 pb-2">
          <Button variant="primary" size="xl" fullWidth onClick={handleSubmit} loading={submitting}>
            Iniciar jornada
          </Button>
          <Button variant="ghost" size="md" fullWidth onClick={() => setStep('form')} disabled={submitting}>
            Volver a editar
          </Button>
        </div>
      </div>
    );
  }

  /* ── Formulario ── */
  return (
    <div className="flex flex-col gap-5 px-5 py-6 animate-fade-in">
      <div>
        <p className="section-label mb-1">Nueva jornada</p>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          ¿Cómo empezás hoy?
        </h2>
      </div>

      <VehicleSelector
        vehicles={vehicles}
        selectedId={form.vehicleId}
        onChange={(id) => setField('vehicleId', id)}
        onVehicleCreated={(v) => setVehicles((prev) => [...prev, v])}
        error={fieldErrors.vehicleId}
      />

      {/* Caja inicial */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="initialCash" className="section-label">Dinero inicial</label>
        <div
          className="flex items-center rounded-2xl px-4 gap-2 transition-colors"
          style={{
            background: 'var(--color-surface)',
            border: fieldErrors.initialCash
              ? '1px solid var(--color-expense)'
              : '1px solid var(--color-border)',
            minHeight: '64px',
          }}
        >
          <span className="text-2xl font-light" style={{ color: 'var(--color-text-muted)' }}>$</span>
          <input
            id="initialCash"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="0"
            value={form.initialCash}
            onChange={(e) => setField('initialCash', e.target.value)}
            className="flex-1 bg-transparent text-3xl font-bold outline-none tabular"
            style={{ color: 'var(--color-text-primary)' }}
            aria-label="Dinero inicial"
          />
        </div>
        {fieldErrors.initialCash && (
          <p className="text-xs" style={{ color: 'var(--color-expense)' }} role="alert">
            {fieldErrors.initialCash}
          </p>
        )}
      </div>

      <Input
        id="initialKm"
        label="KM inicial"
        type="number"
        inputMode="numeric"
        min="0"
        placeholder="125430"
        value={form.initialKm}
        onChange={(e) => setField('initialKm', e.target.value)}
        suffix="km"
        error={fieldErrors.initialKm}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="date"
          label="Fecha"
          type="date"
          value={form.date}
          onChange={(e) => setField('date', e.target.value)}
          error={fieldErrors.date}
        />
        <Input
          id="startTime"
          label="Hora inicio"
          type="time"
          value={form.startTime}
          onChange={(e) => setField('startTime', e.target.value)}
          error={fieldErrors.startTime}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="section-label">
          Nota{' '}
          <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            (opcional)
          </span>
        </label>
        <textarea
          id="notes"
          rows={2}
          placeholder="Anotá algo si querés..."
          value={form.notes}
          onChange={(e) => setField('notes', e.target.value)}
          className="w-full rounded-2xl px-4 py-3 text-base resize-none outline-none"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      <div className="pt-1 pb-2">
        <Button variant="primary" size="xl" fullWidth onClick={() => { if (validate()) setStep('confirm'); }}>
          Revisar →
        </Button>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function ConfirmRow({
  label,
  value,
  accent = false,
  last = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3.5"
      style={{
        background: accent ? 'var(--color-surface-elevated)' : 'var(--color-surface)',
        borderBottom: last ? 'none' : '1px solid var(--color-border-subtle)',
      }}
    >
      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span
        className="text-sm font-semibold tabular"
        style={{ color: accent ? 'var(--color-text-primary)' : 'var(--color-text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p
      className="text-sm rounded-2xl px-4 py-3"
      style={{
        color: 'var(--color-expense)',
        background: 'var(--color-expense-soft)',
        border: '1px solid var(--color-expense-border)',
      }}
      role="alert"
    >
      {message}
    </p>
  );
}

function FormSpinner() {
  return (
    <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="var(--color-border)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
