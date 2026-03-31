// =============================================
// src/app/layout.tsx
// Layout raíz de Next.js — fuentes, metadata global
// =============================================

import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Grabador Web",
    template: "%s | Grabador Web",
  },
  description: "Graba tu pantalla directamente desde el navegador. Sin instalaciones.",
  keywords: ["grabación de pantalla", "screen recorder", "webm", "navegador"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080b12",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={ibmPlexMono.variable}>
      <body>{children}</body>
    </html>
  );
}
