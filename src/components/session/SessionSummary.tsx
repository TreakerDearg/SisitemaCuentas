import type { ActiveSessionData } from '@/types';
import { formatCurrency, formatKm, formatDate, formatTime } from '@/lib/format';
import Button from '@/components/ui/Button';

interface SessionSummaryProps {
  data: ActiveSessionData;
  actualCash: number | null;
  onRestart: () => void;
}

export default function SessionSummary({ data, actualCash, onRestart }: SessionSummaryProps) {
  const { session, summary } = data;

  const cashDiff = actualCash !== null ? actualCash - summary.expectedCash : null;

  const netColor =
    summary.netResult > 0
      ? 'var(--color-income)'
      : summary.netResult < 0
      ? 'var(--color-expense)'
      : 'var(--color-text-primary)';

  const diffColor =
    cashDiff === null
      ? 'var(--color-text-muted)'
      : cashDiff === 0
      ? 'var(--color-income)'
      : cashDiff > 0
      ? 'var(--color-income)'
      : 'var(--color-warning)';

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: 'var(--color-background)' }}
    >
      <div className="max-w-lg mx-auto w-full px-5 py-8 flex flex-col gap-5 pb-16 animate-fade-in">

        {/* ── Header ── */}
        <div className="flex flex-col items-center gap-2 text-center pb-2">
          <div
            className="w-14 h-14 rounded-3xl flex items-center justify-center mb-1"
            style={{ background: 'var(--color-income-soft)', border: '1px solid var(--color-income-border)' }}
            aria-hidden="true"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                stroke="var(--color-income)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="badge-closed">Jornada finalizada</span>
          <p className="text-lg font-semibold mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {formatDate(session.date)}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {formatTime(session.startTime)}
            {session.endTime && ` → ${formatTime(session.endTime)}`}
          </p>
        </div>

        {/* ── Resultado principal ── */}
        <div
          className="rounded-3xl px-6 py-7 text-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)' }}
        >
          <p className="section-label mb-2">Resultado</p>
          <p className="money-xl tabular" style={{ color: netColor }}>
            {summary.netResult >= 0 ? '+' : '−'}{formatCurrency(Math.abs(summary.netResult))}
          </p>
        </div>

        {/* ── Ingresos / Gastos ── */}
        <SectionCard>
          <SectionHeader label="Ingresos y gastos" />
          <Row label="Ingresos" value={`+${formatCurrency(summary.totalIncome)}`} color="var(--color-income)" />
          <Row label="Gastos" value={`−${formatCurrency(summary.totalExpense)}`} color="var(--color-expense)" last />
        </SectionCard>

        {/* ── Efectivo / Transferencias ── */}
        <SectionCard>
          <SectionHeader label="Desglose por método" />
          <Row
            label="Efectivo"
            value={formatCurrency(summary.cashIncome - summary.cashExpense)}
            icon={<CashDot />}
          />
          <Row
            label="Transferencias"
            value={formatCurrency(summary.transferIncome - summary.transferExpense)}
            color="var(--color-transfer)"
            icon={<TransferDot />}
            last
          />
        </SectionCard>

        {/* ── Caja ── */}
        <SectionCard>
          <SectionHeader label="Caja" />
          <Row label="Esperada" value={formatCurrency(summary.expectedCash)} />
          {actualCash !== null && (
            <Row label="Real" value={formatCurrency(actualCash)} />
          )}
          {cashDiff !== null && (
            <Row
              label={cashDiff === 0 ? '✓ Coincide' : '⚠ Diferencia'}
              value={`${cashDiff >= 0 ? '+' : ''}${formatCurrency(cashDiff)}`}
              color={diffColor}
              bold
              last
            />
          )}
        </SectionCard>

        {/* ── KM ── */}
        <SectionCard>
          <SectionHeader label="Kilómetros" />
          <Row label="KM inicial" value={`${formatKm(session.initialKm)} km`} />
          {session.finalKm && (
            <Row label="KM final" value={`${formatKm(session.finalKm)} km`} />
          )}
          <Row
            label="Recorridos"
            value={summary.distance > 0 ? `${formatKm(summary.distance)} km` : '—'}
            bold
            last
          />
        </SectionCard>

        {/* ── CTA ── */}
        <div className="pt-2">
          <Button variant="outline" size="xl" fullWidth onClick={onRestart}>
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ border: '1px solid var(--color-border-subtle)' }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
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

function Row({
  label,
  value,
  color,
  bold = false,
  last = false,
  icon,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
  last?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3.5"
      style={{
        background: 'var(--color-surface)',
        borderBottom: last ? 'none' : '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </span>
      </div>
      <span
        className={`text-sm tabular ${bold ? 'font-bold' : 'font-semibold'}`}
        style={{ color: color ?? 'var(--color-text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}

function CashDot() {
  return (
    <span
      className="w-2 h-2 rounded-full"
      style={{ background: 'var(--color-text-tertiary)' }}
      aria-hidden="true"
    />
  );
}

function TransferDot() {
  return (
    <span
      className="w-2 h-2 rounded-full"
      style={{ background: 'var(--color-transfer)' }}
      aria-hidden="true"
    />
  );
}
