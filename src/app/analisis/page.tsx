'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  PeriodPreset,
  AnalyticsSummary,
  PlatformBreakdown,
  PaymentMethodBreakdown,
  ExpenseBreakdown,
  TrendData,
} from '@/types';
import {
  getAnalyticsSummary,
  getAnalyticsPlatforms,
  getAnalyticsPaymentMethods,
  getAnalyticsExpenses,
  getAnalyticsTrends,
} from '@/lib/api';
import {
  getPeriodRange,
  formatCurrency,
  formatKm,
  formatHours,
  calcVariation,
  formatVariation,
} from '@/lib/format';
import PeriodSelector from '@/components/history/PeriodSelector';
import TrendChart from '@/components/analytics/TrendChart';
import PlatformBreakdownCard from '@/components/analytics/PlatformBreakdownCard';
import PaymentBreakdownCard from '@/components/analytics/PaymentBreakdownCard';
import ExpenseBreakdownCard from '@/components/analytics/ExpenseBreakdownCard';

export default function AnalisisPage() {
  const initialRange = getPeriodRange('month');

  const [preset, setPreset] = useState<PeriodPreset>('month');
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [platforms, setPlatforms] = useState<PlatformBreakdown | null>(null);
  const [payments, setPayments] = useState<PaymentMethodBreakdown | null>(null);
  const [expenses, setExpenses] = useState<ExpenseBreakdown | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async (f: string, t: string) => {
    setLoading(true);
    setLoadError('');
    try {
      const [sum, plat, pay, exp, trd] = await Promise.all([
        getAnalyticsSummary({ from: f, to: t }),
        getAnalyticsPlatforms({ from: f, to: t }),
        getAnalyticsPaymentMethods({ from: f, to: t }),
        getAnalyticsExpenses({ from: f, to: t }),
        getAnalyticsTrends({ from: f, to: t }),
      ]);
      setSummary(sum);
      setPlatforms(plat);
      setPayments(pay);
      setExpenses(exp);
      setTrends(trd);
    } catch {
      setLoadError('No se pudieron cargar las estadísticas. Intentá nuevamente.');
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Análisis
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Estadísticas de rendimiento
          </p>
        </div>

        {/* ── Período ── */}
        <PeriodSelector
          preset={preset}
          from={from}
          to={to}
          onChange={handlePeriodChange}
        />

        {loading ? (
          <LoadingSkeleton />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={() => load(from, to)} />
        ) : summary && summary.sessions === 0 ? (
          <EmptyState />
        ) : summary ? (
          <>
            {/* ── 1. Resultado principal ── */}
            <AnalyticsSection>
              <ResultHero summary={summary} previousNet={trends?.previousPeriodNet ?? null} />
            </AnalyticsSection>

            {/* ── 2. Resumen numérico ── */}
            <AnalyticsSection label="Resumen del período">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Jornadas"
                  value={String(summary.sessions)}
                  color="var(--color-info)"
                />
                <MetricCard
                  label="Horas"
                  value={formatHours(summary.hours)}
                  color="var(--color-info)"
                />
                <MetricCard
                  label="Ingresos"
                  value={formatCurrency(summary.income)}
                  color="var(--color-income)"
                />
                <MetricCard
                  label="Gastos"
                  value={formatCurrency(summary.expense)}
                  color="var(--color-expense)"
                />
                <MetricCard
                  label="KM recorridos"
                  value={`${formatKm(summary.distance)} km`}
                  color="var(--color-info)"
                />
                <MetricCard
                  label="Resultado"
                  value={formatCurrency(summary.net)}
                  color={
                    summary.net > 0
                      ? 'var(--color-income)'
                      : summary.net < 0
                      ? 'var(--color-expense)'
                      : 'var(--color-text-primary)'
                  }
                  bold
                />
              </div>
            </AnalyticsSection>

            {/* ── 3. Rendimiento ── */}
            <AnalyticsSection label="Rendimiento">
              <div className="grid grid-cols-2 gap-3">
                <PerformanceCell
                  label="Resultado / hora"
                  value={summary.netPerHour !== null ? `${formatCurrency(summary.netPerHour)}/h` : null}
                />
                <PerformanceCell
                  label="Resultado / km"
                  value={summary.netPerKm !== null ? `${formatCurrency(summary.netPerKm)}/km` : null}
                />
                <PerformanceCell
                  label="Ingreso / hora"
                  value={summary.incomePerHour !== null ? `${formatCurrency(summary.incomePerHour)}/h` : null}
                />
                <PerformanceCell
                  label="Ingreso / km"
                  value={summary.incomePerKm !== null ? `${formatCurrency(summary.incomePerKm)}/km` : null}
                />
              </div>
            </AnalyticsSection>

            {/* ── 4. Promedios por jornada ── */}
            <AnalyticsSection label="Promedio por jornada">
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label="Ingreso"
                  value={summary.averageIncome !== null ? formatCurrency(summary.averageIncome) : '—'}
                  color="var(--color-income)"
                  small
                />
                <MetricCard
                  label="Gasto"
                  value={summary.averageExpense !== null ? formatCurrency(summary.averageExpense) : '—'}
                  color="var(--color-expense)"
                  small
                />
                <MetricCard
                  label="Resultado"
                  value={summary.averageNet !== null ? formatCurrency(summary.averageNet) : '—'}
                  color={
                    (summary.averageNet ?? 0) >= 0
                      ? 'var(--color-income)'
                      : 'var(--color-expense)'
                  }
                  small
                  bold
                />
              </div>
            </AnalyticsSection>

            {/* ── 5. Tendencia ── */}
            {trends && trends.points.length > 0 && (
              <AnalyticsSection label="Resultado por jornada">
                <TrendChart points={trends.points} />
              </AnalyticsSection>
            )}

            {/* ── 6. Plataformas ── */}
            {platforms && (
              <AnalyticsSection label="Ingresos por plataforma">
                <PlatformBreakdownCard data={platforms} />
              </AnalyticsSection>
            )}

            {/* ── 7. Métodos de pago ── */}
            {payments && (
              <AnalyticsSection label="Método de cobro">
                <PaymentBreakdownCard data={payments} />
              </AnalyticsSection>
            )}

            {/* ── 8. Gastos por categoría ── */}
            {expenses && (
              <AnalyticsSection label="Gastos por categoría">
                <ExpenseBreakdownCard data={expenses} />
              </AnalyticsSection>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function AnalyticsSection({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-3xl overflow-hidden animate-fade-in"
      style={{ border: '1px solid var(--color-border-subtle)' }}
    >
      {label && (
        <div
          className="px-5 py-2.5"
          style={{
            background: 'var(--color-surface-elevated)',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <span className="section-label">{label}</span>
        </div>
      )}
      <div className="px-5 py-4" style={{ background: 'var(--color-surface)' }}>
        {children}
      </div>
    </section>
  );
}

function ResultHero({
  summary,
  previousNet,
}: {
  summary: AnalyticsSummary;
  previousNet: number | null;
}) {
  const netColor =
    summary.net > 0
      ? 'var(--color-income)'
      : summary.net < 0
      ? 'var(--color-expense)'
      : 'var(--color-text-primary)';

  const variation = calcVariation(summary.net, previousNet ?? 0);
  const varStr = formatVariation(previousNet !== null ? variation : null);
  const varColor =
    variation === null || previousNet === null
      ? 'var(--color-text-muted)'
      : variation >= 0
      ? 'var(--color-income)'
      : 'var(--color-expense)';

  return (
    <div className="flex flex-col items-center gap-1 py-2 text-center">
      <p className="section-label mb-1">Resultado neto</p>
      <p className="money-xl tabular" style={{ color: netColor }}>
        {summary.net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(summary.net))}
      </p>
      {previousNet !== null && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            vs período anterior
          </span>
          <span className="text-xs font-bold" style={{ color: varColor }}>
            {varStr}
          </span>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
  bold = false,
  small = false,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className="rounded-2xl px-3 py-3 flex flex-col gap-1"
      style={{
        background: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <span className="section-label">{label}</span>
      <span
        className={`tabular ${small ? 'text-sm' : 'text-base'} ${bold ? 'font-bold' : 'font-semibold'}`}
        style={{ color: color ?? 'var(--color-text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}

function PerformanceCell({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div
      className="rounded-2xl px-3 py-3 flex flex-col gap-1"
      style={{
        background: 'var(--color-info-softer)',
        border: '1px solid var(--color-info-border)',
      }}
    >
      <span className="section-label" style={{ color: 'var(--color-info)' }}>
        {label}
      </span>
      <span
        className="text-base font-bold tabular"
        style={{ color: value ? 'var(--color-info)' : 'var(--color-text-muted)' }}
      >
        {value ?? 'No disp.'}
      </span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-3xl animate-pulse-soft"
          style={{
            height: i === 1 ? '140px' : '100px',
            background: 'var(--color-surface)',
          }}
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
            d="M18 20V10M12 20V4M6 20v-6"
            stroke="var(--color-text-muted)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Aún no hay datos
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          Cuando cierres tu primera jornada, las estadísticas aparecerán aquí.
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
