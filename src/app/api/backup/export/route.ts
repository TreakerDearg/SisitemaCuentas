import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Transaction from '@/models/Transaction';
import Vehicle from '@/models/Vehicle';
import ExpenseCategory from '@/models/ExpenseCategory';

/**
 * GET /api/backup/export
 * Genera un backup completo de todos los datos del usuario.
 * No incluye credenciales, URIs ni información sensible del servidor.
 */
export async function GET() {
  try {
    await connectDB();

    const [vehicles, categories, sessions, transactions] = await Promise.all([
      Vehicle.find().lean(),
      ExpenseCategory.find().lean(),
      WorkSession.find().sort({ date: -1 }).lean(),
      Transaction.find().sort({ createdAt: -1 }).lean(),
    ]);

    const backup = {
      version: 1,
      app: 'gestor-gastos',
      createdAt: new Date().toISOString(),
      summary: {
        vehicles: vehicles.length,
        categories: categories.length,
        sessions: sessions.length,
        transactions: transactions.length,
      },
      vehicles,
      categories,
      sessions,
      transactions,
    };

    const filename = `gestor-gastos-backup-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[backup/export] Error:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo generar el backup. Intentá nuevamente.' },
      { status: 500 }
    );
  }
}
