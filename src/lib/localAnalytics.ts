import type { AnalyticsSummary, ExpenseBreakdown, PaymentMethodBreakdown, PlatformBreakdown, Transaction, TrendData, WorkSession } from '@/types';

function sessionVehicleId(session: WorkSession) {
  return typeof session.vehicleId === 'string' ? session.vehicleId : session.vehicleId?._id;
}

function inRange(value: string, from?: string, to?: string) {
  const date = new Date(value).getTime();
  return (!from || date >= new Date(from).getTime()) && (!to || date <= new Date(`${to}T23:59:59.999`).getTime());
}

export function calculateLocalAnalytics(
  sessions: WorkSession[],
  transactions: Transaction[],
  filter: { from?: string; to?: string; vehicleId?: string } = {}
) {
  const selected = sessions.filter((session) => session.status === 'closed' && inRange(session.date, filter.from, filter.to) && (!filter.vehicleId || sessionVehicleId(session) === filter.vehicleId));
  const selectedIds = new Set(selected.map((session) => session._id));
  const tx = transactions.filter((item) => selectedIds.has(item.sessionId));
  const income = tx.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expense = tx.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const distance = selected.reduce((sum, session) => sum + Math.max(0, (session.finalKm ?? session.initialKm) - session.initialKm), 0);
  const hours = selected.reduce((sum, session) => sum + (session.endTime ? Math.max(0, new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 3_600_000 : 0), 0);
  const net = income - expense;

  const summary: AnalyticsSummary = {
    sessions: selected.length,
    income,
    expense,
    net,
    distance,
    hours,
    incomePerHour: hours ? income / hours : null,
    netPerHour: hours ? net / hours : null,
    incomePerKm: distance ? income / distance : null,
    netPerKm: distance ? net / distance : null,
    averageIncome: selected.length ? income / selected.length : null,
    averageExpense: selected.length ? expense / selected.length : null,
    averageNet: selected.length ? net / selected.length : null,
  };

  const platformTotals = new Map<string, number>();
  tx.filter((item) => item.type === 'income').forEach((item) => {
    const platform = item.platform ?? 'other';
    platformTotals.set(platform, (platformTotals.get(platform) ?? 0) + item.amount);
  });
  const grandTotal = [...platformTotals.values()].reduce((sum, value) => sum + value, 0);
  const platforms: PlatformBreakdown = {
    platforms: [...platformTotals.entries()].map(([platform, total]) => ({ platform, label: platform === 'uber' ? 'Uber' : platform === 'didi' ? 'DiDi' : 'Otro', total, percentage: grandTotal ? total / grandTotal * 100 : 0 })),
    grandTotal,
  };

  const methods = new Map<string, { incomeTotal: number; expenseTotal: number }>();
  tx.forEach((item) => {
    const current = methods.get(item.paymentMethod) ?? { incomeTotal: 0, expenseTotal: 0 };
    if (item.type === 'income') current.incomeTotal += item.amount;
    else current.expenseTotal += item.amount;
    methods.set(item.paymentMethod, current);
  });
  const incomeGrandTotal = [...methods.values()].reduce((sum, item) => sum + item.incomeTotal, 0);
  const paymentMethods: PaymentMethodBreakdown = {
    methods: [...methods.entries()].map(([method, values]) => ({ method, ...values, label: method === 'cash' ? 'Efectivo' : method === 'transfer' ? 'Transferencia' : 'Otro', incomePercentage: incomeGrandTotal ? values.incomeTotal / incomeGrandTotal * 100 : 0 })),
    incomeGrandTotal,
    expenseGrandTotal: [...methods.values()].reduce((sum, item) => sum + item.expenseTotal, 0),
  };

  const categories = new Map<string, { name: string; total: number }>();
  tx.filter((item) => item.type === 'expense').forEach((item) => {
    const id = typeof item.category === 'object' && item.category ? item.category._id : item.category ?? 'other';
    const name = typeof item.category === 'object' && item.category ? item.category.name : 'Otros';
    const current = categories.get(id) ?? { name, total: 0 };
    current.total += item.amount;
    categories.set(id, current);
  });
  const totalExpenses = [...categories.values()].reduce((sum, item) => sum + item.total, 0);
  const categoryItems = [...categories.entries()].map(([id, item]) => ({ id, name: item.name, total: item.total, percentage: totalExpenses ? item.total / totalExpenses * 100 : 0 }));
  const expenses: ExpenseBreakdown = { categories: categoryItems, total: totalExpenses, topCategory: categoryItems.sort((a, b) => b.total - a.total)[0] ?? null };

  const trends: TrendData = {
    points: selected.sort((a, b) => a.date.localeCompare(b.date)).map((session) => {
      const sessionTx = tx.filter((item) => item.sessionId === session._id);
      const sessionIncome = sessionTx.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
      const sessionExpense = sessionTx.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
      return { sessionId: session._id, date: session.date, income: sessionIncome, expense: sessionExpense, net: sessionIncome - sessionExpense, distance: Math.max(0, (session.finalKm ?? session.initialKm) - session.initialKm) };
    }),
    previousPeriodNet: null,
  };

  return { summary, platforms, paymentMethods, expenses, trends };
}
