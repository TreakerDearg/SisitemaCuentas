import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Transaction from '@/models/Transaction';
import { calculateSessionSummary } from '@/lib/calculations';

// GET /api/sessions/:id - Obtener jornada específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const session = await WorkSession.findById(id).populate('vehicleId');

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Jornada no encontrada' },
        { status: 404 }
      );
    }

    const transactions = await Transaction.find({ sessionId: session._id })
      .populate('category')
      .sort({ createdAt: -1 });

    const summary = calculateSessionSummary(session, transactions);

    return NextResponse.json({
      success: true,
      data: { session, transactions, summary },
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener jornada' },
      { status: 500 }
    );
  }
}
