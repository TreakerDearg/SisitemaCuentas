'use client';

import { useState, useEffect, useCallback } from 'react';
import { getActiveSession, getSessionsHistory } from '@/lib/api';
import { formatCurrency, formatTime, formatDateShort } from '@/lib/format';
import NoSession from '@/components/session/NoSession';
import StartSessionForm from '@/components/session/StartSessionForm';
import ActiveSession from '@/components/session/ActiveSession';
import SessionSummary from '@/components/session/SessionSummary';
import BottomSheet from '@/components/ui/BottomSheet';

/**
 * Estados de la aplicación:
 *   loading      — consultando MongoDB (no mostrar nada todavía)
 *   recover      — hay jornada activa: mostrar modal "¿Continuar?"
 *   active       — jornada en curso (pantalla principal)
 *   no-session   — confirmado que NO hay jornada activa
 *   closed       — jornada recién cerrada (resumen)
 *   error        — error de red/DB (no se sabe si hay jornada)
 */
export default function Home() {
  const [appState, setAppState] = useState('loading');
  const [activeData, setActiveData] = useState(null);
  const [closedData, setClosedData] = useState(null);
  const [lastSession, setLastSession] = useState(null);
  const [showStartForm, setShowStartForm] = useState(false);
  const [initError, setInitError] = useState('');

  const loadInitialState = useCallback(async () => {
    setAppState('loading');
    setInitError('');
    try {
      const active = await getActiveSession();
      if (active) {
        setActiveData(active);
        // Mostrar modal de recuperación en lugar de entrar directo
        setAppState('recover');
        return;
      }
      try {
        const { data } = await getSessionsHistory({ status: 'closed', limit: 1 });
        if (data && data.length > 0) setLastSession(data[0]);
      } catch { /* no crítico */ }
      setAppState('no-session');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo conectar al servidor.';
      setInitError(message);
      setAppState('error');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      loadInitialState().catch(() => {
        if (!cancelled) setAppState('error');
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loadInitialState]);

  /* ── Handlers ── */

  function handleContinueSession() {
    setAppState('active');
  }

  function handleSessionStarted(session) {
    setActiveData({
      session,
      transactions: [],
      summary: {
        totalIncome: 0, totalExpense: 0, netResult: 0,
        cashIncome: 0, cashExpense: 0,
        expectedCash: session.initialCash,
        transferIncome: 0, transferExpense: 0, distance: 0,
      },
    });
    setShowStartForm(false);
    setAppState('active');
  }

  function handleDataChange(newData) { setActiveData(newData); }

  function handleSessionClosed(session, actualCash) {
    setClosedData({
      data: { ...activeData, session: { ...activeData.session, ...session } },
      actualCash,
    });
    setActiveData(null);
    setAppState('closed');
  }

  function handleRestart() {
    setClosedData(null);
    setLastSession(null);
    loadInitialState();
  }

  /* ── Renderizado ── */

  if (appState === 'loading') {
    return <LoadingScreen />;
  }

  if (appState === 'error') {
    return <ErrorScreen message={initError} onRetry={loadInitialState} />;
  }

  // Modal de recuperación: el usuario vuelve con una jornada activa
  if (appState === 'recover' && activeData) {
    return <RecoverScreen data={activeData} onContinue={handleContinueSession} />;
  }

  if (appState === 'closed' && closedData) {
    return (
      <SessionSummary
        data={closedData.data}
        actualCash={closedData.actualCash}
        onRestart={handleRestart}
      />
    );
  }

  if (appState === 'active' && activeData) {
    return (
      <ActiveSession
        data={activeData}
        onDataChange={handleDataChange}
        onSessionClosed={handleSessionClosed}
      />
    );
  }

  // no-session — confirmado por el backend (404)
  return (
    <>
      <NoSession lastSession={lastSession} onStart={() => setShowStartForm(true)} />
      <BottomSheet
        open={showStartForm}
        onClose={() => setShowStartForm(false)}
        title="Nueva jornada"
      >
        <StartSessionForm
          onSessionStarted={handleSessionStarted}
          onActiveSessionFound={(data) => {
            setActiveData(data);
            setShowStartForm(false);
            setAppState('active');
          }}
        />
      </BottomSheet>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   PANTALLA DE RECUPERACIÓN DE JORNADA
   Se muestra cuando se detecta una jornada activa al abrir la app
   ══════════════════════════════════════════════════════════ */
function RecoverScreen({ data, onContinue }) {
  const { session, summary } = data;

  const vehicleName =
    typeof session.vehicleId === 'object' && session.vehicleId !== null
      ? session.vehicleId.name ?? ''
      : '';

  const netColor =
    summary.netResult > 0
      ? 'var(--color-income)'
      : summary.netResult < 0
      ? 'var(--color-expense)'
      : 'var(--color-text-primary)';

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-5 py-10"
      style={{ background: 'var(--color-background)' }}
    >
      <div className="w-full max-w-sm flex flex-col gap-5 animate-fade-in">

        {/* Badge de estado */}
        <div className="flex justify-center">
          <span className="badge-active">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse-soft"
              style={{ background: 'var(--color-income)' }}
            />
            Jornada activa
          </span>
        </div>

        {/* Título */}
        <div className="text-center">
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Tenés una jornada abierta
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {formatDateShort(session.date)}
            {' · '}
            Inicio: {formatTime(session.startTime)}
          </p>
        </div>

        {/* Resumen de la jornada */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{ border: '1px solid var(--color-border-subtle)' }}
        >
          {/* Caja */}
          <div
            className="px-5 py-5 text-center"
            style={{
              background: 'var(--color-surface)',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            <p className="section-label mb-1">Caja esperada</p>
            <p
              className="text-4xl font-bold tabular"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {formatCurrency(summary.expectedCash)}
            </p>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 divide-x"
            style={{
              background: 'var(--color-surface-elevated)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <StatCell
              label="Ingresos"
              value={formatCurrency(summary.totalIncome)}
              color="var(--color-income)"
            />
            <StatCell
              label="Gastos"
              value={formatCurrency(summary.totalExpense)}
              color="var(--color-expense)"
            />
            <StatCell
              label="Resultado"
              value={formatCurrency(summary.netResult)}
              color={netColor}
            />
          </div>

          {/* Vehículo */}
          {vehicleName && (
            <div
              className="flex items-center justify-center gap-2 px-5 py-3"
              style={{
                background: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border-subtle)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17a2 2 0 0 0 4 0M15 17a2 2 0 0 0 4 0"
                  stroke="var(--color-text-muted)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {vehicleName}
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl text-base font-bold transition-all"
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
            minHeight: '60px',
          }}
        >
          Continuar jornada →
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          Tus datos se guardaron correctamente
        </p>
      </div>
    </div>
  );
}

function StatCell({ label, value, color }) {
  return (
    <div className="flex flex-col items-center py-3 px-2 gap-0.5">
      <span className="section-label text-center">{label}</span>
      <span
        className="text-sm font-bold tabular text-center"
        style={{ color: color ?? 'var(--color-text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PANTALLAS AUXILIARES
   ══════════════════════════════════════════════════════════ */
function LoadingScreen() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: '80dvh', background: 'var(--color-background)' }}
    >
      <div className="flex flex-col items-center gap-4">
        <svg
          className="animate-spin"
          width="36" height="36"
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Cargando"
          role="img"
        >
          <circle cx="12" cy="12" r="10" stroke="var(--color-border)" strokeWidth="3" />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="var(--color-accent)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Cargando jornada...
        </p>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div
      className="flex items-center justify-center px-6"
      style={{ minHeight: '80dvh', background: 'var(--color-background)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4 text-center"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'var(--color-warning-soft)' }}
          aria-hidden="true"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              stroke="var(--color-warning)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            No se pudo conectar
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            No pudimos verificar si tenés una jornada activa. Revisá tu conexión e intentá nuevamente.
          </p>
          {message && (
            <p className="text-xs mt-2 font-mono" style={{ color: 'var(--color-text-muted)' }}>
              {message}
            </p>
          )}
        </div>
        <button
          onClick={onRetry}
          className="w-full py-3 rounded-2xl text-sm font-semibold"
          style={{ background: 'var(--color-accent)', color: '#fff', minHeight: '48px' }}
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
