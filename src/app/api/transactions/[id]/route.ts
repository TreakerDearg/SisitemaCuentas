import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import WorkSession from '@/models/WorkSession';
// Necesario para que Mongoose pueda resolver populate('category') en serverless
import '@/models/ExpenseCategory';

// GET /api/transactions/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const transaction = await Transaction.findById(id).populate('category');
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Movimiento no encontrado.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    console.error('[transactions/:id] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo obtener el movimiento.' },
      { status: 500 }
    );
  }
}

// PATCH /api/transactions/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { type, amount, category, platform, paymentMethod, description, expectedRevision } = body;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Movimiento no encontrado.' },
        { status: 404 }
      );
    }

    const session = await WorkSession.findById(transaction.sessionId);
    if (!session || session.status !== 'open') {
      return NextResponse.json(
        { success: false, error: 'No se pueden editar movimientos de una jornada cerrada.' },
        { status: 409 }
      );
    }

    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json(
          { success: false, error: 'El monto debe ser un número mayor a 0.' },
          { status: 400 }
        );
      }
    }
    if (type && !['income', 'expense'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'El tipo debe ser "income" o "expense".' },
        { status: 400 }
      );
    }
    if (paymentMethod && !['cash', 'transfer', 'other'].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'Método de pago inválido.' },
        { status: 400 }
      );
    }
    if (platform && !['uber', 'didi', 'other'].includes(platform)) {
      return NextResponse.json(
        { success: false, error: 'Plataforma inválida.' },
        { status: 400 }
      );
    }

    if (type !== undefined) transaction.type = type;
    if (amount !== undefined) transaction.amount = amount;
    if (category !== undefined) transaction.category = category;
    if (platform !== undefined) transaction.platform = platform;
    if (paymentMethod !== undefined) transaction.paymentMethod = paymentMethod;
    if (description !== undefined) transaction.description = description?.trim() || undefined;

    await transaction.save();
    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    console.error('[transactions/:id] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo actualizar el movimiento. Intentá nuevamente.' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Movimiento no encontrado.' },
        { status: 404 }
      );
    }

    const session = await WorkSession.findById(transaction.sessionId);
    if (!session || session.status !== 'open') {
      return NextResponse.json(
        { success: false, error: 'No se pueden eliminar movimientos de una jornada cerrada.' },
        { status: 409 }
      );
    }

    await Transaction.deleteOne({ _id: id });
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('[transactions/:id] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo eliminar el movimiento. Intentá nuevamente.' },
      { status: 500 }
    );
  }
}
