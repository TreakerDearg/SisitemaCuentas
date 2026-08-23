// ──────────────────────────────────────────────
// Utilidades de formato para la UI
// ──────────────────────────────────────────────

/**
 * Formatea un número como moneda en pesos argentinos.
 * Ej: 27000 → "$27.000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea un número como kilómetros con puntos de miles.
 * Ej: 125430 → "125.430"
 */
export function formatKm(km: number): string {
  return new Intl.NumberFormat('es-AR').format(km);
}

/**
 * Formatea una fecha ISO o Date como hora HH:MM.
 */
export function formatTime(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Formatea una fecha ISO como fecha corta: "22 AGO 2026".
 */
export function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return d
    .toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase()
    .replace('.', '');
}

/**
 * Formatea una fecha ISO como fecha corta sin año: "22 AGO".
 */
export function formatDateShort(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return d
    .toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
    })
    .toUpperCase()
    .replace('.', '');
}

/**
 * Devuelve la fecha actual en formato YYYY-MM-DD para campos <input type="date">.
 */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Devuelve la hora actual en formato HH:MM para campos <input type="time">.
 */
export function nowTimeHHMM(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Etiqueta legible para la plataforma.
 */
export function platformLabel(platform: string | null | undefined): string {
  const map: Record<string, string> = {
    uber: 'Uber',
    didi: 'DiDi',
    other: 'Otro',
  };
  return platform ? (map[platform] ?? platform) : '';
}

/**
 * Etiqueta legible para el método de pago.
 */
export function paymentLabel(method: string): string {
  const map: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    other: 'Otro',
  };
  return map[method] ?? method;
}

/**
 * Formatea horas decimales como "Xh YYm".
 * Ej: 38.33 → "38h 20m"
 */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/**
 * Formatea una fecha ISO como "LUN 22 AGO".
 */
export function formatDateWithDay(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return d
    .toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })
    .toUpperCase()
    .replace(/\./g, '');
}

/**
 * Calcula la variación porcentual entre dos valores.
 * Devuelve null si el valor anterior es 0.
 */
export function calcVariation(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Formatea una variación porcentual: "+12.3%" o "-5.1%"
 */
export function formatVariation(variation: number | null): string {
  if (variation === null) return '—';
  const sign = variation >= 0 ? '+' : '';
  return `${sign}${variation.toFixed(1)}%`;
}

/**
 * Calcula el rango de fechas para un preset dado.
 * Devuelve { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
 */
export function getPeriodRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const today = fmt(now);

  if (preset === 'today') {
    return { from: today, to: today };
  }

  if (preset === 'week') {
    const day = now.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day; // Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    return { from: fmt(monday), to: today };
  }

  if (preset === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: fmt(first), to: today };
  }

  if (preset === 'prev-month') {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: fmt(first), to: fmt(last) };
  }

  // custom or fallback: last 30 days
  const from30 = new Date(now);
  from30.setDate(now.getDate() - 29);
  return { from: fmt(from30), to: today };
}
