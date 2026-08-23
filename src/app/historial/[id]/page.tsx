'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { WorkSession, Transaction, SessionSummary } from '@/types';
import { getSessionById } from '@/lib/api';
import {
  formatCurrency,
  formatKm,
  formatDate,
  formatTime,
} from '@/lib/format';
import TransactionList from '@/components/transactions/TransactionList';

interface SessionDetail {
  session: WorkSession;
  transactions: Transaction[];
  summary: SessionSummary;
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getSessionById(id)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar la jornada.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingPage />;
  if (error || !detail) return <ErrorPage message={error} onBack={() => router.back()} />;

  const { session, transactions, summary } = detail;

  const netColor =
    summary.netResult > 0
      ? 'var(--color-income)'
      : summary.netResult < 0
      ? 'var(--color-expense)'
      : 'var(--color-text-primary)';

  const cashDiffColor =
    session.finalKm === undefined
      ? 'var(--color-text-muted)'
      : 'var(--color-text-primary)';

  const vehicleName =
    typeof session.vehicleId === 'object' && session.vehicleId !== null
      ? (session.vehicleId as { name?: string; brand?: string; model?: string })
      : null;

  // Duration
  let duration = '';
  if (session.startTime && session.endTime) {
    const diffMs =
      new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
    const h = Math.floor(diffMs / 3_600_000);
    const m = Math.round((diffMs % 3_600_000) / 60_000);
    duration = h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5">

        {/* ── Back + header ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-2xl shrink-0"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            aria-label="Volver"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }} />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {formatDate(session.date)}
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Jornada cerrada
            </p>
          </div>
        </div>

        {/* ── Resultado hero ── */}
        <div
          className="rounded-3xl px-6 py-6 text-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)' }}
        >
          <p className="section-label mb-2">Resultado</p>
          <p className="money-xl tabular" style={{ color: netColor }}>
            {summary.netResult >= 0 ? '+' : '−'}{formatCurrency(Math.abs(summary.netResult))}
          </p>
        </div>

        {/* ── Datos de jornada ── */}
        <DetailSection label="Jornada">
          <DetailRow label="Inicio" value={formatTime(session.startTime)} />
          {session.endTime && (
            <DetailRow label="Cierre" value={formatTime(session.endTime)} />
          )}
          {duration && <DetailRow label="Duración" value={duration} />}
          {vehicleName && (
            <DetailRow
              label="Vehículo"
              value={
                vehicleName.name ??
                `${vehicleName.brand ?? ''} ${vehicleName.model ?? ''}`.trim()
              }
              last
            />
          )}
        </DetailSection>

        {/* ── KM ── */}
        <DetailSection label="Kilómetros">
          <DetailRow label="KM inicial" value={`${formatKm(session.initialKm)} km`} />
          {session.finalKm !== undefined && (
            <DetailRow label="KM final" value={`${formatKm(session.finalKm)} km`} />
          )}
          <DetailRow
            label="Recorridos"
            value={
              summary.distance > 0
                ? `${formatKm(summary.distance)} km`
                : '—'
            }
            color="var(--color-info)"
            bold
            last
          />
        </DetailSection>

        {/* ── Finanzas ── */}
        <DetailSection label="Finanzas">
          <DetailRow label="Caja inicial" value={formatCurrency(session.initialCash)} />
          <DetailRow
            label="Ingresos"
            value={`+${formatCurrency(summary.totalIncome)}`}
            color="var(--color-income)"
          />
          <DetailRow
            label="Gastos"
            value={`−${formatCurrency(summary.totalExpense)}`}
            color="var(--color-expense)"
          />
          <DetailRow
            label="Resultado"
            value={`${summary.netResult >= 0 ? '+' : '−'}${formatCurrency(Math.abs(summary.netResult))}`}
            color={netColor}
            bold
          />
        </DetailSection>

        {/* ── Desglose por método ── */}
        <DetailSection label="Desglose">
          <DetailRow label="Efectivo" value={formatCurrency(summary.cashIncome - summary.cashExpense)} />
          <DetailRow
            label="Transferencias"
            value={formatCurrency(summary.transferIncome - summary.transferExpense)}
            color="var(--color-transfer)"
            last
          />
        </DetailSection>

        {/* ── Caja ── */}
        <DetailSection label="Caja">
          <DetailRow label="Esperada" value={formatCurrency(summary.expectedCash)} last />
        </DetailSection>

        {/* ── Movimientos ── */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="section-label">Movimientos</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)' }}
            >
              {transactions.length}
            </span>
          </div>
          <TransactionList
            transactions={transactions}
            sessionOpen={false}
          />
        </section>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl overflow-hidden" style={{ border: '1px solid var(--color-border-subtle)' }}>
      <div
        className="px-5 py-2.5"
        style={{
          background: 'var(--color-surface-elevated)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <span className="section-label">{label}</span>
      </div>
      <div style={{ background: 'var(--color-surface)' }}>{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  color,
  bold = false,
  last = false,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3.5"
      style={{ borderBottom: last ? 'none' : '1px solid var(--color-border-subtle)' }}
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

function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-label="Cargando">
          <circle cx="12" cy="12" r="10" stroke="var(--color-border)" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Cargando jornada...</p>
      </div>
    </div>
  );
}

function ErrorPage({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: 'var(--color-background)' }}>
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm" style={{ color: 'var(--color-expense)' }}>
          {message || 'No se pudo cargar la jornada.'}
        </p>
        <button
          onClick={onBack}
          className="text-sm font-semibold"
          style={{ color: 'var(--color-accent)' }}
        >
          Volver
        </button>
      </div>
    </div>
  );
}
