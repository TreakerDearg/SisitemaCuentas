import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vehicle from '@/models/Vehicle';

// POST /api/vehicles - Crear vehículo
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, brand, model, year, plate } = body;

    // Validaciones
    if (!name || !brand || !model || !year || !plate) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.create({
      name,
      brand,
      model,
      year,
      plate,
    });

    return NextResponse.json(
      { success: true, data: vehicle },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear vehículo' },
      { status: 500 }
    );
  }
}

// GET /api/vehicles - Obtener vehículos (activos por defecto)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const query = includeInactive ? {} : { active: true };

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener vehículos' },
      { status: 500 }
    );
  }
}
