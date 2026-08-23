interface StatRowProps {
  label: string;
  value: string;
  valueColor?: string;
  size?: 'sm' | 'md' | 'lg';
  bold?: boolean;
}

export default function StatRow({
  label,
  value,
  valueColor,
  size = 'md',
  bold = false,
}: StatRowProps) {
  const labelSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const valueSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';

  return (
    <div className="flex items-center justify-between py-1">
      <span
        className={`${labelSize}`}
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
      </span>
      <span
        className={`${valueSize} ${bold ? 'font-bold' : 'font-semibold'} tabular-nums`}
        style={{ color: valueColor ?? 'var(--color-text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}
