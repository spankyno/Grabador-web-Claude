"use client";
// =============================================
// src/components/recorder/RecorderLoader.tsx
// Client Component que carga RecorderUI dinámicamente.
// Necesario porque next/dynamic con ssr:false solo puede
// usarse dentro de un "use client" boundary en App Router.
// =============================================

import dynamic from "next/dynamic";
import type { RecorderOptions } from "@/types";

const RecorderUI = dynamic(() => import("./RecorderUI"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        padding: "4rem",
        color: "#4b5563",
        fontSize: "0.85rem",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#1e2433",
          animation: "load-pulse 1s ease-in-out infinite",
        }}
      />
      <p>Cargando grabador…</p>
      <style>{`
        @keyframes load-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
    </div>
  ),
});

interface RecorderLoaderProps {
  options?: RecorderOptions;
}

export default function RecorderLoader({ options }: RecorderLoaderProps) {
  return <RecorderUI options={options} />;
}
