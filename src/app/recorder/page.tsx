// =============================================
// src/app/recorder/page.tsx — Página del grabador
// =============================================

import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import RecorderLoader from "@/components/recorder/RecorderLoader";

export const metadata: Metadata = {
  title: "Grabador de pantalla online — GrabadorWeb",
  description:
    "Graba tu pantalla, ventana o pestaña directamente desde el navegador. " +
    "Sin instalaciones. Elige calidad, temporizador y fuente de vídeo.",
  openGraph: {
    title: "Grabador de pantalla online — GrabadorWeb",
    description: "Graba tu pantalla sin instalar nada. Descarga en WebM o guarda como MP4 en tu biblioteca.",
    url: "https://grabador-web-v2.vercel.app/recorder",
  },
  twitter: {
    card: "summary",
    title: "Grabador de pantalla online — GrabadorWeb",
  },
};

export default function RecorderPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "60px", minHeight: "100vh", background: "var(--bg)" }}>
        <RecorderLoader
          options={{
            resumableThresholdMinutes: 8,
            resumableThresholdMB: 250,
            timesliceMs: 20_000,
            includeSystemAudio: true,
          }}
        />
      </main>
    </>
  );
}
