import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Transaction from '@/models/Transaction';

/**
 * GET /api/analytics/platforms
 * Query params: from, to, vehicleId
 *
 * Devuelve desglose de ingresos por plataforma (uber/didi/other/null).
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

    const sessions = await WorkSession.find(sessionFilter).lean();
    const sessionIds = sessions.map((s) => s._id);

    if (sessionIds.length === 0) {
      return NextResponse.json({ success: true, data: emptyPlatforms() });
    }

    const transactions = await Transaction.find({
      sessionId: { $in: sessionIds },
      type: 'income',
    }).lean();

    const totals: Record<string, number> = { uber: 0, didi: 0, other: 0 };
    let grandTotal = 0;

    for (const t of transactions) {
      const key = t.platform ?? 'other';
      totals[key] = (totals[key] ?? 0) + t.amount;
      grandTotal += t.amount;
    }

    const platforms = ['uber', 'didi', 'other'].map((key) => ({
      platform: key,
      label: key === 'uber' ? 'Uber' : key === 'didi' ? 'DiDi' : 'Otro',
      total: totals[key] ?? 0,
      percentage: grandTotal > 0 ? Math.round(((totals[key] ?? 0) / grandTotal) * 100) : 0,
    }));

    return NextResponse.json({ success: true, data: { platforms, grandTotal } });
  } catch (error) {
    console.error('Error fetching platforms analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener análisis de plataformas' },
      { status: 500 }
    );
  }
}

function emptyPlatforms() {
  return {
    platforms: [
      { platform: 'uber', label: 'Uber', total: 0, percentage: 0 },
      { platform: 'didi', label: 'DiDi', total: 0, percentage: 0 },
      { platform: 'other', label: 'Otro', total: 0, percentage: 0 },
    ],
    grandTotal: 0,
  };
}
