// =============================================
// src/app/page.tsx — Landing page principal
// Estética: industrial-técnica, tipografía Syne + JetBrains Mono,
// acento ámbar, cards con glow en hover, animaciones de entrada.
// =============================================

import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import LandingClient from "@/components/LandingClient";

export const metadata: Metadata = {
  title: "GrabadorWeb — Graba tu pantalla desde el navegador",
  description:
    "Herramienta profesional de grabación de pantalla. Sin instalaciones. Almacenamiento seguro con Supabase. Procesado FFmpeg en la nube.",
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <LandingClient />
    </>
  );
}
