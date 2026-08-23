'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  exactMatch?: boolean;
}

const items: NavItem[] = [
  {
    href: '/',
    label: 'Inicio',
    exactMatch: true,
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 12L12 3l9 9M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9"
          stroke="currentColor"
          strokeWidth={active ? '2.2' : '1.8'}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
          fillOpacity={active ? '0.12' : '0'}
        />
      </svg>
    ),
  },
  {
    href: '/historial',
    label: 'Historial',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h4"
          stroke="currentColor"
          strokeWidth={active ? '2.2' : '1.8'}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/analisis',
    label: 'Análisis',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M18 20V10M12 20V4M6 20v-6"
          stroke="currentColor"
          strokeWidth={active ? '2.2' : '1.8'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/configuracion',
    label: 'Config.',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={active ? '2.2' : '1.8'} />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          stroke="currentColor"
          strokeWidth={active ? '2.2' : '1.8'}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border-subtle)',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
      aria-label="Navegación principal"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 pt-1">
        {items.map(({ href, label, icon, exactMatch }) => {
          const active = exactMatch ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl transition-colors min-w-[64px]"
              style={{
                color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: active ? 'var(--color-accent-soft)' : 'transparent',
                transitionDuration: 'var(--motion-fast)',
              }}
              aria-current={active ? 'page' : undefined}
            >
              {icon(active)}
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: active ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
