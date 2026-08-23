import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Transaction from '@/models/Transaction';
import ExpenseCategory from '@/models/ExpenseCategory';

/**
 * GET /api/analytics/expenses
 * Query params: from, to, vehicleId
 *
 * Devuelve gastos agrupados por categoría, ordenados de mayor a menor.
 * También devuelve la categoría top y el total.
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
      return NextResponse.json({ success: true, data: { categories: [], total: 0, topCategory: null } });
    }

    const expenses = await Transaction.find({
      sessionId: { $in: sessionIds },
      type: 'expense',
    })
      .populate('category')
      .lean();

    const categoryMap = new Map<string, { name: string; total: number }>();
    let grandTotal = 0;

    for (const t of expenses) {
      grandTotal += t.amount;
      const catName =
        t.category && typeof t.category === 'object' && 'name' in t.category
          ? (t.category as { name: string }).name
          : 'Sin categoría';
      const catId =
        t.category && typeof t.category === 'object' && '_id' in t.category
          ? String((t.category as { _id: unknown })._id)
          : 'uncategorized';

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { name: catName, total: 0 });
      }
      categoryMap.get(catId)!.total += t.amount;
    }

    const categories = Array.from(categoryMap.entries())
      .map(([id, { name, total }]) => ({
        id,
        name,
        total,
        percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const topCategory = categories.length > 0 ? categories[0] : null;

    return NextResponse.json({
      success: true,
      data: { categories, total: grandTotal, topCategory },
    });
  } catch (error) {
    console.error('Error fetching expenses analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener análisis de gastos' },
      { status: 500 }
    );
  }
}
