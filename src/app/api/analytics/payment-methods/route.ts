import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Transaction from '@/models/Transaction';

/**
 * GET /api/analytics/payment-methods
 * Query params: from, to, vehicleId
 *
 * Devuelve desglose de ingresos por método de pago (cash/transfer/other).
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
      return NextResponse.json({ success: true, data: emptyPaymentMethods() });
    }

    // Ingresos por método
    const incomeTransactions = await Transaction.find({
      sessionId: { $in: sessionIds },
      type: 'income',
    }).lean();

    const incomeTotals: Record<string, number> = { cash: 0, transfer: 0, other: 0 };
    let incomeGrandTotal = 0;
    for (const t of incomeTransactions) {
      incomeTotals[t.paymentMethod] = (incomeTotals[t.paymentMethod] ?? 0) + t.amount;
      incomeGrandTotal += t.amount;
    }

    // Gastos por método
    const expenseTransactions = await Transaction.find({
      sessionId: { $in: sessionIds },
      type: 'expense',
    }).lean();

    const expenseTotals: Record<string, number> = { cash: 0, transfer: 0, other: 0 };
    let expenseGrandTotal = 0;
    for (const t of expenseTransactions) {
      expenseTotals[t.paymentMethod] = (expenseTotals[t.paymentMethod] ?? 0) + t.amount;
      expenseGrandTotal += t.amount;
    }

    const methods = ['cash', 'transfer', 'other'].map((key) => ({
      method: key,
      label: key === 'cash' ? 'Efectivo' : key === 'transfer' ? 'Transferencia' : 'Otro',
      incomeTotal: incomeTotals[key] ?? 0,
      expenseTotal: expenseTotals[key] ?? 0,
      incomePercentage:
        incomeGrandTotal > 0
          ? Math.round(((incomeTotals[key] ?? 0) / incomeGrandTotal) * 100)
          : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        methods,
        incomeGrandTotal,
        expenseGrandTotal,
      },
    });
  } catch (error) {
    console.error('Error fetching payment methods analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener análisis de métodos de pago' },
      { status: 500 }
    );
  }
}

function emptyPaymentMethods() {
  return {
    methods: [
      { method: 'cash', label: 'Efectivo', incomeTotal: 0, expenseTotal: 0, incomePercentage: 0 },
      { method: 'transfer', label: 'Transferencia', incomeTotal: 0, expenseTotal: 0, incomePercentage: 0 },
      { method: 'other', label: 'Otro', incomeTotal: 0, expenseTotal: 0, incomePercentage: 0 },
    ],
    incomeGrandTotal: 0,
    expenseGrandTotal: 0,
  };
}
