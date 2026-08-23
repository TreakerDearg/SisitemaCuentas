'use client';

import { useState } from 'react';
import type { Vehicle } from '@/types';
import { createVehicle } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedId: string;
  onChange: (id: string) => void;
  onVehicleCreated: (vehicle: Vehicle) => void;
  error?: string;
}

export default function VehicleSelector({
  vehicles,
  selectedId,
  onChange,
  onVehicleCreated,
  error,
}: VehicleSelectorProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    name: '',
    brand: '',
    model: '',
    year: String(new Date().getFullYear()),
    plate: '',
  });

  function setField(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.brand.trim() || !form.model.trim() || !form.plate.trim()) {
      setFormError('Completá nombre, marca, modelo y patente.');
      return;
    }
    const year = parseInt(form.year);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      setFormError('Año inválido.');
      return;
    }

    setLoading(true);
    setFormError('');
    try {
      const vehicle = await createVehicle({
        name: form.name.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        year,
        plate: form.plate.trim().toUpperCase(),
      });
      onVehicleCreated(vehicle);
      onChange(vehicle._id);
      setShowForm(false);
      setForm({ name: '', brand: '', model: '', year: String(new Date().getFullYear()), plate: '' });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'No se pudo crear el vehículo.');
    } finally {
      setLoading(false);
    }
  }

  // Sin vehículos y sin formulario
  if (vehicles.length === 0 && !showForm) {
    return (
      <div className="flex flex-col gap-3">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Vehículo
        </span>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            No tenés vehículos registrados.
          </p>
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            + Agregar vehículo
          </Button>
        </div>
        {error && (
          <p className="text-xs" style={{ color: 'var(--color-negative)' }} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Vehículo
      </span>

      {/* Lista de vehículos */}
      {vehicles.length > 0 && !showForm && (
        <div className="flex flex-col gap-2">
          {vehicles.map((v) => {
            const selected = v._id === selectedId;
            return (
              <button
                key={v._id}
                type="button"
                onClick={() => onChange(v._id)}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all"
                style={{
                  background: selected ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                  border: selected
                    ? '1px solid var(--color-accent)'
                    : '1px solid var(--color-border)',
                  minHeight: '60px',
                }}
                aria-pressed={selected}
              >
                <div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: selected ? 'var(--color-accent-hover)' : 'var(--color-text-primary)' }}
                  >
                    {v.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                    {v.brand} {v.model} · {v.year} · {v.plate}
                  </p>
                </div>
                {selected && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="10" cy="10" r="9" fill="var(--color-accent)" />
                    <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs text-left px-1 py-1 transition-colors"
            style={{ color: 'var(--color-accent)' }}
          >
            + Agregar otro vehículo
          </button>
        </div>
      )}

      {error && !showForm && (
        <p className="text-xs" style={{ color: 'var(--color-negative)' }} role="alert">
          {error}
        </p>
      )}

      {/* Formulario de nuevo vehículo */}
      {showForm && (
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Nuevo vehículo
          </p>

          <Input
            label="Nombre"
            placeholder="Ej: Mi Logan"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Marca"
              placeholder="Renault"
              value={form.brand}
              onChange={(e) => setField('brand', e.target.value)}
            />
            <Input
              label="Modelo"
              placeholder="Logan"
              value={form.model}
              onChange={(e) => setField('model', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Año"
              type="number"
              inputMode="numeric"
              placeholder="2020"
              value={form.year}
              onChange={(e) => setField('year', e.target.value)}
            />
            <Input
              label="Patente"
              placeholder="AA123BB"
              value={form.plate}
              onChange={(e) => setField('plate', e.target.value)}
            />
          </div>

          {formError && (
            <p className="text-xs" style={{ color: 'var(--color-negative)' }} role="alert">
              {formError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => { setShowForm(false); setFormError(''); }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleCreate}
              loading={loading}
            >
              Crear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
