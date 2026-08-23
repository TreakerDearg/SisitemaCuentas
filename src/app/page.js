'use client';

import { useState, useEffect, useCallback } from 'react';
import { getActiveSession, getSessionsHistory } from '@/lib/api';
import NoSession from '@/components/session/NoSession';
import StartSessionForm from '@/components/session/StartSessionForm';
import ActiveSession from '@/components/session/ActiveSession';
import SessionSummary from '@/components/session/SessionSummary';
import BottomSheet from '@/components/ui/BottomSheet';

/**
 * Estados de la aplicación:
 *   loading      — consultando API al arrancar
 *   no-session   — sin jornada activa
 *   active       — jornada abierta en curso
 *   closed       — jornada recién cerrada (muestra resumen)
 */
export default function Home() {
  const [appState, setAppState] = useState('loading');
  const [activeData, setActiveData] = useState(null);
  const [closedData, setClosedData] = useState(null);
  const [lastSession, setLastSession] = useState(null);
  const [showStartForm, setShowStartForm] = useState(false);

  const loadInitialState = useCallback(async () => {
    setAppState('loading');
    try {
      const active = await getActiveSession();
      if (active) {
        setActiveData(active);
        setAppState('active');
        return;
      }
      // Sin jornada activa: cargar la última jornada cerrada para NoSession
      try {
        const { data } = await getSessionsHistory({ status: 'closed', limit: 1 });
        if (data.length > 0) setLastSession(data[0]);
      } catch {
        // no crítico — la pantalla de inicio sigue funcionando sin esto
      }
      setAppState('no-session');
    } catch {
      setAppState('no-session');
    }
  }, []);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

  /* ── Handlers ── */

  function handleSessionStarted(session) {
    setActiveData({
      session,
      transactions: [],
      summary: {
        totalIncome: 0,
        totalExpense: 0,
        netResult: 0,
        cashIncome: 0,
        cashExpense: 0,
        expectedCash: session.initialCash,
        transferIncome: 0,
        transferExpense: 0,
        distance: 0,
      },
    });
    setShowStartForm(false);
    setAppState('active');
  }

  function handleDataChange(newData) {
    setActiveData(newData);
  }

  function handleSessionClosed(session, actualCash) {
    setClosedData({
      data: {
        ...activeData,
        session: { ...activeData.session, ...session },
      },
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
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: '80dvh', background: 'var(--color-background)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Cargando jornada...
          </p>
        </div>
      </div>
    );
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

  // no-session (default)
  return (
    <>
      <NoSession
        lastSession={lastSession}
        onStart={() => setShowStartForm(true)}
      />
      <BottomSheet
        open={showStartForm}
        onClose={() => setShowStartForm(false)}
        title="Nueva jornada"
      >
        <StartSessionForm onSessionStarted={handleSessionStarted} />
      </BottomSheet>
    </>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width="36"
      height="36"
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
  );
}
