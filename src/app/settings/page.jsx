'use client';

import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function Settings() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">Ajustes de la aplicación</p>
        </div>

        {/* Application Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Aplicación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Versión</p>
                <p className="font-medium">1.0.0</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stack Tecnológico</p>
                <p className="font-medium">Next.js 16 + React + TailwindCSS + MongoDB</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Entorno</p>
                <p className="font-medium">{process.env.NODE_ENV || 'development'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Categorías de Ingresos</h3>
                <div className="flex flex-wrap gap-2">
                  {['Efectivo', 'Transferencia', 'Alquiler', 'Otros'].map((category) => (
                    <span key={category} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Categorías de Gastos</h3>
                <div className="flex flex-wrap gap-2">
                  {['Combustible', 'Mantenimiento', 'Peajes', 'Compras', 'Otros'].map((category) => (
                    <span key={category} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['Efectivo', 'Transferencia', 'Tarjeta', 'Mercado Pago', 'Otros'].map((method) => (
                <span key={method} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {method}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Database Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Conexión a Base de Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                La aplicación utiliza MongoDB para almacenar las transacciones.
              </p>
              <p className="text-sm text-gray-600">
                Configura la variable de entorno <code className="bg-gray-100 px-2 py-1 rounded">MONGODB_URI</code> en tu archivo <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Deployment */}
        <Card>
          <CardHeader>
            <CardTitle>Despliegue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Esta aplicación está lista para desplegarse en Vercel.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Pasos para desplegar:</p>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                  <li>Conecta tu repositorio a Vercel</li>
                  <li>Configura la variable de entorno MONGODB_URI</li>
                  <li>Despliega automáticamente</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
