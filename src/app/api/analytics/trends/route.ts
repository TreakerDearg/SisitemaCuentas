import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Transaction from '@/models/Transaction';

/**
 * GET /api/analytics/trends
 * Query params: from, to, vehicleId
 *
 * Devuelve resultado neto por jornada ordenado cronológicamente.
 * Cada punto: { date, income, expense, net, distance, sessionId }
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const vehicleId = searchParams.get('vehicleId');

    const sessionFilter: Record<string, unknown> = { status: 'closed' };
    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = toDate;
      }
      sessionFilter.date = dateFilter;
    }
    if (vehicleId) sessionFilter.vehicleId = vehicleId;

    const sessions = await WorkSession.find(sessionFilter)
      .sort({ date: 1 })
      .lean();

    if (sessions.length === 0) {
      return NextResponse.json({ success: true, data: { points: [] } });
    }

    const sessionIds = sessions.map((s) => s._id);
    const transactions = await Transaction.find({ sessionId: { $in: sessionIds } }).lean();

    // Build a map sessionId -> { income, expense }
    const txMap = new Map<string, { income: number; expense: number }>();
    for (const t of transactions) {
      const key = String(t.sessionId);
      if (!txMap.has(key)) txMap.set(key, { income: 0, expense: 0 });
      if (t.type === 'income') txMap.get(key)!.income += t.amount;
      else txMap.get(key)!.expense += t.amount;
    }

    const points = sessions.map((s) => {
      const { income = 0, expense = 0 } = txMap.get(String(s._id)) ?? {};
      const distance = (s.finalKm ?? 0) > s.initialKm ? (s.finalKm ?? 0) - s.initialKm : 0;
      return {
        sessionId: String(s._id),
        date: s.date,
        income,
        expense,
        net: income - expense,
        distance,
      };
    });

    // También calcular el período anterior para comparación
    let previousPeriodNet: number | null = null;
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const periodMs = toDate.getTime() - fromDate.getTime();

      const prevTo = new Date(fromDate.getTime() - 1);
      const prevFrom = new Date(fromDate.getTime() - periodMs - 1);

      const prevSessions = await WorkSession.find({
        status: 'closed',
        date: { $gte: prevFrom, $lte: prevTo },
        ...(vehicleId ? { vehicleId } : {}),
      }).lean();

      if (prevSessions.length > 0) {
        const prevIds = prevSessions.map((s) => s._id);
        const prevTx = await Transaction.find({ sessionId: { $in: prevIds } }).lean();
        let prevIncome = 0;
        let prevExpense = 0;
        for (const t of prevTx) {
          if (t.type === 'income') prevIncome += t.amount;
          else prevExpense += t.amount;
        }
        previousPeriodNet = prevIncome - prevExpense;
      }
    }

    return NextResponse.json({
      success: true,
      data: { points, previousPeriodNet },
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener tendencias' },
      { status: 500 }
    );
  }
}
