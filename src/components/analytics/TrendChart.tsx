'use client';

import type { TrendPoint } from '@/types';
import { formatCurrency, formatDateShort } from '@/lib/format';

interface TrendChartProps {
  points: TrendPoint[];
}

const CHART_H = 120;
const BAR_GAP = 4;

export default function TrendChart({ points }: TrendChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-24" style={{ color: 'var(--color-text-muted)' }}>
        <span className="text-xs">Sin datos para mostrar</span>
      </div>
    );
  }

  const nets = points.map((p) => p.net);
  const maxAbs = Math.max(...nets.map(Math.abs), 1);

  return (
    <div className="flex flex-col gap-3">
      {/* Gráfico SVG */}
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div style={{ minWidth: Math.max(points.length * 36, 200) }}>
          <svg
            width="100%"
            height={CHART_H + 24}
            viewBox={`0 0 ${Math.max(points.length * 36, 200)} ${CHART_H + 24}`}
            preserveAspectRatio="none"
            aria-label="Tendencia de resultados por jornada"
            role="img"
          >
            {/* Línea cero */}
            <line
              x1="0"
              y1={CHART_H / 2}
              x2={Math.max(points.length * 36, 200)}
              y2={CHART_H / 2}
              stroke="var(--color-border)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            {points.map((p, i) => {
              const barW = 36 - BAR_GAP * 2;
              const x = i * 36 + BAR_GAP;
              const normalized = p.net / maxAbs; // -1 to 1
              const barH = Math.abs(normalized) * (CHART_H / 2 - 6);
              const isPositive = p.net >= 0;
              const y = isPositive
                ? CHART_H / 2 - barH
                : CHART_H / 2;
              const color = isPositive
                ? 'var(--color-income)'
                : 'var(--color-expense)';

              return (
                <g key={p.sessionId}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(barH, 2)}
                    rx="3"
                    fill={color}
                    fillOpacity="0.85"
                  />
                  {/* Etiqueta de fecha */}
                  <text
                    x={x + barW / 2}
                    y={CHART_H + 16}
                    textAnchor="middle"
                    fontSize="9"
                    fill="var(--color-text-muted)"
                  >
                    {new Date(p.date).getDate()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Tabla accesible de los últimos 5 puntos */}
      <div className="sr-only" aria-label="Datos de tendencia">
        {points.slice(-5).map((p) => (
          <span key={p.sessionId}>
            {formatDateShort(p.date)}: {formatCurrency(p.net)}
          </span>
        ))}
      </div>

      {/* Best / worst */}
      <div className="flex gap-2">
        {(() => {
          const best = points.reduce((a, b) => (a.net >= b.net ? a : b));
          const worst = points.reduce((a, b) => (a.net <= b.net ? a : b));
          return (
            <>
              <Pill
                label="Mayor resultado"
                value={formatCurrency(best.net)}
                date={formatDateShort(best.date)}
                color="var(--color-income)"
                bg="var(--color-income-softer)"
              />
              {points.length > 1 && (
                <Pill
                  label="Menor resultado"
                  value={formatCurrency(worst.net)}
                  date={formatDateShort(worst.date)}
                  color={worst.net >= 0 ? 'var(--color-text-secondary)' : 'var(--color-expense)'}
                  bg="var(--color-surface-elevated)"
                />
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}

function Pill({
  label,
  value,
  date,
  color,
  bg,
}: {
  label: string;
  value: string;
  date: string;
  color: string;
  bg: string;
}) {
  return (
    <div
      className="flex-1 rounded-2xl px-3 py-2.5"
      style={{ background: bg, border: '1px solid var(--color-border-subtle)' }}
    >
      <p className="section-label mb-1">{label}</p>
      <p className="text-sm font-bold tabular" style={{ color }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{date}</p>
    </div>
  );
}
