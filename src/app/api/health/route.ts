import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

/**
 * GET /api/health
 * Health check sin exponer información sensible.
 * Útil para verificar que el servidor y MongoDB están operativos.
 */
export async function GET() {
  const start = Date.now();

  try {
    await connectDB();
    const latencyMs = Date.now() - start;

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[health] MongoDB unreachable:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
