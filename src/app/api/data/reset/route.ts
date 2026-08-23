import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Transaction from '@/models/Transaction';
import Vehicle from '@/models/Vehicle';
import ExpenseCategory from '@/models/ExpenseCategory';

/**
 * DELETE /api/data/reset
 * Elimina TODOS los datos de la aplicación.
 *
 * Requiere header de confirmación para prevenir llamadas accidentales:
 *   X-Confirm-Reset: ELIMINAR
 *
 * Esta operación es IRREVERSIBLE. El cliente debe haber exportado
 * un backup antes de llamar a este endpoint.
 */
export async function DELETE(request: NextRequest) {
  const confirmation = request.headers.get('x-confirm-reset');

  if (confirmation !== 'ELIMINAR') {
    return NextResponse.json(
      {
        success: false,
        error: 'Se requiere confirmación explícita. Enviá el header X-Confirm-Reset: ELIMINAR',
      },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Eliminar en orden seguro
    const [txResult, sessResult, vehResult, catResult] = await Promise.all([
      Transaction.deleteMany({}),
      WorkSession.deleteMany({}),
      Vehicle.deleteMany({}),
      ExpenseCategory.deleteMany({}),
    ]);

    console.info('[data/reset] All data deleted:', {
      transactions: txResult.deletedCount,
      sessions: sessResult.deletedCount,
      vehicles: vehResult.deletedCount,
      categories: catResult.deletedCount,
    });

    return NextResponse.json({
      success: true,
      data: {
        deleted: {
          transactions: txResult.deletedCount,
          sessions: sessResult.deletedCount,
          vehicles: vehResult.deletedCount,
          categories: catResult.deletedCount,
        },
      },
    });
  } catch (error) {
    console.error('[data/reset] Error:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudieron eliminar los datos. Intentá nuevamente.' },
      { status: 500 }
    );
  }
}
