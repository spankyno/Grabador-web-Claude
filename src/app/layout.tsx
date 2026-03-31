// =============================================
// src/app/layout.tsx
// Fuentes: Syne (display) + JetBrains Mono (código)
// =============================================

import type { Metadata, Viewport } from "next";
import { Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  weight: ["400", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-syne",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "GrabadorWeb",
    template: "%s | GrabadorWeb",
  },
  description: "Herramienta profesional de grabación de pantalla desde el navegador.",
  keywords: ["grabación de pantalla", "screen recorder", "webm", "supabase", "ffmpeg"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06080e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${syne.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
