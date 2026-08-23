import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Vehicle from '@/models/Vehicle';
import Transaction from '@/models/Transaction';
import { calculateSessionSummary } from '@/lib/calculations';

// GET /api/sessions/active - Obtener jornada activa con resumen
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await WorkSession.findOne({ status: 'open' }).populate(
      'vehicleId'
    );

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No hay jornada activa' },
        { status: 404 }
      );
    }

    const transactions = await Transaction.find({ sessionId: session._id })
      .populate('category')
      .sort({ createdAt: -1 });

    const summary = calculateSessionSummary(session, transactions);

    return NextResponse.json({
      success: true,
      data: {
        session,
        transactions,
        summary,
      },
    });
  } catch (error) {
    console.error('Error fetching active session:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener jornada activa' },
      { status: 500 }
    );
  }
}
