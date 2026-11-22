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
          border: '1.5px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-2xl"
          style={{ background: 'var(--color-surface-elevated)' }}
          aria-hidden="true"
        >
          📝
        </div>
        <p className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Sin movimientos todavía
        </p>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Tocá los botones de arriba para registrar tu primer ingreso o gasto.
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
