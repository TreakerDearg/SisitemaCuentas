import { ITransaction } from '../models/Transaction';
import { IWorkSession } from '../models/WorkSession';

export interface SessionSummary {
  totalIncome: number;
  totalExpense: number;
  netResult: number;
  cashIncome: number;
  cashExpense: number;
  expectedCash: number;
  transferIncome: number;
  transferExpense: number;
  distance: number;
}

export function calculateTotalIncome(transactions: ITransaction[]): number {
  return transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateTotalExpense(transactions: ITransaction[]): number {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateNetResult(transactions: ITransaction[]): number {
  return calculateTotalIncome(transactions) - calculateTotalExpense(transactions);
}

export function calculateCashIncome(transactions: ITransaction[]): number {
  return transactions
    .filter((t) => t.type === 'income' && t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateCashExpense(transactions: ITransaction[]): number {
  return transactions
    .filter((t) => t.type === 'expense' && t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateTransferIncome(transactions: ITransaction[]): number {
  return transactions
    .filter((t) => t.type === 'income' && t.paymentMethod === 'transfer')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateTransferExpense(transactions: ITransaction[]): number {
  return transactions
    .filter((t) => t.type === 'expense' && t.paymentMethod === 'transfer')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateExpectedCash(
  initialCash: number,
  transactions: ITransaction[]
): number {
  const cashIncome = calculateCashIncome(transactions);
  const cashExpense = calculateCashExpense(transactions);
  return initialCash + cashIncome - cashExpense;
}

export function calculateDistance(session: IWorkSession): number {
  if (!session.finalKm || session.finalKm < session.initialKm) {
    return 0;
  }
  return session.finalKm - session.initialKm;
}

export function calculateSessionSummary(
  session: IWorkSession,
  transactions: ITransaction[]
): SessionSummary {
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpense = calculateTotalExpense(transactions);
  const netResult = totalIncome - totalExpense;
  const cashIncome = calculateCashIncome(transactions);
  const cashExpense = calculateCashExpense(transactions);
  const expectedCash = calculateExpectedCash(session.initialCash, transactions);
  const transferIncome = calculateTransferIncome(transactions);
  const transferExpense = calculateTransferExpense(transactions);
  const distance = calculateDistance(session);

  return {
    totalIncome,
    totalExpense,
    netResult,
    cashIncome,
    cashExpense,
    expectedCash,
    transferIncome,
    transferExpense,
    distance,
  };
}
