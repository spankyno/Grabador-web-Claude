// =============================================
// src/app/recordings/page.tsx
// Server Component — solo exporta metadata y renderiza el cliente
// =============================================

import type { Metadata } from "next";
import RecordingsClient from "./RecordingsClient";

export const metadata: Metadata = {
  title: "Mis grabaciones",
  description: "Biblioteca de tus grabaciones de pantalla. Descarga en MP4 o WebM.",
};

export default function RecordingsPage() {
  return <RecordingsClient />;
}
