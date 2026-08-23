'use client';

import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'income' | 'expense' | 'danger' | 'ghost' | 'outline' | 'transfer';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary:  {},
  income:   {},
  expense:  {},
  danger:   {},
  ghost:    {},
  outline:  {},
  transfer: {},
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm rounded-xl',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3.5 text-base rounded-2xl',
  xl: 'px-6 py-4 text-base font-semibold rounded-2xl',
};

const sizeMinH: Record<Size, string> = {
  sm: '36px',
  md: '44px',
  lg: '52px',
  xl: '60px',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const variantStyle = getVariantStyle(variant);

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-all select-none cursor-pointer',
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        minHeight: sizeMinH[size],
        transitionDuration: 'var(--motion-fast)',
        transitionTimingFunction: 'var(--motion-easing)',
        ...variantStyle,
        ...style,
      }}
      {...props}
    >
      {loading ? <><ButtonSpinner />{children}</> : children}
    </button>
  );
}

function getVariantStyle(variant: string): React.CSSProperties {
  switch (variant) {
    case 'income':
      return {
        background: 'var(--color-income-soft)',
        color: 'var(--color-income)',
        border: '1px solid var(--color-income-border)',
      };
    case 'expense':
      return {
        background: 'var(--color-expense-soft)',
        color: 'var(--color-expense)',
        border: '1px solid var(--color-expense-border)',
      };
    case 'danger':
      return {
        background: 'var(--color-expense-soft)',
        color: 'var(--color-expense)',
        border: '1px solid var(--color-expense-border)',
      };
    case 'transfer':
      return {
        background: 'var(--color-transfer-soft)',
        color: 'var(--color-transfer)',
        border: '1px solid var(--color-transfer-border)',
      };
    case 'ghost':
      return {
        background: 'transparent',
        color: 'var(--color-text-secondary)',
        border: '1px solid transparent',
      };
    case 'outline':
      return {
        background: 'transparent',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border-strong)',
      };
    case 'primary':
    default:
      return {
        background: 'var(--color-accent)',
        color: '#fff',
        border: '1px solid transparent',
      };
  }
}

function ButtonSpinner() {
  return (
    <svg
      className="animate-spin shrink-0"
      width="16" height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
