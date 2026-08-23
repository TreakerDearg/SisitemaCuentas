'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WorkSession, PeriodPreset, AnalyticsSummary } from '@/types';
import { getSessionsHistory, getAnalyticsSummary } from '@/lib/api';
import { getPeriodRange, formatCurrency, formatKm, formatHours } from '@/lib/format';
import PeriodSelector from '@/components/history/PeriodSelector';
import SessionHistoryItem from '@/components/history/SessionHistoryItem';

interface SessionWithNet {
  session: WorkSession;
  net: number;
  distance: number;
}

export default function HistorialPage() {
  const initialRange = getPeriodRange('month');

  const [preset, setPreset] = useState<PeriodPreset>('month');
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);

  const [sessions, setSessions] = useState<SessionWithNet[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (f: string, t: string) => {
    setLoading(true);
    setError('');
    try {
      const [histResult, sumResult] = await Promise.all([
        getSessionsHistory({ from: f, to: t, status: 'closed', limit: 100 }),
        getAnalyticsSummary({ from: f, to: t }),
      ]);

      // For each session compute net from the summary endpoint data
      // We get net per-session from the trends endpoint would be ideal, but
      // for simplicity we'll compute it inline from transaction totals embedded later.
      // For now derive from overall — the per-session detail page will be authoritative.
      const mapped: SessionWithNet[] = histResult.data.map((s) => {
        const dist =
          s.finalKm && s.finalKm > s.initialKm ? s.finalKm - s.initialKm : 0;
        return { session: s, net: 0, distance: dist };
      });

      // Fetch trends for per-session net values
      const trendsRes = await fetch(
        `/api/analytics/trends?from=${f}&to=${t}`
      );
      const trendsJson = await trendsRes.json();
      if (trendsJson.success) {
        const pointMap = new Map<string, { net: number }>(
          trendsJson.data.points.map((p: { sessionId: string; net: number }) => [p.sessionId, p])
        );
        for (const item of mapped) {
          const p = pointMap.get(item.session._id);
          if (p) item.net = p.net;
        }
      }

      setSessions(mapped);
      setSummary(sumResult);
    } catch {
      setError('No se pudo cargar el historial. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(from, to);
  }, [from, to, load]);

  function handlePeriodChange(p: PeriodPreset, f: string, t: string) {
    setPreset(p);
    setFrom(f);
    setTo(t);
  }

  const netColor =
    summary && summary.net > 0
      ? 'var(--color-income)'
      : summary && summary.net < 0
      ? 'var(--color-expense)'
      : 'var(--color-text-primary)';

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">

        {/* ── Header ── */}
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Historial
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Jornadas cerradas
          </p>
        </div>

        {/* ── Filtro de período ── */}
        <PeriodSelector
          preset={preset}
          from={from}
          to={to}
          onChange={handlePeriodChange}
        />

        {/* ── Resumen del período ── */}
        {summary && !loading && sessions.length > 0 && (
          <section
            className="rounded-3xl overflow-hidden animate-fade-in"
            style={{ border: '1px solid var(--color-border-subtle)' }}
          >
            {/* Header del resumen */}
            <div
              className="px-5 py-3"
              style={{
                background: 'var(--color-surface-elevated)',
                borderBottom: '1px solid var(--color-border-subtle)',
              }}
            >
              <span className="section-label">
                {summary.sessions} jornada{summary.sessions !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ background: 'var(--color-surface)' }}>
              <div className="grid grid-cols-2 divide-x" style={{ borderBottom: '1px solid var(--color-border-subtle)', borderColor: 'var(--color-border-subtle)' }}>
                <SumCell label="Ingresos" value={formatCurrency(summary.income)} color="var(--color-income)" />
                <SumCell label="Gastos" value={formatCurrency(summary.expense)} color="var(--color-expense)" />
              </div>
              <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <SumCell label="Resultado" value={formatCurrency(summary.net)} color={netColor} bold />
                <SumCell label="KM" value={`${formatKm(summary.distance)} km`} color="var(--color-info)" />
                <SumCell label="Horas" value={formatHours(summary.hours)} />
              </div>
            </div>
          </section>
        )}

        {/* ── Lista ── */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load(from, to)} />
        ) : sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3 animate-fade-in">
            {sessions.map(({ session, net, distance }) => (
              <SessionHistoryItem
                key={session._id}
                session={session}
                net={net}
                distance={distance}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ── */

function SumCell({
  label,
  value,
  color,
  bold = false,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex flex-col items-center py-3 px-2 gap-0.5">
      <span className="section-label text-center">{label}</span>
      <span
        className={`text-sm tabular text-center ${bold ? 'font-bold' : 'font-semibold'}`}
        style={{ color: color ?? 'var(--color-text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-3xl h-20 animate-pulse-soft"
          style={{ background: 'var(--color-surface)' }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-14 px-6 rounded-3xl text-center gap-3"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)' }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--color-surface-elevated)' }}
        aria-hidden="true"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
            stroke="var(--color-text-muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Sin jornadas en este período
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Cuando cierres una jornada aparecerá aquí.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="rounded-3xl px-5 py-5 flex flex-col gap-3"
      style={{
        background: 'var(--color-expense-softer)',
        border: '1px solid var(--color-expense-border)',
      }}
    >
      <p className="text-sm" style={{ color: 'var(--color-expense)' }}>{message}</p>
      <button
        onClick={onRetry}
        className="text-xs font-semibold self-start"
        style={{ color: 'var(--color-accent)' }}
      >
        Intentar nuevamente
      </button>
    </div>
  );
}
