import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Transaction from '@/models/Transaction';
import Vehicle from '@/models/Vehicle';
import ExpenseCategory from '@/models/ExpenseCategory';

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

interface BackupPayload {
  version: number;
  app?: string;
  vehicles?: unknown[];
  categories?: unknown[];
  sessions?: unknown[];
  transactions?: unknown[];
  mode?: 'replace' | 'merge';
}

/**
 * POST /api/backup/import
 * Body: { backup: BackupPayload, mode: 'replace' | 'merge' }
 *
 * mode = 'replace': elimina todos los datos actuales e importa los del backup.
 * mode = 'merge':   agrega los datos del backup sin eliminar los existentes
 *                   (útil para restaurar en base vacía, o si IDs no colisionan).
 *
 * IMPORTANTE: en 'replace', la operación es irreversible.
 * El cliente debe haber exportado un backup antes.
 */
export async function POST(request: NextRequest) {
  try {
    // Límite de tamaño
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: 'El archivo es demasiado grande (máx. 10 MB).' },
        { status: 413 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { backup, mode = 'replace' } = body as { backup: BackupPayload; mode?: string };

    // ── Validación del backup ────────────────────────────────
    if (!backup || typeof backup !== 'object') {
      return NextResponse.json(
        { success: false, error: 'El archivo de backup no es válido.' },
        { status: 400 }
      );
    }
    if (backup.version !== 1) {
      return NextResponse.json(
        { success: false, error: `Versión de backup no soportada (v${backup.version}). Solo se soporta v1.` },
        { status: 400 }
      );
    }
    if (backup.app && backup.app !== 'gestor-gastos') {
      return NextResponse.json(
        { success: false, error: 'Este backup pertenece a una aplicación diferente.' },
        { status: 400 }
      );
    }
    if (!['replace', 'merge'].includes(mode)) {
      return NextResponse.json(
        { success: false, error: 'El modo debe ser "replace" o "merge".' },
        { status: 400 }
      );
    }

    const vehicles = Array.isArray(backup.vehicles) ? backup.vehicles : [];
    const categories = Array.isArray(backup.categories) ? backup.categories : [];
    const sessions = Array.isArray(backup.sessions) ? backup.sessions : [];
    const transactions = Array.isArray(backup.transactions) ? backup.transactions : [];

    // ── Análisis previo (dry-run info) ───────────────────────
    if (body.dryRun === true) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            vehicles: vehicles.length,
            categories: categories.length,
            sessions: sessions.length,
            transactions: transactions.length,
          },
          mode,
        },
      });
    }

    // ── Importación ──────────────────────────────────────────
    if (mode === 'replace') {
      // Borrar en orden (primero transacciones, luego sesiones, luego resto)
      await Transaction.deleteMany({});
      await WorkSession.deleteMany({});
      await Vehicle.deleteMany({});
      await ExpenseCategory.deleteMany({});
    }

    // Insertar en orden correcto (vehicles y categories primero, luego sessions y transactions)
    const results = { vehicles: 0, categories: 0, sessions: 0, transactions: 0 };

    if (vehicles.length > 0) {
      try {
        await Vehicle.insertMany(vehicles, { ordered: false });
        results.vehicles = vehicles.length;
      } catch (e: unknown) {
        // En merge pueden existir duplicados — ignorar errores de duplicate key
        if (!isDuplicateKeyError(e)) throw e;
        results.vehicles = vehicles.length;
      }
    }

    if (categories.length > 0) {
      try {
        await ExpenseCategory.insertMany(categories, { ordered: false });
        results.categories = categories.length;
      } catch (e: unknown) {
        if (!isDuplicateKeyError(e)) throw e;
        results.categories = categories.length;
      }
    }

    if (sessions.length > 0) {
      try {
        await WorkSession.insertMany(sessions, { ordered: false });
        results.sessions = sessions.length;
      } catch (e: unknown) {
        if (!isDuplicateKeyError(e)) throw e;
        results.sessions = sessions.length;
      }
    }

    if (transactions.length > 0) {
      try {
        await Transaction.insertMany(transactions, { ordered: false });
        results.transactions = transactions.length;
      } catch (e: unknown) {
        if (!isDuplicateKeyError(e)) throw e;
        results.transactions = transactions.length;
      }
    }

    console.info(`[backup/import] Imported ${JSON.stringify(results)} in mode=${mode}`);

    return NextResponse.json({
      success: true,
      data: {
        imported: results,
        mode,
      },
    });
  } catch (error) {
    console.error('[backup/import] Error:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo importar el backup. Intentá nuevamente.' },
      { status: 500 }
    );
  }
}

function isDuplicateKeyError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code: number }).code === 11000
  );
}
