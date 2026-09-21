import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Transaction from '@/models/Transaction';
import { calculateSessionSummary } from '@/lib/calculations';
import '@/models/ExpenseCategory';

/** Recalcula y devuelve una jornada desde sus datos persistidos. No modifica movimientos. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await WorkSession.findById(id).populate({ path: 'vehicleId', model: 'Vehicle' });
    if (!session) return NextResponse.json({ success: false, error: 'Jornada no encontrada.' }, { status: 404 });

    const transactions = await Transaction.find({ sessionId: session._id })
      .populate({ path: 'category', model: 'ExpenseCategory' })
      .sort({ createdAt: -1 });
    const summary = calculateSessionSummary(session, transactions);
    return NextResponse.json({ success: true, data: { session, transactions, summary } });
  } catch (error) {
    console.error('[SESSION_REPAIR] Error:', error);
    return NextResponse.json({ success: false, error: 'No se pudo reparar la jornada.' }, { status: 503 });
  }
}
