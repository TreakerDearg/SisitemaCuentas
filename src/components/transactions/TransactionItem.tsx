import type { Transaction } from '@/types';
import { formatCurrency, formatTime, platformLabel, paymentLabel } from '@/lib/format';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
  sessionOpen?: boolean;
}

export default function TransactionItem({ transaction, onClick, sessionOpen = true }: TransactionItemProps) {
  const isIncome = transaction.type === 'income';

  const title = isIncome
    ? platformLabel(transaction.platform) || 'Ingreso'
    : transaction.category?.name ?? 'Gasto';

  const subtitle = [
    paymentLabel(transaction.paymentMethod),
    transaction.description,
  ]
    .filter(Boolean)
    .join(' · ');

  const amountColor = isIncome ? 'var(--color-income)' : 'var(--color-expense)';
  const iconBg = isIncome ? 'var(--color-income-soft)' : 'var(--color-expense-soft)';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-colors"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-subtle)',
        cursor: onClick ? 'pointer' : 'default',
        transitionDuration: 'var(--motion-fast)',
      }}
      aria-label={`${isIncome ? 'Ingreso' : 'Gasto'}: ${title}, ${formatCurrency(transaction.amount)}`}
    >
      {/* Ícono */}
      <div
        className="flex items-center justify-center rounded-xl shrink-0"
        style={{ width: '40px', height: '40px', background: iconBg }}
        aria-hidden="true"
      >
        {isIncome ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 19V5M5 12l7-7 7 7" stroke={amountColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M19 12l-7 7-7-7" stroke={amountColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
          {subtitle}
        </p>
      </div>

      {/* Monto + hora */}
      <div className="flex flex-col items-end shrink-0 gap-0.5">
        <span className="text-sm font-bold tabular" style={{ color: amountColor }}>
          {isIncome ? '+' : '−'}&thinsp;{formatCurrency(transaction.amount)}
        </span>
        <span className="text-xs tabular" style={{ color: 'var(--color-text-muted)' }}>
          {formatTime(transaction.createdAt)}
        </span>
      </div>

      {/* Chevron si se puede tocar */}
      {sessionOpen && onClick && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 ml-0.5" aria-hidden="true">
          <path d="M5 3l4 4-4 4" stroke="var(--color-border-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
