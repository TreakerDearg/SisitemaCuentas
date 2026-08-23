import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExpenseCategory from '@/models/ExpenseCategory';

// PATCH /api/categories/:id - Editar categoría
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { name, active } = body;

    const category = await ExpenseCategory.findById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    if (name !== undefined) category.name = name;
    if (active !== undefined) category.active = active;

    await category.save();

    return NextResponse.json({ success: true, data: category });
  } catch (error: unknown) {
    console.error('Error updating category:', error);

    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: number }).code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al actualizar categoría' },
      { status: 500 }
    );
  }
}
