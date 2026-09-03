import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Transaction from '@/models/Transaction';
import { calculateSessionSummary } from '@/lib/calculations';

// CRÍTICO: importar ExpenseCategory explícitamente para que Mongoose
// registre el schema antes de que Transaction.populate('category') lo necesite.
// En serverless (Vercel) cada función corre en un proceso aislado y los modelos
// solo quedan registrados si algún archivo en la cadena de imports los importa.
// Sin este import aparece: MissingSchemaError: Schema hasn't been registered for model "ExpenseCategory"
import '@/models/ExpenseCategory';

// GET /api/sessions/active — Obtener jornada activa con transacciones y resumen
export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const session = await WorkSession.findOne({ status: 'open' }).populate('vehicleId');

    if (!session) {
      // 404 significa "no hay jornada activa" — no es un error del servidor
      return NextResponse.json(
        { success: false, error: 'No hay jornada activa' },
        { status: 404 }
      );
    }

    const transactions = await Transaction.find({ sessionId: session._id })
      .populate('category')   // requiere ExpenseCategory registrado (importado arriba)
      .sort({ createdAt: -1 });

    const summary = calculateSessionSummary(session, transactions);

    return NextResponse.json({
      success: true,
      data: { session, transactions, summary },
    });
  } catch (error) {
    console.error('[SESSION_ACTIVE] Error fetching active session:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener jornada activa' },
      { status: 500 }
    );
  }
}
