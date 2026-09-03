/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  turbopack: {},

  async headers() {
    return [
      {
        // Permitir que el manifest sea leído por el browser sin restricciones CORS.
        // Necesario cuando Vercel Deployment Protection está activa en Preview deployments.
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
      {
        // Headers de seguridad para todas las rutas
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
