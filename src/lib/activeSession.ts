import type { ActiveSessionData, SessionSummary, Transaction, WorkSession } from '@/types';
import { getOfflineRecord, saveOfflineRecord } from '@/lib/offline';

export function calculateLocalSessionSummary(session: WorkSession, transactions: Transaction[]): SessionSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  let cashIncome = 0;
  let cashExpense = 0;
  let transferIncome = 0;
  let transferExpense = 0;

  for (const transaction of transactions) {
    const amount = Number(transaction.amount) || 0;
    if (transaction.type === 'income') {
      totalIncome += amount;
      if (transaction.paymentMethod === 'cash') cashIncome += amount;
      if (transaction.paymentMethod === 'transfer') transferIncome += amount;
    } else {
      totalExpense += amount;
      if (transaction.paymentMethod === 'cash') cashExpense += amount;
      if (transaction.paymentMethod === 'transfer') transferExpense += amount;
    }
  }

  return {
    totalIncome,
    totalExpense,
    netResult: totalIncome - totalExpense,
    cashIncome,
    cashExpense,
    expectedCash: session.initialCash + cashIncome - cashExpense,
    transferIncome,
    transferExpense,
    distance: Math.max(0, (session.finalKm ?? session.initialKm) - session.initialKm),
  };
}

export async function updateActiveSessionSnapshot(transaction: Transaction): Promise<void> {
  const active = await getOfflineRecord<ActiveSessionData>('sessions', 'active');
  if (!active || active.session._id !== transaction.sessionId) return;

  const transactions = [transaction, ...active.transactions.filter((item) => item._id !== transaction._id)];
  const next = {
    session: active.session,
    transactions,
    summary: calculateLocalSessionSummary(active.session, transactions),
  } satisfies ActiveSessionData;
  await saveOfflineRecord('sessions', 'active', next);
  await saveOfflineRecord('sessions', active.session._id, next);
}

export async function removeFromActiveSessionSnapshot(transactionId: string): Promise<void> {
  const active = await getOfflineRecord<ActiveSessionData>('sessions', 'active');
  if (!active) return;
  const transactions = active.transactions.filter((item) => item._id !== transactionId);
  const next = {
    session: active.session,
    transactions,
    summary: calculateLocalSessionSummary(active.session, transactions),
  } satisfies ActiveSessionData;
  await saveOfflineRecord('sessions', 'active', next);
  await saveOfflineRecord('sessions', active.session._id, next);
}
