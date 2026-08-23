import type { PaymentMethodBreakdown } from '@/types';
import { formatCurrency } from '@/lib/format';

interface Props {
  data: PaymentMethodBreakdown;
}

export default function PaymentBreakdownCard({ data }: Props) {
  const { methods, incomeGrandTotal } = data;

  const cash = methods.find((m) => m.method === 'cash');
  const transfer = methods.find((m) => m.method === 'transfer');

  if (incomeGrandTotal === 0) {
    return (
      <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
        Sin ingresos en este período.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Grid efectivo / transferencia */}
      <div className="grid grid-cols-2 gap-3">
        {cash && (
          <div
            className="rounded-2xl px-4 py-3"
            style={{
              background: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <p className="section-label mb-1">Efectivo</p>
            <p className="text-base font-bold tabular" style={{ color: 'var(--color-text-primary)' }}>
              {formatCurrency(cash.incomeTotal)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {cash.incomePercentage}% de ingresos
            </p>
          </div>
        )}
        {transfer && (
          <div
            className="rounded-2xl px-4 py-3"
            style={{
              background: 'var(--color-transfer-softer)',
              border: '1px solid var(--color-transfer-border)',
            }}
          >
            <p className="section-label mb-1" style={{ color: 'var(--color-transfer)' }}>
              Transferencia
            </p>
            <p className="text-base font-bold tabular" style={{ color: 'var(--color-transfer)' }}>
              {formatCurrency(transfer.incomeTotal)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {transfer.incomePercentage}% de ingresos
            </p>
          </div>
        )}
      </div>

      {/* Barra proporción */}
      {cash && transfer && incomeGrandTotal > 0 && (
        <div>
          <div
            className="w-full rounded-full overflow-hidden flex"
            style={{ height: '8px', background: 'var(--color-surface-elevated)' }}
            role="img"
            aria-label={`Efectivo ${cash.incomePercentage}%, Transferencia ${transfer.incomePercentage}%`}
          >
            <div
              style={{
                width: `${cash.incomePercentage}%`,
                background: 'var(--color-text-tertiary)',
                borderRadius: '9999px 0 0 9999px',
              }}
            />
            <div
              style={{
                width: `${transfer.incomePercentage}%`,
                background: 'var(--color-transfer)',
                borderRadius: '0 9999px 9999px 0',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Efectivo {cash.incomePercentage}%
            </span>
            <span className="text-xs" style={{ color: 'var(--color-transfer)' }}>
              Transfer. {transfer.incomePercentage}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
