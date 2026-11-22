'use client';

import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'income' | 'income-solid' | 'expense' | 'expense-solid' | 'danger' | 'ghost' | 'outline' | 'transfer';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm rounded-xl',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3.5 text-base rounded-2xl',
  xl: 'px-6 py-4 text-base font-bold rounded-2xl',
};

const sizeMinH: Record<Size, string> = {
  sm: '40px',
  md: '48px',
  lg: '54px',
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
        'inline-flex items-center justify-center gap-2.5 font-bold',
        'transition-all select-none cursor-pointer active:scale-[0.98]',
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50 cursor-not-allowed active:scale-100' : '',
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
    case 'income-solid':
      return {
        background: 'var(--color-income-solid)',
        color: '#FFFFFF',
        border: '1px solid transparent',
        boxShadow: 'var(--shadow-income)',
      };
    case 'expense':
    case 'expense-solid':
    case 'danger':
      return {
        background: 'var(--color-expense-solid)',
        color: '#FFFFFF',
        border: '1px solid transparent',
        boxShadow: 'var(--shadow-expense)',
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
        background: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        border: '1.5px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      };
    case 'primary':
    default:
      return {
        background: 'var(--color-accent)',
        color: '#FFFFFF',
        border: '1px solid transparent',
        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
      };
  }
}

function ButtonSpinner() {
  return (
    <svg
      className="animate-spin shrink-0"
      width="18" height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
