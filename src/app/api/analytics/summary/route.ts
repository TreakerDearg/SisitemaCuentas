import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Transaction from '@/models/Transaction';

/**
 * GET /api/analytics/summary
 * Query params: from, to (ISO dates), vehicleId (optional)
 *
 * Devuelve métricas agregadas del período:
 * sessions, income, expense, net, distance, hours,
 * incomePerHour, netPerHour, incomePerKm, netPerKm,
 * averageIncome, averageExpense, averageNet
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const vehicleId = searchParams.get('vehicleId');

    // Build session filter
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

    const sessions = await WorkSession.find(sessionFilter).lean();

    if (sessions.length === 0) {
      return NextResponse.json({
        success: true,
        data: emptyMetrics(),
      });
    }

    const sessionIds = sessions.map((s) => s._id);
    const transactions = await Transaction.find({ sessionId: { $in: sessionIds } }).lean();

    // Aggregate
    let totalIncome = 0;
    let totalExpense = 0;
    let totalDistance = 0;
    let totalHours = 0;

    for (const s of sessions) {
      const km = (s.finalKm ?? 0) - s.initialKm;
      if (km > 0) totalDistance += km;

      if (s.endTime && s.startTime) {
        const diffMs = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        if (diffMs > 0) totalHours += diffMs / 3_600_000;
      }
    }

    for (const t of transactions) {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;
    }

    const netResult = totalIncome - totalExpense;
    const count = sessions.length;

    const incomePerHour = totalHours > 0 ? totalIncome / totalHours : null;
    const netPerHour = totalHours > 0 ? netResult / totalHours : null;
    const incomePerKm = totalDistance > 0 ? totalIncome / totalDistance : null;
    const netPerKm = totalDistance > 0 ? netResult / totalDistance : null;

    return NextResponse.json({
      success: true,
      data: {
        sessions: count,
        income: round(totalIncome),
        expense: round(totalExpense),
        net: round(netResult),
        distance: round(totalDistance),
        hours: round(totalHours, 2),
        incomePerHour: incomePerHour !== null ? round(incomePerHour) : null,
        netPerHour: netPerHour !== null ? round(netPerHour) : null,
        incomePerKm: incomePerKm !== null ? round(incomePerKm, 2) : null,
        netPerKm: netPerKm !== null ? round(netPerKm, 2) : null,
        averageIncome: count > 0 ? round(totalIncome / count) : null,
        averageExpense: count > 0 ? round(totalExpense / count) : null,
        averageNet: count > 0 ? round(netResult / count) : null,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el resumen' },
      { status: 500 }
    );
  }
}

function round(n: number, decimals = 0) {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

function emptyMetrics() {
  return {
    sessions: 0,
    income: 0,
    expense: 0,
    net: 0,
    distance: 0,
    hours: 0,
    incomePerHour: null,
    netPerHour: null,
    incomePerKm: null,
    netPerKm: null,
    averageIncome: null,
    averageExpense: null,
    averageNet: null,
  };
}
