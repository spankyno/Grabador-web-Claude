"use client";
// =============================================
// src/components/recorder/RecorderLoader.tsx
// Detecta si el usuario tiene sesión activa.
// Si no → modo invitado (guestMode: true, límite 2 min).
// Carga RecorderUI dinámicamente para evitar SSR.
// =============================================

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RecorderOptions } from "@/types";

const RecorderUI = dynamic(() => import("./RecorderUI"), {
  ssr: false,
  loading: () => (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      gap:"1rem", padding:"4rem", color:"var(--text-muted,#4a5270)", fontSize:".85rem",
      fontFamily:"var(--font-sans,sans-serif)" }}>
      <div style={{ width:12, height:12, borderRadius:"50%", background:"var(--border2,#1a2030)",
        animation:"load-pulse 1s ease-in-out infinite" }} />
      <p>Cargando grabador…</p>
      <style>{`@keyframes load-pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  ),
});

interface RecorderLoaderProps {
  options?: RecorderOptions;
}

export default function RecorderLoader({ options }: RecorderLoaderProps) {
  const [isGuest, setIsGuest] = useState<boolean | null>(null); // null = cargando

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsGuest(!data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsGuest(!session?.user);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Mientras detecta la sesión, mostrar loader
  if (isGuest === null) return null;

  return (
    <div style={{ width: "100%" }}>
      {/* Banner modo invitado */}
      {isGuest && (
        <div style={{
          display: "flex", alignItems: "center", gap: ".6rem",
          padding: ".65rem 1.25rem",
          background: "rgba(124,106,247,0.07)",
          borderBottom: "1px solid rgba(124,106,247,0.18)",
          fontSize: ".8rem", color: "var(--text-secondary,#8892a8)",
          fontFamily: "var(--font-sans,sans-serif)",
        }}>
          <span style={{ color: "var(--accent,#7c6af7)", fontSize: "1rem" }}>ⓘ</span>
          <span>
            Estás en modo invitado. Las grabaciones se limitan a{" "}
            <strong style={{ color: "var(--text-primary,#e8eaf0)" }}>2 minutos</strong>{" "}
            y solo podrás descargar el archivo WebM.{" "}
            <a href="/auth/register" style={{ color: "var(--accent,#7c6af7)", fontWeight: 600, textDecoration: "none" }}>
              Crea una cuenta gratis
            </a>{" "}
            para guardar en la nube y obtener MP4.
          </span>
        </div>
      )}

      <RecorderUI options={{ ...options, isGuest } as RecorderOptions & { isGuest: boolean }} />
    </div>
  );
}
