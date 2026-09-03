import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Vehicle from '@/models/Vehicle';

// POST /api/sessions - Crear nueva jornada
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { vehicleId, initialCash, initialKm, date, startTime, notes } = body;

    // Log del body recibido para diagnóstico en producción
    console.info('[SESSION_CREATE] Body recibido:', JSON.stringify({
      vehicleId: vehicleId ? `${String(vehicleId).slice(0, 8)}...` : 'VACÍO',
      initialCash,
      initialKm,
      date,
      startTime: startTime ? 'presente' : 'VACÍO',
      hasNotes: !!notes,
    }));

    // ── Validaciones con mensajes específicos ────────────────
    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'Falta seleccionar un vehículo.' },
        { status: 400 }
      );
    }
    if (initialCash === undefined || initialCash === null || initialCash === '') {
      return NextResponse.json(
        { success: false, error: 'Falta el dinero inicial (puede ser 0).' },
        { status: 400 }
      );
    }
    if (initialKm === undefined || initialKm === null || initialKm === '') {
      return NextResponse.json(
        { success: false, error: 'Falta el KM inicial.' },
        { status: 400 }
      );
    }
    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Falta la fecha de inicio.' },
        { status: 400 }
      );
    }
    if (!startTime) {
      return NextResponse.json(
        { success: false, error: 'Falta la hora de inicio.' },
        { status: 400 }
      );
    }
    if (Number(initialCash) < 0) {
      return NextResponse.json(
        { success: false, error: 'El dinero inicial no puede ser negativo.' },
        { status: 400 }
      );
    }
    if (Number(initialKm) < 0) {
      return NextResponse.json(
        { success: false, error: 'El KM inicial no puede ser negativo.' },
        { status: 400 }
      );
    }

    // ── Validar vehículo ─────────────────────────────────────
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: `Vehículo no encontrado (id: ${vehicleId}).` },
        { status: 404 }
      );
    }

    // ── Regla de negocio: una sola jornada activa ────────────
    const openSession = await WorkSession.findOne({ status: 'open' });
    if (openSession) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ya existe una jornada abierta.',
          code: 'SESSION_ALREADY_ACTIVE',
          data: { existingSessionId: openSession._id },
        },
        { status: 409 }
      );
    }

    // ── Parsear fechas de forma robusta ──────────────────────
    const parsedDate = new Date(date);
    const parsedStartTime = new Date(startTime);

    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: `Fecha inválida: "${date}".` },
        { status: 400 }
      );
    }
    if (isNaN(parsedStartTime.getTime())) {
      return NextResponse.json(
        { success: false, error: `Hora de inicio inválida: "${startTime}".` },
        { status: 400 }
      );
    }

    const session = await WorkSession.create({
      vehicleId,
      initialCash: Number(initialCash),
      initialKm: Number(initialKm),
      date: parsedDate,
      startTime: parsedStartTime,
      notes: notes?.trim() || undefined,
    });

    console.info(`[SESSION_CREATE] New session ${session._id} for vehicle ${vehicleId}`);
    return NextResponse.json(
      { success: true, data: session },
      { status: 201 }
    );
  } catch (error) {
    console.error('[SESSION_CREATE] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear jornada. Intentá nuevamente.' },
      { status: 500 }
    );
  }
}

// GET /api/sessions - Obtener historial de jornadas
// Query params: from, to (ISO), vehicleId, status ('open'|'closed'|'all'), limit, page
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const vehicleId = searchParams.get('vehicleId');
    const status = searchParams.get('status'); // 'open' | 'closed' | 'all'
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const page = parseInt(searchParams.get('page') ?? '1');

    const filter: Record<string, unknown> = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = toDate;
      }
      filter.date = dateFilter;
    }

    if (vehicleId) filter.vehicleId = vehicleId;

    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      WorkSession.find(filter)
        .populate('vehicleId')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      WorkSession.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: sessions,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener jornadas' },
      { status: 500 }
    );
  }
}
