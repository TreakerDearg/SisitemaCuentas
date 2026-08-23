import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';

// PATCH /api/sessions/:id/close — Cerrar jornada
// Protegido contra doble cierre: si ya está cerrada devuelve 409.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { finalKm, notes } = body;

    if (finalKm === undefined || finalKm === null) {
      return NextResponse.json(
        { success: false, error: 'El KM final es obligatorio para cerrar la jornada.' },
        { status: 400 }
      );
    }
    if (typeof finalKm !== 'number' || finalKm < 0) {
      return NextResponse.json(
        { success: false, error: 'El KM final debe ser un número válido.' },
        { status: 400 }
      );
    }

    const session = await WorkSession.findById(id);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Jornada no encontrada.' },
        { status: 404 }
      );
    }

    // ── Protección doble cierre ──────────────────────────────
    if (session.status === 'closed') {
      return NextResponse.json(
        { success: false, error: 'Esta jornada ya está cerrada.' },
        { status: 409 }
      );
    }

    // ── Validación de KM ─────────────────────────────────────
    if (finalKm < session.initialKm) {
      return NextResponse.json(
        {
          success: false,
          error: `El KM final (${finalKm}) no puede ser menor que el KM inicial (${session.initialKm}).`,
        },
        { status: 400 }
      );
    }

    // ── Cierre atómico ───────────────────────────────────────
    session.status = 'closed';
    session.finalKm = finalKm;
    session.endTime = new Date();
    if (notes !== undefined) {
      session.notes = notes?.trim() || undefined;
    }

    await session.save();

    console.info(`[sessions] Closed session ${id}, km: ${session.initialKm}→${finalKm}`);
    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error('[sessions/:id/close] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo cerrar la jornada. Intentá nuevamente.' },
      { status: 500 }
    );
  }
}
