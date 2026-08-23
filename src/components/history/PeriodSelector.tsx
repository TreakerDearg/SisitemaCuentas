'use client';

import type { PeriodPreset } from '@/types';

interface Preset {
  value: PeriodPreset;
  label: string;
}

const PRESETS: Preset[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'prev-month', label: 'Mes ant.' },
  { value: 'custom', label: 'Custom' },
];

interface PeriodSelectorProps {
  preset: PeriodPreset;
  from: string;
  to: string;
  onChange: (preset: PeriodPreset, from: string, to: string) => void;
}

import { getPeriodRange } from '@/lib/format';

export default function PeriodSelector({ preset, from, to, onChange }: PeriodSelectorProps) {
  function selectPreset(p: PeriodPreset) {
    if (p === 'custom') {
      onChange('custom', from, to);
      return;
    }
    const range = getPeriodRange(p);
    onChange(p, range.from, range.to);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tabs de preset */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-0.5"
        style={{ scrollbarWidth: 'none' }}
        role="tablist"
        aria-label="Período"
      >
        {PRESETS.map((p) => {
          const active = preset === p.value;
          return (
            <button
              key={p.value}
              role="tab"
              aria-selected={active}
              onClick={() => selectPreset(p.value)}
              className="shrink-0 px-4 py-2 rounded-2xl text-xs font-semibold transition-all"
              style={{
                background: active ? 'var(--color-info-soft)' : 'var(--color-surface)',
                color: active ? 'var(--color-info)' : 'var(--color-text-muted)',
                border: active
                  ? '1px solid var(--color-info-border)'
                  : '1px solid var(--color-border)',
                minHeight: '36px',
                transitionDuration: 'var(--motion-fast)',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Fechas personalizadas */}
      {preset === 'custom' && (
        <div className="flex gap-2 items-end animate-fade-in">
          <div className="flex-1 flex flex-col gap-1">
            <label className="section-label">Desde</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => onChange('custom', e.target.value, to)}
              className="rounded-2xl px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                minHeight: '44px',
              }}
            />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="section-label">Hasta</label>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => onChange('custom', from, e.target.value)}
              className="rounded-2xl px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                minHeight: '44px',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
