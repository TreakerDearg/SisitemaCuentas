import type { WorkSession } from '@/types';
import { formatCurrency, formatKm, formatDateShort, formatTime } from '@/lib/format';
import Button from '@/components/ui/Button';

interface NoSessionProps {
  lastSession: WorkSession | null;
  onStart: () => void;
}

export default function NoSession({ lastSession, onStart }: NoSessionProps) {
  return (
    <div
      className="flex flex-col min-h-screen px-5"
      style={{ background: 'var(--color-background)' }}
    >
      <div className="max-w-lg mx-auto w-full flex flex-col flex-1 py-10">

        {/* ── Logo / Brand ── */}
        <div className="flex flex-col items-center gap-3 mt-8 mb-12">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center"
            style={{
              background: 'var(--color-info-soft)',
              border: '1px solid var(--color-info-border)',
            }}
            aria-hidden="true"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="13" rx="2" stroke="var(--color-info)" strokeWidth="1.8" />
              <path d="M2 10h20" stroke="var(--color-info)" strokeWidth="1.8" />
              <path d="M6 15h4M14 15h4" stroke="var(--color-info)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              Gestor de Gastos
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Control de caja y jornadas
            </p>
          </div>
        </div>

        {/* ── Estado sin jornada ── */}
        <div
          className="w-full rounded-3xl p-6 mb-6 flex flex-col items-center gap-3 text-center"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--color-surface-elevated)' }}
            aria-hidden="true"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="var(--color-text-muted)" strokeWidth="1.5" />
              <path d="M12 8v4m0 4h.01" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Sin jornada activa
            </p>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
              Iniciá una jornada para comenzar a registrar tus ingresos y gastos.
            </p>
          </div>
        </div>

        {/* ── CTA principal ── */}
        <Button variant="primary" size="xl" fullWidth onClick={onStart}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Iniciar jornada
        </Button>

        {/* ── Última jornada ── */}
        {lastSession && (
          <div className="mt-8">
            <p className="section-label mb-3 px-1">Última jornada</p>
            <LastSessionCard session={lastSession} />
          </div>
        )}
      </div>
    </div>
  );
}

function LastSessionCard({ session }: { session: WorkSession }) {
  const vehicleName =
    typeof session.vehicleId === 'object' && session.vehicleId !== null
      ? (session.vehicleId as { name?: string }).name ?? 'Vehículo'
      : 'Vehículo';

  return (
    <div
      className="w-full rounded-3xl overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {vehicleName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {formatDateShort(session.date)}
            {' · '}
            {formatTime(session.startTime)}
            {session.endTime ? ` → ${formatTime(session.endTime)}` : ''}
          </p>
        </div>
        <span className="badge-closed">Cerrada</span>
      </div>
    </div>
  );
}
