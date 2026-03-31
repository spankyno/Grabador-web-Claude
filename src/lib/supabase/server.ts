// =============================================
// src/lib/supabase/server.ts
// Cliente Supabase para el servidor (Server Components, API Routes)
// Lee/escribe cookies con next/headers para mantener la sesión
// =============================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // En Server Components solo se puede leer, no escribir cookies
            // El middleware se encarga de refrescar la sesión
          }
        },
      },
    }
  );
}

// Cliente con service role key — SOLO para uso en servidor/worker
// NUNCA importar este cliente en componentes cliente
export function createServiceRoleClient() {
  const { createClient } = require("@supabase/supabase-js");

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está definida");
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
