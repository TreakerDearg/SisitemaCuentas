import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import Vehicle from '@/models/Vehicle';
import Transaction from '@/models/Transaction';
import { calculateSessionSummary } from '@/lib/calculations';

// POST /api/sessions - Crear nueva jornada
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { vehicleId, initialCash, initialKm, date, startTime, notes } = body;

    // Validaciones — usar comprobación explícita para no rechazar 0
    if (
      !vehicleId ||
      initialCash === undefined ||
      initialCash === null ||
      initialKm === undefined ||
      initialKm === null ||
      !date ||
      !startTime
    ) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    if (initialCash < 0 || initialKm < 0) {
      return NextResponse.json(
        { success: false, error: 'initialCash e initialKm deben ser >= 0' },
        { status: 400 }
      );
    }

    // Validar que el vehículo existe
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehículo no encontrado' },
        { status: 404 }
      );
    }

    // Regla 1: Verificar que no existe otra jornada abierta
    const openSession = await WorkSession.findOne({ status: 'open' });
    if (openSession) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una jornada abierta' },
        { status: 400 }
      );
    }

    const session = await WorkSession.create({
      vehicleId,
      initialCash,
      initialKm,
      date: new Date(date),
      startTime: new Date(startTime),
      notes,
    });

    return NextResponse.json(
      { success: true, data: session },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear jornada' },
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
