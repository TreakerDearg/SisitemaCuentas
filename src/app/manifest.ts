import type { MetadataRoute } from 'next';

/**
 * Genera el Web App Manifest a través del runtime de Next.js.
 *
 * Usar el route handler en lugar del archivo estático public/manifest.json
 * evita que Vercel Deployment Protection intercepte el request con SSO,
 * lo que produce el error CORS al intentar cargar el manifest.
 *
 * Next.js sirve este archivo en /manifest.webmanifest con los headers
 * correctos (Content-Type: application/manifest+json).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gestor de Gastos',
    short_name: 'Gastos',
    description: 'Control de caja, jornadas, ingresos y gastos',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0B0F14',
    theme_color: '#0B0F14',
    icons: [
      {
        src: '/Logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/Logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['finance', 'productivity'],
    lang: 'es',
    dir: 'ltr',
  };
}
