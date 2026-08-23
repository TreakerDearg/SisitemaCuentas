import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import WorkSession from '@/models/WorkSession';
import ExpenseCategory from '@/models/ExpenseCategory';

// POST /api/transactions — Crear transacción con idempotencia
export async function POST(request: NextRequest) {
  const reqStart = Date.now();
  try {
    await connectDB();

    const body = await request.json();
    const {
      sessionId,
      type,
      amount,
      category,
      platform,
      paymentMethod,
      description,
      clientRequestId,
    } = body;

    // ── Validaciones ────────────────────────────────────────
    if (!sessionId) {
      return json400('Falta el ID de jornada.');
    }
    if (!type || !['income', 'expense'].includes(type)) {
      return json400('El tipo debe ser "income" o "expense".');
    }
    if (amount === undefined || amount === null) {
      return json400('El monto es obligatorio.');
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return json400('El monto debe ser un número mayor a 0.');
    }
    if (!paymentMethod || !['cash', 'transfer', 'other'].includes(paymentMethod)) {
      return json400('El método de pago debe ser "cash", "transfer" u "other".');
    }
    if (platform && !['uber', 'didi', 'other'].includes(platform)) {
      return json400('La plataforma debe ser "uber", "didi" u "other".');
    }

    // ── Idempotencia ─────────────────────────────────────────
    // Si el cliente envía un clientRequestId, buscar si ya procesamos esta petición
    if (clientRequestId) {
      const existing = await Transaction.findOne({ sessionId, clientRequestId });
      if (existing) {
        // Devolver el registro existente — mismo resultado, sin duplicado
        console.info(`[transactions] Idempotent request reused: ${clientRequestId}`);
        return NextResponse.json({ success: true, data: existing }, { status: 200 });
      }
    }

    // ── Verificar jornada ────────────────────────────────────
    const session = await WorkSession.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'La jornada no fue encontrada.' },
        { status: 404 }
      );
    }
    if (session.status !== 'open') {
      return NextResponse.json(
        { success: false, error: 'No se pueden agregar movimientos a una jornada cerrada.' },
        { status: 409 }
      );
    }

    // ── Verificar categoría ──────────────────────────────────
    if (category) {
      const categoryExists = await ExpenseCategory.findById(category);
      if (!categoryExists) {
        return NextResponse.json(
          { success: false, error: 'La categoría seleccionada no existe.' },
          { status: 404 }
        );
      }
    }

    // ── Crear transacción ────────────────────────────────────
    const transaction = await Transaction.create({
      sessionId,
      type,
      amount,
      category: category || undefined,
      platform: platform || undefined,
      paymentMethod,
      description: description?.trim() || undefined,
      clientRequestId: clientRequestId || undefined,
    });

    console.info(`[transactions] Created in ${Date.now() - reqStart}ms`);
    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (error: unknown) {
    // Índice único violado (clientRequestId duplicado en race condition)
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    ) {
      const body = await safeParseBody(request);
      if (body?.clientRequestId) {
        const existing = await Transaction.findOne({
          sessionId: body.sessionId,
          clientRequestId: body.clientRequestId,
        });
        if (existing) {
          return NextResponse.json({ success: true, data: existing }, { status: 200 });
        }
      }
    }
    console.error('[transactions] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo guardar el movimiento. Intentá nuevamente.' },
      { status: 500 }
    );
  }
}

// GET /api/transactions — Listar, opcionalmente filtradas por sessionId
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const query: Record<string, unknown> = {};
    if (sessionId) query.sessionId = sessionId;

    const transactions = await Transaction.find(query)
      .populate('category')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    console.error('[transactions] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudieron obtener los movimientos.' },
      { status: 500 }
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────

function json400(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

async function safeParseBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
