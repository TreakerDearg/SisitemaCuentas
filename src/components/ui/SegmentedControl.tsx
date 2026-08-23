'use client';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  columns?: number;
  /** Acento semántico para el estado activo */
  accent?: 'default' | 'income' | 'expense' | 'transfer';
}

const accentActive: Record<string, React.CSSProperties> = {
  default: {
    background: 'var(--color-accent-soft)',
    color: 'var(--color-accent-hover)',
    border: '1px solid var(--color-accent)',
  },
  income: {
    background: 'var(--color-income-soft)',
    color: 'var(--color-income)',
    border: '1px solid var(--color-income-border)',
  },
  expense: {
    background: 'var(--color-expense-soft)',
    color: 'var(--color-expense)',
    border: '1px solid var(--color-expense-border)',
  },
  transfer: {
    background: 'var(--color-transfer-soft)',
    color: 'var(--color-transfer)',
    border: '1px solid var(--color-transfer-border)',
  },
};

export default function SegmentedControl({
  options,
  value,
  onChange,
  label,
  error,
  columns,
  accent = 'default',
}: SegmentedControlProps) {
  const cols = columns ?? Math.min(options.length, 4);
  const activeStyle = accentActive[accent] ?? accentActive.default;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="section-label">{label}</span>
      )}

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl py-3 px-2 text-sm font-semibold transition-all select-none"
              style={{
                minHeight: '52px',
                transitionDuration: 'var(--motion-fast)',
                transitionTimingFunction: 'var(--motion-easing)',
                ...(selected
                  ? activeStyle
                  : {
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-tertiary)',
                      border: '1px solid var(--color-border)',
                    }),
              }}
              aria-pressed={selected}
            >
              {opt.icon && <span aria-hidden="true">{opt.icon}</span>}
              {opt.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p
          className="text-xs flex items-center gap-1"
          style={{ color: 'var(--color-expense)' }}
          role="alert"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 4v3M6 8.5v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
