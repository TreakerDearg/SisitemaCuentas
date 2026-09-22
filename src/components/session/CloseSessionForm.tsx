'use client';

import { useState, useRef, useEffect } from 'react';
import type { ActiveSessionData, WorkSession } from '@/types';
import { closeSession } from '@/lib/api';
import { clearDraft, getDraft, saveDraft } from '@/lib/offline';
import { formatCurrency, formatKm } from '@/lib/format';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface CloseSessionFormProps {
  data: ActiveSessionData;
  onClosed: (session: WorkSession, actualCash: number) => void;
  onCancel: () => void;
}

type Step = 'form' | 'confirm';

export default function CloseSessionForm({ data, onClosed, onCancel }: CloseSessionFormProps) {
  const { session, summary } = data;

  const [step, setStep] = useState<Step>('form');
  const [finalKm, setFinalKm] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState(session.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ finalKm?: string; actualCash?: string }>({});

  // Prevención de doble cierre en frontend
  const submittingRef = useRef(false);

  useEffect(() => {
    void getDraft<{ finalKm: string; actualCash: string; notes: string }>(`close-session:${session._id}`).then((draft) => {
      if (draft) {
        setFinalKm(draft.finalKm ?? '');
        setActualCash(draft.actualCash ?? '');
        setNotes(draft.notes ?? session.notes ?? '');
      }
    }).catch(() => undefined);
  }, [session._id, session.notes]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void saveDraft(`close-session:${session._id}`, { finalKm, actualCash, notes }).catch(() => undefined);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [finalKm, actualCash, notes, session._id]);

  function validate() {
    const errs: typeof fieldErrors = {};
    const km = parseInt(finalKm);
    if (!finalKm || isNaN(km)) {
      errs.finalKm = 'Ingresá el KM final.';
    } else if (km < session.initialKm) {
      errs.finalKm = `No puede ser menor que el KM inicial (${formatKm(session.initialKm)} km).`;
    }
    const cash = parseFloat(actualCash);
    if (actualCash !== '' && (isNaN(cash) || cash < 0))
      errs.actualCash = 'Ingresá un monto válido.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleClose() {
    if (submittingRef.current) return; // prevención de doble tap en confirmación
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const km = parseInt(finalKm);
      const cash = actualCash !== '' ? parseFloat(actualCash) : summary.expectedCash;
      const closed = await closeSession(session._id, {
        finalKm: km,
        actualCash: cash,
        notes: notes.trim() || undefined,
      });
      await clearDraft(`close-session:${session._id}`);
      onClosed(closed, cash);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar la jornada. Intentá nuevamente.');
      setStep('form');
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const parsedKm = parseInt(finalKm) || 0;
  const distance = parsedKm > session.initialKm ? parsedKm - session.initialKm : 0;
  const parsedCash = actualCash !== '' ? parseFloat(actualCash) : null;
  const cashDiff = parsedCash !== null ? parsedCash - summary.expectedCash : null;

  const diffColor =
    cashDiff === null
      ? 'var(--color-text-muted)'
      : cashDiff === 0
      ? 'var(--color-income)'
      : cashDiff > 0
      ? 'var(--color-income)'
      : 'var(--color-warning)';

  /* ── Confirmación ── */
  if (step === 'confirm') {
    return (
      <div className="flex flex-col gap-5 px-5 py-6 animate-fade-in">
        <div>
          <p className="section-label mb-1">Cierre de jornada</p>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Resumen final
          </h2>
        </div>

        {/* Financiero */}
        <SummaryCard>
          <SummaryHeader label="Financiero" />
          <SummaryRow label="Ingresos" value={`+${formatCurrency(summary.totalIncome)}`} color="var(--color-income)" />
          <SummaryRow label="Gastos" value={`−${formatCurrency(summary.totalExpense)}`} color="var(--color-expense)" />
          <SummaryRow label="Resultado" value={formatCurrency(summary.netResult)} bold />
        </SummaryCard>

        {/* Caja */}
        <SummaryCard>
          <SummaryHeader label="Caja" />
          <SummaryRow label="Esperada" value={formatCurrency(summary.expectedCash)} />
          {parsedCash !== null && (
            <SummaryRow label="Real" value={formatCurrency(parsedCash)} />
          )}
          {cashDiff !== null && (
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{
                background: cashDiff === 0 ? 'var(--color-income-softer)' : 'var(--color-warning-softer)',
                borderTop: '1px solid var(--color-border-subtle)',
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: diffColor, fontSize: '0.9rem' }}>
                  {cashDiff === 0 ? '✓' : '⚠'}
                </span>
                <span className="text-sm font-semibold" style={{ color: diffColor }}>
                  {cashDiff === 0 ? 'Caja coincide' : 'Diferencia de caja'}
                </span>
              </div>
              {cashDiff !== 0 && (
                <span className="text-sm font-bold tabular" style={{ color: diffColor }}>
                  {cashDiff > 0 ? '+' : ''}{formatCurrency(cashDiff)}
                </span>
              )}
            </div>
          )}
        </SummaryCard>

        {/* KM */}
        <SummaryCard>
          <SummaryHeader label="Kilómetros" />
          <SummaryRow label="KM inicial" value={`${formatKm(session.initialKm)} km`} />
          <SummaryRow label="KM final" value={`${formatKm(parsedKm)} km`} />
          <SummaryRow label="Recorridos" value={`${formatKm(distance)} km`} bold last />
        </SummaryCard>

        {error && <ErrorBanner message={error} />}

        <div className="flex flex-col gap-3 pt-1 pb-2">
          <Button variant="primary" size="xl" fullWidth onClick={handleClose} loading={submitting}>
            Confirmar cierre
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
    <div className="flex flex-col gap-5 px-5 py-6">
      <div>
        <p className="section-label mb-1">Cierre de jornada</p>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          ¿Cómo terminás?
        </h2>
      </div>

      {/* KM final */}
      <Input
        id="finalKm"
        label="KM final"
        type="number"
        inputMode="numeric"
        min={session.initialKm}
        placeholder={String(session.initialKm + 1)}
        value={finalKm}
        onChange={(e) => {
          setFinalKm(e.target.value);
          setFieldErrors((p) => ({ ...p, finalKm: '' }));
        }}
        suffix="km"
        hint={`KM inicial: ${formatKm(session.initialKm)} km`}
        error={fieldErrors.finalKm}
      />

      {/* Efectivo real */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="actualCash" className="section-label">Efectivo real en caja</label>
        <div
          className="flex items-center rounded-2xl px-4 gap-2"
          style={{
            background: 'var(--color-surface)',
            border: fieldErrors.actualCash
              ? '1px solid var(--color-expense)'
              : '1px solid var(--color-border)',
            minHeight: '64px',
          }}
        >
          <span className="text-2xl font-light" style={{ color: 'var(--color-text-muted)' }}>$</span>
          <input
            id="actualCash"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder={String(Math.round(summary.expectedCash))}
            value={actualCash}
            onChange={(e) => {
              setActualCash(e.target.value);
              setFieldErrors((p) => ({ ...p, actualCash: '' }));
            }}
            className="flex-1 bg-transparent text-3xl font-bold outline-none tabular"
            style={{ color: 'var(--color-text-primary)' }}
            aria-label="Efectivo real en caja"
          />
        </div>

        {/* Preview diferencia en tiempo real */}
        {cashDiff !== null && (
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-2xl"
            style={{
              background: cashDiff === 0 ? 'var(--color-income-softer)' : 'var(--color-warning-softer)',
              border: `1px solid ${cashDiff === 0 ? 'var(--color-income-border)' : 'var(--color-warning-border)'}`,
            }}
          >
            <span className="text-xs font-medium" style={{ color: diffColor }}>
              {cashDiff === 0 ? '✓ La caja coincide' : '⚠ Diferencia de caja'}
            </span>
            {cashDiff !== 0 && (
              <span className="text-xs font-bold tabular" style={{ color: diffColor }}>
                {cashDiff > 0 ? '+' : ''}{formatCurrency(cashDiff)}
              </span>
            )}
          </div>
        )}
        {!cashDiff && (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Esperado: {formatCurrency(summary.expectedCash)}
          </p>
        )}
        {fieldErrors.actualCash && (
          <p className="text-xs" style={{ color: 'var(--color-expense)' }} role="alert">
            {fieldErrors.actualCash}
          </p>
        )}
      </div>

      {/* Nota */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="close-notes" className="section-label">
          Nota{' '}
          <span style={{ color: 'var(--color-text-disabled)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            (opcional)
          </span>
        </label>
        <textarea
          id="close-notes"
          rows={2}
          placeholder="Anotá algo sobre la jornada..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-2xl px-4 py-3 text-base resize-none outline-none"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      <div className="flex flex-col gap-3 pt-1 pb-2">
        <Button variant="primary" size="xl" fullWidth onClick={() => { if (validate()) setStep('confirm'); }}>
          Revisar cierre →
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function SummaryCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid var(--color-border-subtle)' }}>
      {children}
    </div>
  );
}

function SummaryHeader({ label }: { label: string }) {
  return (
    <div
      className="px-5 py-2.5"
      style={{
        background: 'var(--color-surface-elevated)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <span className="section-label">{label}</span>
    </div>
  );
}

function SummaryRow({
  label, value, color, bold = false, last = false,
}: {
  label: string; value: string; color?: string; bold?: boolean; last?: boolean;
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
        className={`text-sm tabular ${bold ? 'font-bold' : 'font-semibold'}`}
        style={{ color: color ?? 'var(--color-text-primary)' }}
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
