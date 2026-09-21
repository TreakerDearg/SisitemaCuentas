import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Transaction from '@/models/Transaction';
import Vehicle from '@/models/Vehicle';
import ExpenseCategory from '@/models/ExpenseCategory';
import { calculateSessionSummary } from '@/lib/calculations';
import '@/models/ExpenseCategory';

type Entity = 'sessions' | 'transactions' | 'vehicles' | 'categories';
type Kind = 'create' | 'update' | 'delete';
type SyncOperation = {
  id: string;
  entity: Entity;
  kind: Kind;
  entityId: string;
  method?: 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const operations = body?.operations as SyncOperation[];
    if (!Array.isArray(operations) || operations.length > 100 || operations.some(isInvalidOperation)) {
      return NextResponse.json({ success: false, error: 'Lote de sincronización inválido.' }, { status: 400 });
    }

    await connectDB();
    const results = [];
    for (const operation of operations) {
      try {
        const value = await applyOperation(operation);
        results.push({ id: operation.id, success: true, data: value });
      } catch (error) {
        results.push({
          id: operation.id,
          success: false,
          error: error instanceof Error ? error.message : 'No se pudo aplicar la operación.',
          permanent: isPermanentError(error),
          conflict: error instanceof ConflictError,
          serverValue: error instanceof ConflictError ? error.serverValue : undefined,
        });
      }
    }

    const changes = await collectChanges(body?.lastSyncAt);
    return NextResponse.json({
      success: true,
      data: { results, changes, serverTime: new Date().toISOString() },
    });
  } catch (error) {
    console.error('[sync] Error:', error);
    return NextResponse.json({ success: false, error: 'No se pudo procesar la sincronización.' }, { status: 500 });
  }
}

function isInvalidOperation(operation: SyncOperation) {
  return !operation || typeof operation.id !== 'string' || !['sessions', 'transactions', 'vehicles', 'categories'].includes(operation.entity) || !['create', 'update', 'delete'].includes(operation.kind) || typeof operation.entityId !== 'string';
}

async function applyOperation(operation: SyncOperation): Promise<unknown> {
  const body = operation.body ?? {};
  switch (operation.entity) {
    case 'transactions': return applyTransaction(operation, body);
    case 'sessions': return applySession(operation, body);
    case 'vehicles': return applyVehicle(operation, body);
    case 'categories': return applyCategory(operation, body);
  }
}

async function applyTransaction(operation: SyncOperation, body: Record<string, unknown>) {
  if (operation.kind === 'create') {
    const existing = body.clientRequestId ? await Transaction.findOne({ sessionId: body.sessionId, clientRequestId: body.clientRequestId }) : null;
    if (existing) return existing;
    const session = await WorkSession.findById(body.sessionId);
    if (!session || session.status !== 'open') throw new PermanentError('La jornada no existe o está cerrada.');
    const transaction = await Transaction.create({ ...body, category: body.category || undefined, platform: body.platform || undefined });
    return transaction;
  }
  const transaction = await Transaction.findById(operation.entityId);
  if (!transaction) throw new PermanentError('Movimiento no encontrado.');
  assertRevision(transaction.revision, body.expectedRevision, transaction);
  const session = await WorkSession.findById(transaction.sessionId);
  if (!session || session.status !== 'open') throw new PermanentError('La jornada está cerrada.');
  if (operation.kind === 'delete') {
    await Transaction.deleteOne({ _id: operation.entityId });
    return { id: operation.entityId };
  }
  Object.assign(transaction, body);
  await transaction.save();
  return transaction;
}

async function applySession(operation: SyncOperation, body: Record<string, unknown>) {
  if (operation.kind === 'create') {
    const existing = body.clientRequestId ? await WorkSession.findOne({ clientRequestId: body.clientRequestId }) : null;
    if (existing) return existing;
    const open = await WorkSession.findOne({ status: 'open' });
    if (open) throw new PermanentError('Ya existe una jornada abierta.');
    return WorkSession.create({ ...body, vehicleId: body.vehicleId, date: new Date(String(body.date)), startTime: new Date(String(body.startTime)) });
  }
  const session = await WorkSession.findById(operation.entityId);
  if (!session) throw new PermanentError('Jornada no encontrada.');
  assertRevision(session.revision, body.expectedRevision, session);
  if (operation.kind === 'delete') throw new PermanentError('Las jornadas no se eliminan desde sincronización.');
  if (body.finalKm !== undefined) {
    if (session.status === 'closed') return session;
    session.status = 'closed';
    session.finalKm = Number(body.finalKm);
    session.endTime = new Date();
  }
  if (body.notes !== undefined) session.notes = String(body.notes || '') || undefined;
  session.revision += 1;
  await session.save();
  return session;
}

async function applyVehicle(operation: SyncOperation, body: Record<string, unknown>) {
  if (operation.kind === 'create') {
    const existing = body.clientRequestId ? await Vehicle.findOne({ clientRequestId: body.clientRequestId }) : null;
    if (existing) return existing;
    return Vehicle.create(body);
  }
  const vehicle = await Vehicle.findById(operation.entityId);
  if (!vehicle) throw new PermanentError('Vehículo no encontrado.');
  assertRevision(vehicle.revision, body.expectedRevision, vehicle);
  if (operation.kind === 'delete') throw new PermanentError('Los vehículos se desactivan, no se eliminan.');
  Object.assign(vehicle, body);
  vehicle.revision += 1;
  await vehicle.save();
  return vehicle;
}

async function applyCategory(operation: SyncOperation, body: Record<string, unknown>) {
  if (operation.kind === 'create') {
    const existing = body.clientRequestId ? await ExpenseCategory.findOne({ clientRequestId: body.clientRequestId }) : null;
    if (existing) return existing;
    return ExpenseCategory.create(body);
  }
  const category = await ExpenseCategory.findById(operation.entityId);
  if (!category) throw new PermanentError('Categoría no encontrada.');
  assertRevision(category.revision, body.expectedRevision, category);
  if (operation.kind === 'delete') throw new PermanentError('Las categorías se desactivan, no se eliminan.');
  Object.assign(category, body);
  category.revision += 1;
  await category.save();
  return category;
}

class PermanentError extends Error {}
class ConflictError extends PermanentError {
  constructor(message: string, public serverValue: unknown) { super(message); }
}
function assertRevision(current: number, expected: unknown, serverValue: unknown) {
  if (expected !== undefined && Number(expected) !== current) {
    throw new ConflictError(`Conflicto de versión: servidor ${current}, cliente ${expected}.`, serverValue);
  }
}
function isPermanentError(error: unknown) { return error instanceof PermanentError; }

async function collectChanges(lastSyncAt: unknown) {
  const since = typeof lastSyncAt === 'string' ? new Date(lastSyncAt) : new Date(0);
  if (Number.isNaN(since.getTime())) return [];
  const [sessions, transactions, vehicles, categories] = await Promise.all([
    WorkSession.find({ updatedAt: { $gt: since } }).populate('vehicleId').lean(),
    Transaction.find({ updatedAt: { $gt: since } }).populate('category').lean(),
    Vehicle.find({ updatedAt: { $gt: since } }).lean(),
    ExpenseCategory.find({ updatedAt: { $gt: since } }).lean(),
  ]);
  return [
    ...sessions.map((value) => ({ entity: 'sessions' as const, value })),
    ...transactions.map((value) => ({ entity: 'transactions' as const, value })),
    ...vehicles.map((value) => ({ entity: 'vehicles' as const, value })),
    ...categories.map((value) => ({ entity: 'categories' as const, value })),
  ];
}
