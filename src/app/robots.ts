// =============================================
// src/app/robots.ts
// Reglas de rastreo para bots de búsqueda.
// Next.js lo sirve como /robots.txt
// =============================================

import type { MetadataRoute } from "next";

const SITE_URL = "https://grabador-web-v2.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/recorder", "/auth/login", "/auth/register"],
        // No indexar rutas privadas ni APIs
        disallow: [
          "/recordings",
          "/api/",
          "/auth/callback",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
