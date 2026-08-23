import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExpenseCategory from '@/models/ExpenseCategory';

// POST /api/categories - Crear categoría
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name } = body;

    // Validaciones
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'name es obligatorio' },
        { status: 400 }
      );
    }

    const category = await ExpenseCategory.create({ name });

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating category:', error);
    
    // Manejar error de duplicado
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}

// GET /api/categories - Obtener categorías (activas por defecto)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const query = includeInactive ? {} : { active: true };

    const categories = await ExpenseCategory.find(query).sort({ name: 1 });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}
