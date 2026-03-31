// =============================================
// src/app/recorder/page.tsx — Página del grabador
// =============================================

import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import RecorderLoader from "@/components/recorder/RecorderLoader";

export const metadata: Metadata = {
  title: "Grabador — GrabadorWeb",
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
