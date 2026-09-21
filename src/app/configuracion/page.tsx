'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Vehicle, ExpenseCategory } from '@/types';
import {
  getVehicles,
  createVehicle,
  getCategories,
  createCategory,
  updateVehicle,
  updateCategory,
} from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Toast, { ToastType } from '@/components/ui/Toast';

const APP_VERSION = '1.0.0';

interface ToastState { message: string; type: ToastType; }

export default function ConfiguracionPage() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">

        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Configuración
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Vehículos, categorías y datos
          </p>
        </div>

        <VehiclesSection showToast={showToast} />
        <CategoriesSection showToast={showToast} />
        <DataSection showToast={showToast} />
        <AppInfoSection />

      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════ VEHÍCULOS ═══════════════════════════════ */

function VehiclesSection({ showToast }: { showToast: (m: string, t?: ToastType) => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', brand: '', model: '', year: String(new Date().getFullYear()), plate: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getVehicles(true)
      .then((vs) => setVehicles(vs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleCreate() {
    if (!form.name.trim() || !form.brand.trim() || !form.model.trim() || !form.plate.trim()) {
      setFormError('Completá nombre, marca, modelo y patente.');
      return;
    }
    const year = parseInt(form.year);
    if (isNaN(year) || year < 1900) { setFormError('Año inválido.'); return; }

    setSaving(true);
    setFormError('');
    try {
      await createVehicle({ name: form.name.trim(), brand: form.brand.trim(), model: form.model.trim(), year, plate: form.plate.trim().toUpperCase() });
      setForm({ name: '', brand: '', model: '', year: String(new Date().getFullYear()), plate: '' });
      setShowForm(false);
      load();
      showToast('Vehículo agregado');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al crear vehículo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(vehicle: Vehicle) {
    setToggling(vehicle._id);
    try {
      const updated = await updateVehicle(vehicle._id, { active: !vehicle.active });
      setVehicles((items) => items.map((item) => item._id === updated._id ? updated : item));
      load();
      showToast(`Vehículo ${vehicle.active ? 'desactivado' : 'activado'}`);
    } catch {
      showToast('No se pudo actualizar el vehículo.', 'error');
    } finally {
      setToggling(null);
    }
  }

  return (
    <ConfigSection label="Vehículos">
      {loading ? (
        <Skeleton />
      ) : (
        <div className="flex flex-col gap-2">
          {vehicles.map((v) => (
            <div
              key={v._id}
              className="flex items-center justify-between px-4 py-3 rounded-2xl"
              style={{
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-subtle)',
                opacity: v.active ? 1 : 0.5,
              }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {v.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {v.brand} {v.model} · {v.year} · {v.plate}
                </p>
              </div>
              <button
                onClick={() => handleToggle(v)}
                disabled={toggling === v._id}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                style={{
                  background: v.active ? 'var(--color-surface)' : 'var(--color-info-soft)',
                  color: v.active ? 'var(--color-text-muted)' : 'var(--color-info)',
                  border: '1px solid var(--color-border)',
                  minHeight: '36px',
                }}
              >
                {toggling === v._id ? '...' : v.active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          ))}

          {showForm ? (
            <div
              className="rounded-2xl p-4 flex flex-col gap-3 mt-1"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <Input label="Nombre" placeholder="Mi Logan" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Marca" placeholder="Renault" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
                <Input label="Modelo" placeholder="Logan" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Año" type="number" inputMode="numeric" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
                <Input label="Patente" placeholder="AA123BB" value={form.plate} onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))} />
              </div>
              {formError && <p className="text-xs" style={{ color: 'var(--color-expense)' }}>{formError}</p>}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" fullWidth onClick={() => { setShowForm(false); setFormError(''); }} disabled={saving}>Cancelar</Button>
                <Button variant="primary" size="sm" fullWidth onClick={handleCreate} loading={saving}>Guardar</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm font-medium text-left px-1 mt-1"
              style={{ color: 'var(--color-accent)' }}
            >
              + Agregar vehículo
            </button>
          )}
        </div>
      )}
    </ConfigSection>
  );
}

/* ═══════════════════════════════ CATEGORÍAS ══════════════════════════════ */

function CategoriesSection({ showToast }: { showToast: (m: string, t?: ToastType) => void }) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getCategories(true)
      .then((items) => setCategories(items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleCreate() {
    if (!newName.trim()) { setCreateError('Ingresá un nombre.'); return; }
    setCreating(true);
    setCreateError('');
    try {
      await createCategory(newName.trim());
      setNewName('');
      load();
      showToast('Categoría creada');
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Error al crear categoría.');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(cat: ExpenseCategory) {
    setToggling(cat._id);
    try {
      const updated = await updateCategory(cat._id, { active: !cat.active });
      setCategories((items) => items.map((item) => item._id === updated._id ? updated : item));
      load();
      showToast(`Categoría ${cat.active ? 'desactivada' : 'activada'}`);
    } catch {
      showToast('No se pudo actualizar la categoría.', 'error');
    } finally {
      setToggling(null);
    }
  }

  return (
    <ConfigSection label="Categorías de gasto">
      {loading ? (
        <Skeleton />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                style={{
                  background: cat.active ? 'var(--color-expense-soft)' : 'var(--color-surface-elevated)',
                  border: cat.active ? '1px solid var(--color-expense-border)' : '1px solid var(--color-border-subtle)',
                  opacity: cat.active ? 1 : 0.5,
                }}
              >
                <span className="text-sm font-medium" style={{ color: cat.active ? 'var(--color-expense)' : 'var(--color-text-muted)' }}>
                  {cat.name}
                </span>
                <button
                  onClick={() => handleToggle(cat)}
                  disabled={toggling === cat._id}
                  className="text-xs"
                  style={{ color: 'var(--color-text-muted)', minHeight: '24px', minWidth: '24px' }}
                  aria-label={cat.active ? `Desactivar ${cat.name}` : `Activar ${cat.name}`}
                >
                  {toggling === cat._id ? '…' : cat.active ? '✕' : '✓'}
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-1 items-end">
            <div className="flex-1">
              <Input
                placeholder="Nueva categoría"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setCreateError(''); }}
                error={createError}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              />
            </div>
            <Button variant="primary" size="sm" onClick={handleCreate} loading={creating} style={{ height: '52px', marginBottom: createError ? '22px' : '0' }}>
              Agregar
            </Button>
          </div>
        </div>
      )}
    </ConfigSection>
  );
}

/* ═══════════════════════════════ DATOS ═══════════════════════════════════ */

function DataSection({ showToast }: { showToast: (m: string, t?: ToastType) => void }) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<null | { vehicles: number; categories: number; sessions: number; transactions: number; }>(null);
  const [importBackup, setImportBackup] = useState<null | object>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/backup/export');
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gestor-gastos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Backup exportado correctamente');
    } catch {
      showToast('No se pudo exportar el backup.', 'error');
    } finally {
      setExporting(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      // Dry run para preview
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup, mode: 'replace', dryRun: true }),
      });
      const json = await res.json();
      if (json.success) {
        setImportPreview(json.data.summary);
        setImportBackup(backup);
      } else {
        showToast(json.error || 'Backup inválido.', 'error');
      }
    } catch {
      showToast('No se pudo leer el archivo. Verificá que sea un backup válido.', 'error');
    }
    e.target.value = ''; // reset input
  }

  async function handleImport(mode: 'replace' | 'merge') {
    if (!importBackup) return;
    setImporting(true);
    try {
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup: importBackup, mode }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Backup importado: ${json.data.imported.sessions} jornadas, ${json.data.imported.transactions} movimientos`);
        setImportPreview(null);
        setImportBackup(null);
      } else {
        showToast(json.error || 'Error al importar.', 'error');
      }
    } catch {
      showToast('No se pudo importar el backup.', 'error');
    } finally {
      setImporting(false);
    }
  }

  async function handleReset() {
    if (resetConfirmText !== 'ELIMINAR') return;
    setResetting(true);
    try {
      const res = await fetch('/api/data/reset', {
        method: 'DELETE',
        headers: { 'X-Confirm-Reset': 'ELIMINAR' },
      });
      const json = await res.json();
      if (json.success) {
        showToast('Todos los datos fueron eliminados.', 'info');
        setConfirmReset(false);
        setResetConfirmText('');
      } else {
        showToast(json.error || 'Error al eliminar.', 'error');
      }
    } catch {
      showToast('No se pudieron eliminar los datos.', 'error');
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <ConfigSection label="Datos">
        <div className="flex flex-col gap-3">
          {/* Exportar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Exportar backup</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Descarga un archivo JSON con todos tus datos</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} loading={exporting}>
              Exportar
            </Button>
          </div>

          <div style={{ height: '1px', background: 'var(--color-border-subtle)' }} />

          {/* Importar */}
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>Importar backup</p>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>Seleccioná un archivo .json de backup</p>

            {!importPreview ? (
              <label
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl cursor-pointer transition-all text-sm font-medium"
                style={{
                  background: 'var(--color-surface-elevated)',
                  border: '1px dashed var(--color-border-strong)',
                  color: 'var(--color-text-secondary)',
                  minHeight: '52px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Seleccionar archivo
                <input type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
              </label>
            ) : (
              <div
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-info-border)' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--color-info)' }}>
                  Este archivo contiene:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>{importPreview.vehicles} vehículos</span>
                  <span>{importPreview.categories} categorías</span>
                  <span>{importPreview.sessions} jornadas</span>
                  <span>{importPreview.transactions} movimientos</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-warning)' }}>
                  Reemplazar eliminará todos tus datos actuales antes de importar.
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" fullWidth onClick={() => { setImportPreview(null); setImportBackup(null); }} disabled={importing}>
                    Cancelar
                  </Button>
                  <Button variant="outline" size="sm" fullWidth onClick={() => handleImport('merge')} loading={importing}>
                    Agregar
                  </Button>
                  <Button variant="danger" size="sm" fullWidth onClick={() => handleImport('replace')} loading={importing}>
                    Reemplazar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </ConfigSection>

      {/* Zona peligrosa */}
      <ConfigSection label="Zona peligrosa">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-expense)' }}>Eliminar todos los datos</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Esta acción es irreversible</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
              Eliminar
            </Button>
          </div>
        </div>
      </ConfigSection>

      {/* Dialog de confirmación de reset */}
      {confirmReset && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => { if (!resetting) { setConfirmReset(false); setResetConfirmText(''); }}} />
          <div
            className="relative z-10 w-full max-w-sm rounded-3xl p-6 animate-scale-in flex flex-col gap-4"
            style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-expense-border)' }}
          >
            <div>
              <p className="text-base font-bold" style={{ color: 'var(--color-expense)' }}>Eliminar todos los datos</p>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Esta acción eliminará permanentemente todas las jornadas, movimientos, vehículos y categorías. No se puede deshacer.
              </p>
              <p className="text-sm mt-3 font-medium" style={{ color: 'var(--color-warning)' }}>
                Antes de continuar, exportá un backup.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                Escribí ELIMINAR para confirmar
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                className="rounded-2xl px-4 py-3 text-base outline-none"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-expense)',
                  minHeight: '52px',
                }}
                disabled={resetting}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" size="md" fullWidth onClick={() => { setConfirmReset(false); setResetConfirmText(''); }} disabled={resetting}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                onClick={handleReset}
                loading={resetting}
                disabled={resetConfirmText !== 'ELIMINAR' || resetting}
              >
                Eliminar todo
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════ APP INFO ════════════════════════════════ */

function AppInfoSection() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [dbLatency, setDbLatency] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((j) => {
        setDbStatus(j.status === 'ok' ? 'ok' : 'error');
        setDbLatency(j.latencyMs ?? null);
      })
      .catch(() => setDbStatus('error'));
  }, []);

  return (
    <ConfigSection label="Aplicación">
      <div className="flex flex-col gap-3">
        <InfoRow
          label="Versión"
          value={`v${APP_VERSION}`}
        />
        <InfoRow
          label="Base de datos"
          value={
            dbStatus === 'checking'
              ? 'Verificando...'
              : dbStatus === 'ok'
              ? `Conectada${dbLatency !== null ? ` · ${dbLatency}ms` : ''}`
              : 'Sin conexión'
          }
          color={
            dbStatus === 'checking'
              ? 'var(--color-text-muted)'
              : dbStatus === 'ok'
              ? 'var(--color-income)'
              : 'var(--color-expense)'
          }
        />
      </div>
    </ConfigSection>
  );
}

/* ═══════════════════════════════ HELPERS ═════════════════════════════════ */

function ConfigSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-3xl overflow-hidden"
      style={{ border: '1px solid var(--color-border-subtle)' }}
    >
      <div
        className="px-5 py-2.5"
        style={{ background: 'var(--color-surface-elevated)', borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <span className="section-label">{label}</span>
      </div>
      <div className="px-5 py-4" style={{ background: 'var(--color-surface)' }}>
        {children}
      </div>
    </section>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: color ?? 'var(--color-text-primary)' }}>{value}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2].map((i) => (
        <div key={i} className="h-14 rounded-2xl animate-pulse-soft" style={{ background: 'var(--color-surface-elevated)' }} />
      ))}
    </div>
  );
}
