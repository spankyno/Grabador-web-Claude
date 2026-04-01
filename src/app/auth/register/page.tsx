// =============================================
// src/app/auth/register/page.tsx
// Server Component — solo exporta metadata y renderiza el cliente
// =============================================

import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta gratuita en Grabador Web y guarda tus grabaciones en la nube.",
  alternates: { canonical: "/auth/register" },
};

export default function RegisterPage() {
  return <RegisterClient />;
}
