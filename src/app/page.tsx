// =============================================
// src/app/page.tsx
// Server Component puro — sin "use client", sin dynamic, sin style jsx.
// Delega la carga dinámica del grabador a RecorderLoader (Client Component).
// Regla App Router: next/dynamic con ssr:false solo puede vivir
// dentro de un "use client" boundary.
// =============================================

import type { Metadata } from "next";
import RecorderLoader from "@/components/recorder/RecorderLoader";

export const metadata: Metadata = {
  title: "Grabador Web — Graba tu pantalla directamente desde el navegador",
  description:
    "Herramienta de grabación de pantalla profesional. Sin instalación, segura, con soporte para grabaciones largas.",
};

export default function HomePage() {
  return (
    <main className="main-layout">
      <div className="page-header">
        <h1 className="page-title">Grabador Web</h1>
        <p className="page-subtitle">
          Graba tu pantalla directamente desde el navegador.
          <br />
          Sin instalaciones. Seguro. Soporta grabaciones largas.
        </p>
      </div>

      {/*
        RecorderLoader es "use client" y hace el dynamic import con ssr:false.
        Así el Server Component no toca nada de MediaRecorder/navigator.
      */}
      <RecorderLoader
        options={{
          resumableThresholdMinutes: 8,
          resumableThresholdMB: 250,
          timesliceMs: 20_000,
          includeSystemAudio: true,
        }}
      />

      <footer className="page-footer">
        <a href="/recordings">Mis grabaciones</a>
        <span>·</span>
        <a href="/auth/login">Cuenta</a>
      </footer>
    </main>
  );
}
