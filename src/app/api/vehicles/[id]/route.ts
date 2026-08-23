import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Vehicle from '@/models/Vehicle';

// PATCH /api/vehicles/:id - Editar vehículo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { name, brand, model, year, plate, active } = body;

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehículo no encontrado' },
        { status: 404 }
      );
    }

    if (name !== undefined) vehicle.name = name;
    if (brand !== undefined) vehicle.brand = brand;
    if (model !== undefined) vehicle.model = model;
    if (year !== undefined) vehicle.year = year;
    if (plate !== undefined) vehicle.plate = plate;
    if (active !== undefined) vehicle.active = active;

    await vehicle.save();

    return NextResponse.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar vehículo' },
      { status: 500 }
    );
  }
}
