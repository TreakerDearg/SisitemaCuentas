import type { ExpenseBreakdown } from '@/types';
import { formatCurrency } from '@/lib/format';

interface Props {
  data: ExpenseBreakdown;
}

export default function ExpenseBreakdownCard({ data }: Props) {
  const { categories, total, topCategory } = data;

  if (total === 0 || categories.length === 0) {
    return (
      <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
        Sin gastos en este período.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Top category highlight */}
      {topCategory && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{
            background: 'var(--color-warning-softer)',
            border: '1px solid var(--color-warning-border)',
          }}
        >
          <div>
            <p className="section-label mb-0.5" style={{ color: 'var(--color-warning)' }}>
              Mayor gasto
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {topCategory.name}
            </p>
          </div>
          <p className="text-base font-bold tabular" style={{ color: 'var(--color-expense)' }}>
            {formatCurrency(topCategory.total)}
          </p>
        </div>
      )}

      {/* Lista de categorías */}
      {categories.map((cat, i) => (
        <div key={cat.id}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {cat.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {cat.percentage}%
              </span>
              <span className="text-sm font-semibold tabular" style={{ color: 'var(--color-expense)' }}>
                {formatCurrency(cat.total)}
              </span>
            </div>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: '5px', background: 'var(--color-surface-elevated)' }}
            role="progressbar"
            aria-valuenow={cat.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${cat.name}: ${cat.percentage}%`}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${cat.percentage}%`,
                background: `oklch(${0.65 - i * 0.05} 0.18 15)`,
              }}
            />
          </div>
        </div>
      ))}

      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Total gastos: {formatCurrency(total)}
      </p>
    </div>
  );
}
