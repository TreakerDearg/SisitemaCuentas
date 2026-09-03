import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  // Validar MONGODB_URI dentro de la función, no en top-level.
  // Si se valida en top-level, un error en tiempo de módulo hace que el worker
  // de Vercel se caiga antes de ejecutar el handler, produciendo 500 sin logs útiles.
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      '[MongoDB] MONGODB_URI no está definida. ' +
      'Verificá las Environment Variables en Vercel Dashboard → Settings → Environment Variables.'
    );
    throw new Error(
      'La variable de entorno MONGODB_URI no está configurada. ' +
      'Por favor definila en el panel de Vercel.'
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Limpiar la promesa fallida para que el próximo request reintente
    cached.promise = null;
    console.error('[MongoDB] Error de conexión:', e instanceof Error ? e.message : e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
