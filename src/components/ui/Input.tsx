'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, id, className = '', ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="section-label"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {prefix && (
            <span
              className="absolute left-4 text-lg font-medium pointer-events-none select-none"
              style={{ color: 'var(--color-text-tertiary)' }}
              aria-hidden="true"
            >
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full rounded-2xl border px-4 py-3 text-base transition-colors',
              'placeholder:text-[var(--color-text-muted)]',
              'focus:outline-none',
              prefix ? 'pl-9' : '',
              suffix ? 'pr-14' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              minHeight: '52px',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: error
                ? '1px solid var(--color-expense)'
                : '1px solid var(--color-border)',
              transitionDuration: 'var(--motion-fast)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-focus)';
              e.currentTarget.style.background = 'var(--color-surface-elevated)';
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error
                ? 'var(--color-expense)'
                : 'var(--color-border)';
              e.currentTarget.style.background = 'var(--color-surface)';
              props.onBlur?.(e);
            }}
            {...props}
          />

          {suffix && (
            <span
              className="absolute right-4 text-sm pointer-events-none"
              style={{ color: 'var(--color-text-tertiary)' }}
              aria-hidden="true"
            >
              {suffix}
            </span>
          )}
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
        {hint && !error && (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
