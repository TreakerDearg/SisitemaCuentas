import Link from 'next/link';
import type { WorkSession } from '@/types';
import { formatCurrency, formatKm, formatDateShort, formatTime } from '@/lib/format';

interface SessionHistoryItemProps {
  session: WorkSession;
  net: number;
  distance: number;
}

export default function SessionHistoryItem({ session, net, distance }: SessionHistoryItemProps) {
  const isPositive = net >= 0;
  const netColor = isPositive ? 'var(--color-income)' : 'var(--color-expense)';

  const vehicleName =
    typeof session.vehicleId === 'object' && session.vehicleId !== null
      ? (session.vehicleId as { name?: string }).name ?? ''
      : '';

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
    <Link
      href={`/historial/${session._id}`}
      className="flex items-center gap-4 px-4 py-4 rounded-3xl transition-colors"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-subtle)',
        transitionDuration: 'var(--motion-fast)',
        display: 'flex',
      }}
      aria-label={`Jornada ${formatDateShort(session.date)}, resultado ${formatCurrency(net)}`}
    >
      {/* Indicador de resultado */}
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ background: netColor, minHeight: '48px', width: '3px' }}
        aria-hidden="true"
      />

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {formatDateShort(session.date)}
          </span>
          <span className="text-lg font-bold tabular shrink-0" style={{ color: netColor }}>
            {isPositive ? '+' : '−'}&thinsp;{formatCurrency(Math.abs(net))}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {duration && (
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {formatTime(session.startTime)}
              {session.endTime && ` → ${formatTime(session.endTime)}`}
            </span>
          )}
          {distance > 0 && (
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--color-info)' }}
            >
              {formatKm(distance)} km
            </span>
          )}
          {vehicleName && (
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {vehicleName}
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
        <path d="M6 4l4 4-4 4" stroke="var(--color-border-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
