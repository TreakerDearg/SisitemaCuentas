import type { WorkSession } from '@/types';
import { formatCurrency, formatKm, formatDateShort, formatTime } from '@/lib/format';
import Button from '@/components/ui/Button';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface NoSessionProps {
  lastSession: WorkSession | null;
  onStart: () => void;
}

export default function NoSession({ lastSession, onStart }: NoSessionProps) {
  return (
    <div
      className="flex flex-col min-h-screen px-4"
      style={{ background: 'var(--color-background)' }}
    >
      <div className="max-w-md mx-auto w-full flex flex-col flex-1 py-8">

        {/* ── Barra superior con Modo Día/Noche ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg"
              style={{
                background: 'var(--color-accent-soft)',
                color: 'var(--color-accent)',
                border: '1px solid var(--color-border)',
              }}
            >
              🚗
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                Gestor de Gastos
              </h2>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Control de caja diario
              </p>
            </div>
          </div>

          <ThemeToggle />
        </div>

        {/* ── Tarjeta de Estado: Listo para arrancar ── */}
        <div
          className="w-full rounded-3xl p-6 mb-6 flex flex-col items-center gap-4 text-center"
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
            style={{
              background: 'var(--color-income-soft)',
              border: '1px solid var(--color-income-border)',
            }}
            aria-hidden="true"
          >
            ⛽
          </div>
          <div>
            <h1 className="text-xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
              ¿Listo para empezar?
            </h1>
            <p className="text-sm mt-1.5 leading-relaxed font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Iniciá la jornada al cargar combustible para registrar tus kilómetros y controlar tu caja del día.
            </p>
          </div>

          <Button
            variant="income-solid"
            size="xl"
            fullWidth
            onClick={onStart}
            className="mt-2 text-lg shadow-lg"
          >
            Iniciar jornada →
          </Button>
        </div>

        {/* ── Resumen de la última jornada cerrada ── */}
        {lastSession && (
          <div className="mt-4">
            <p className="section-label mb-3 px-1">Última jornada cerrada</p>
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

  const rawDistance = session.finalKm && session.finalKm > session.initialKm ? session.finalKm - session.initialKm : 0;
  // Solo mostrar como "recorridos" si el número es verosímil para una jornada diaria (< 2500 km)
  const isReasonableDistance = rawDistance > 0 && rawDistance < 2500;

  return (
    <div
      className="w-full rounded-3xl p-4 flex flex-col gap-2.5 transition-colors"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          🚗 {vehicleName}
        </span>
        <span className="badge-closed text-xs">Cerrada</span>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
        <span>
          {formatDateShort(session.date)} · {formatTime(session.startTime)} {session.endTime ? `→ ${formatTime(session.endTime)}` : ''}
        </span>
        {isReasonableDistance ? (
          <span className="tabular">{formatKm(rawDistance)} km recorridos</span>
        ) : session.finalKm ? (
          <span className="tabular">KM final: {formatKm(session.finalKm)}</span>
        ) : null}
      </div>
    </div>
  );
}
