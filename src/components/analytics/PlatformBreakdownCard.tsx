import type { PlatformBreakdown } from '@/types';
import { formatCurrency } from '@/lib/format';

interface Props {
  data: PlatformBreakdown;
}

const PLATFORM_COLORS: Record<string, string> = {
  uber: 'var(--color-income)',
  didi: 'var(--color-info)',
  other: 'var(--color-text-tertiary)',
};

export default function PlatformBreakdownCard({ data }: Props) {
  const { platforms, grandTotal } = data;

  if (grandTotal === 0) {
    return (
      <EmptyCard message="Sin ingresos por plataforma en este período." />
    );
  }

  // Sort by total desc
  const sorted = [...platforms].sort((a, b) => b.total - a.total);

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((p) => {
        if (p.total === 0) return null;
        const color = PLATFORM_COLORS[p.platform] ?? 'var(--color-text-muted)';
        return (
          <div key={p.platform}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold" style={{ color }}>{p.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {p.percentage}%
                </span>
                <span className="text-sm font-bold tabular" style={{ color }}>
                  {formatCurrency(p.total)}
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: '6px', background: 'var(--color-surface-elevated)' }}
              role="progressbar"
              aria-valuenow={p.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${p.label}: ${p.percentage}%`}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${p.percentage}%`,
                  background: color,
                  transitionDuration: 'var(--motion-slow)',
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Texto accesible */}
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Total: {formatCurrency(grandTotal)}
      </p>
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
      {message}
    </p>
  );
}
