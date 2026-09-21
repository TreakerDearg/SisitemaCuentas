import "./globals.css";
import BottomNav from "@/components/ui/BottomNav";
import ConnectionBanner from "@/components/ui/ConnectionBanner";
import { OfflineProvider } from "@/components/offline/OfflineProvider";
import OfflineStatus from "@/components/offline/OfflineStatus";
import ServiceWorkerRegister from "@/components/offline/ServiceWorkerRegister";
import SyncDiagnostics from "@/components/offline/SyncDiagnostics";
import SyncSelector from "@/components/offline/SyncSelector";

export const metadata = {
  title: "Gestor de Gastos",
  description: "Aplicación personal para registrar gastos, ingresos y controlar una caja diaria",
  // Next.js sirve /manifest.webmanifest desde src/app/manifest.ts
  // Esto evita que Vercel SSO intercepte el archivo estático de public/
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/Logo.png",
    apple: "/Logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gestor de Gastos",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <link rel="icon" href="/Logo.png" />
        <link rel="apple-touch-icon" href="/Logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className="min-h-full flex flex-col font-sans"
        style={{ background: "var(--color-background)", paddingBottom: "calc(64px + env(safe-area-inset-bottom))" }}
      >
        <OfflineProvider>
          <ServiceWorkerRegister />
          {children}
          <OfflineStatus />
          <SyncSelector />
          <SyncDiagnostics />
          <ConnectionBanner />
          <BottomNav />
        </OfflineProvider>
      </body>
    </html>
  );
}
