'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  exactMatch?: boolean;
}

// En teléfonos solo se muestran las 2 pantallas esenciales del sistema
const items: NavItem[] = [
  {
    href: '/',
    label: 'Jornada',
    exactMatch: true,
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17a2 2 0 0 0 4 0M15 17a2 2 0 0 0 4 0"
          stroke="currentColor"
          strokeWidth={active ? '2.4' : '1.9'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth={active ? '2.4' : '1.9'} />
        <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth={active ? '2.4' : '1.9'} />
      </svg>
    ),
  },
  {
    href: '/analisis',
    label: 'Análisis',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M18 20V10M12 20V4M6 20v-6"
          stroke="currentColor"
          strokeWidth={active ? '2.4' : '1.9'}
          strokeLinecap="round"
          strokeLinejoin="round"
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
        borderTop: '1px solid var(--color-border)',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.05)',
        paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))',
      }}
      aria-label="Navegación principal"
    >
      <div className="max-w-md mx-auto grid grid-cols-2 px-6 pt-2">
        {items.map(({ href, label, icon, exactMatch }) => {
          const active = exactMatch ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl transition-all"
              style={{
                color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: active ? 'var(--color-accent-soft)' : 'transparent',
                fontWeight: active ? '700' : '600',
              }}
              aria-current={active ? 'page' : undefined}
            >
              {icon(active)}
              <span className="text-xs tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
