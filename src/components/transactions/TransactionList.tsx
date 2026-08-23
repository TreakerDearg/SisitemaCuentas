import type { Transaction } from '@/types';
import { formatDateShort } from '@/lib/format';
import TransactionItem from './TransactionItem';

interface TransactionListProps {
  transactions: Transaction[];
  sessionOpen?: boolean;
  onSelect?: (transaction: Transaction) => void;
}

export default function TransactionList({ transactions, sessionOpen = true, onSelect }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-10 px-6 rounded-3xl text-center"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
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
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Sin movimientos todavía
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Registrá un ingreso o un gasto para que aparezca aquí.
        </p>
      </div>
    );
  }

  // Agrupar por fecha
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = new Date(tx.createdAt).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  return (
    <div className="flex flex-col gap-4">
      {Array.from(groups.entries()).map(([, txs]) => (
        <div key={txs[0]._id + '-group'} className="flex flex-col gap-2">
          {/* Encabezado de fecha */}
          <div className="flex items-center gap-2 px-1">
            <span className="section-label">{formatDateShort(txs[0].createdAt)}</span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border-subtle)' }} />
          </div>

          {txs.map((tx) => (
            <TransactionItem
              key={tx._id}
              transaction={tx}
              sessionOpen={sessionOpen}
              onClick={onSelect ? () => onSelect(tx) : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
