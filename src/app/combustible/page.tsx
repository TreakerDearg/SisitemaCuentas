'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ActiveSessionData, Transaction, Vehicle } from '@/types';
import { getActiveSession, getVehicles } from '@/lib/api';
import { formatCurrency, formatKm, formatDateShort, formatTime } from '@/lib/format';
import ThemeToggle from '@/components/ui/ThemeToggle';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import FuelKmModal from '@/components/fuel/FuelKmModal';
import Link from 'next/link';

export default function CombustiblePage() {
  const [activeData, setActiveData] = useState<ActiveSessionData | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelTxs, setFuelTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [active, vs, resTxs] = await Promise.all([
        getActiveSession().catch(() => null),
        getVehicles().catch(() => []),
        fetch('/api/transactions?type=expense&limit=50')
          .then((r) => r.json())
          .then((j) => (j.success ? (j.data as Transaction[]) : []))
          .catch(() => []),
      ]);

      setActiveData(active);
      setVehicles(vs);

      // Filtrar solo los gastos de combustible
      const fuels = resTxs.filter((t) => {
        const catName = t.category?.name ?? '';
        return /combustible|nafta|gnc|gas/i.test(catName) || /combustible/i.test(t.description ?? '');
      });
      setFuelTxs(fuels);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Odómetro más reciente conocido
  const latestKm =
    fuelTxs.find((t) => t.km && t.km > 0)?.km ??
    activeData?.session.finalKm ??
    activeData?.session.initialKm ??
    0;

  // Cálculos agregados de rendimiento
  const { totalSpent, avgCostPerKm, validLoadsCount } = (() => {
    let spent = 0;
    let totalKmDeltas = 0;
    let count = 0;

    for (let i = 0; i < fuelTxs.length; i++) {
      spent += fuelTxs[i].amount;
      const current = fuelTxs[i].km;
      const nextOlder = fuelTxs[i + 1]?.km ?? (i === fuelTxs.length - 1 ? activeData?.session.initialKm : null);
      if (current && nextOlder && current > nextOlder) {
        totalKmDeltas += current - nextOlder;
        count++;
      }
    }

    const avgCost = totalKmDeltas > 0 ? spent / totalKmDeltas : null;
    return { totalSpent: spent, avgCostPerKm: avgCost, validLoadsCount: count };
  })();

  function handleSaved(tx: Transaction) {
    setModalOpen(false);
    setFuelTxs((prev) => [tx, ...prev]);
    void loadData();
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-bold"
              style={{
                background: 'var(--color-warning-soft)',
                border: '1px solid var(--color-warning-border)',
                color: 'var(--color-warning)',
              }}
            >
              ⛽
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                Combustible & KM
              </h1>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Control de odómetro y rendimiento
              </p>
            </div>
          </div>

          <ThemeToggle />
        </div>

        {/* ── Tarjeta Odómetro & Vehículo ── */}
        <section
          className="rounded-3xl p-5 flex flex-col gap-4"
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="section-label">Odómetro del vehículo</span>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-xl"
              style={{
                background: 'var(--color-surface-elevated)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              🚗 {vehicles[0]?.name ?? 'Vehículo'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tabular" style={{ color: 'var(--color-text-primary)' }}>
              {latestKm > 0 ? formatKm(latestKm) : '—'}
            </span>
            <span className="text-lg font-bold" style={{ color: 'var(--color-text-muted)' }}>
              km
            </span>
          </div>

          {/* Desglose rápido de rendimiento */}
          <div
            className="grid grid-cols-2 gap-3 pt-3 border-t"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <div>
              <p className="section-label">Costo estimado</p>
              <p className="text-lg font-extrabold tabular" style={{ color: 'var(--color-text-primary)' }}>
                {avgCostPerKm !== null ? `$${avgCostPerKm.toFixed(1)}/km` : '—'}
              </p>
            </div>
            <div>
              <p className="section-label">Gasto registrado</p>
              <p className="text-lg font-extrabold tabular" style={{ color: 'var(--color-expense)' }}>
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </div>

          {/* Botón CTA Cargar Combustible */}
          {activeData ? (
            <Button
              variant="primary"
              size="xl"
              fullWidth
              onClick={() => setModalOpen(true)}
              className="mt-1 font-bold shadow-md"
            >
              ⛽ Registrar carga & actualizar KM
            </Button>
          ) : (
            <div
              className="rounded-2xl p-3 text-center flex flex-col gap-2"
              style={{
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                Iniciá una jornada para registrar cargas de combustible en vivo.
              </p>
              <Link
                href="/"
                className="py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-white active:scale-95 mx-auto"
                style={{ background: 'var(--color-income-solid)' }}
              >
                Ir a Iniciar Jornada →
              </Link>
            </div>
          )}
        </section>

        {/* ── Historial de Cargas ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="section-label">Historial de cargas</span>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-bold tabular"
              style={{
                background: 'var(--color-surface-elevated)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {fuelTxs.length}
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Cargando historial…
            </div>
          ) : fuelTxs.length === 0 ? (
            <div
              className="rounded-3xl p-8 text-center flex flex-col items-center gap-3"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <span className="text-3xl">⛽</span>
              <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                No hay cargas de combustible registradas
              </p>
              <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Cada vez que cargues nafta o GNC, registrá el odómetro para conocer el costo exacto por kilómetro.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {fuelTxs.map((tx, idx) => {
                const nextOlder = fuelTxs[idx + 1]?.km ?? (idx === fuelTxs.length - 1 ? activeData?.session.initialKm : null);
                const delta = tx.km && nextOlder && tx.km > nextOlder ? tx.km - nextOlder : null;
                const costKm = delta && delta > 0 ? tx.amount / delta : null;
                const kmL = delta && tx.liters && tx.liters > 0 ? delta / tx.liters : null;

                return (
                  <div
                    key={tx._id}
                    className="rounded-2xl p-4 flex flex-col gap-2 transition-colors"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⛽</span>
                        <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          {formatCurrency(tx.amount)}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: tx.paymentMethod === 'cash' ? 'var(--color-income-soft)' : 'var(--color-transfer-soft)',
                            color: tx.paymentMethod === 'cash' ? 'var(--color-income)' : 'var(--color-transfer)',
                          }}
                        >
                          {tx.paymentMethod === 'cash' ? 'Efectivo' : 'Transf.'}
                        </span>
                      </div>

                      <span className="text-xs font-semibold tabular" style={{ color: 'var(--color-text-muted)' }}>
                        {formatDateShort(tx.createdAt)} · {formatTime(tx.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}>
                      <div>
                        {tx.km ? (
                          <span className="tabular font-bold">Odómetro: {formatKm(tx.km)} km</span>
                        ) : (
                          <span>Carga inicial</span>
                        )}
                        {delta && delta > 0 && (
                          <span className="ml-2 font-extrabold text-[var(--color-income)] tabular">
                            (+{formatKm(delta)} km)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {costKm !== null && (
                          <span className="tabular font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
                            ${costKm.toFixed(1)}/km
                          </span>
                        )}
                        {kmL !== null && (
                          <span className="tabular font-bold" style={{ color: 'var(--color-income)' }}>
                            {kmL.toFixed(1)} km/L
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* ── Modal de Carga de Combustible ── */}
      {activeData && (
        <BottomSheet
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Cargar combustible & KM"
        >
          <FuelKmModal
            session={activeData.session}
            lastKm={latestKm || activeData.session.initialKm}
            onSaved={handleSaved}
            onCancel={() => setModalOpen(false)}
          />
        </BottomSheet>
      )}
    </div>
  );
}
