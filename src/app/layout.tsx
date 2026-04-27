// =============================================
// src/app/layout.tsx
// Layout raíz con SEO completo:
// - Metadata Next.js (Open Graph, Twitter Cards)
// - Google Site Verification
// - JSON-LD (WebApplication + Person)
// - Favicon SVG
// =============================================

import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

// =============================================
// URL canónica — cambiar si el dominio cambia
// =============================================
const SITE_URL = "https://grabador-web-v2.vercel.app";
const SITE_NAME = "Grabador Web";
const DESCRIPTION =
  "Graba tu pantalla directamente desde el navegador, sin instalaciones. " +
  "Grabador de pantalla online gratuito con almacenamiento en la nube, " +
  "conversión a MP4 y biblioteca personal. Screen recorder gratis en español.";

// =============================================
// Metadata principal (Next.js genera las etiquetas automáticamente)
// =============================================
export const metadata: Metadata = {
  // Title con template para páginas internas
  title: {
    default: `${SITE_NAME} — Grabador de pantalla online gratis`,
    template: `%s | ${SITE_NAME}`,
  },

  description: DESCRIPTION,

  // Palabras clave (baja relevancia para Google, útil para otros motores)
  keywords: [
    "grabador de pantalla online",
    "screen recorder gratis",
    "grabar pantalla navegador",
    "grabador web",
    "screen recorder español",
    "captura de pantalla vídeo",
    "grabar pantalla sin instalar",
    "grabador de pantalla mp4",
    "grabación de pantalla online",
    "screen capture online",
  ],

  // Autor
  authors: [
    {
      name: "Aitor Sánchez Gutiérrez",
      url: "https://aitorhub.vercel.app/",
    },
  ],
  creator: "Aitor Sánchez Gutiérrez",
  publisher: SITE_NAME,

  // URL canónica
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },

  // =============================================
  // Open Graph (Facebook, LinkedIn, WhatsApp…)
  // =============================================
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Grabador de pantalla online gratis`,
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Grabador Web — Graba tu pantalla desde el navegador",
        type: "image/png",
      },
    ],
  },

  // =============================================
  // Twitter / X Cards
  // =============================================
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Grabador de pantalla online gratis`,
    description: DESCRIPTION,
    images: ["/og-image.png"],
    // Si tienes cuenta de Twitter puedes añadir:
    // creator: "@tu_usuario",
    // site: "@tu_usuario",
  },

  // =============================================
  // Google Site Verification
  // =============================================
  verification: {
    google: "MEiDmnJOvnWITHUi0HCLxuoulOEm0oTM4fwQMugxoyY",
  },

  // Robots — indexar todo
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Favicon (Next.js lo usa para <link rel="icon">)
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06080e",
};

// =============================================
// JSON-LD — datos estructurados para Google
// Tipo WebApplication + Person (autor)
// =============================================
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: SITE_NAME,
      url: SITE_URL,
      description: DESCRIPTION,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires a modern browser with MediaRecorder API support (Chrome, Edge, Firefox)",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        description: "Plan gratuito disponible. Registro opcional para guardar grabaciones en la nube.",
      },
      featureList: [
        "Grabación de pantalla desde el navegador",
        "Sin instalación requerida",
        "Conversión automática a MP4",
        "Almacenamiento en la nube con Supabase",
        "Soporte para grabaciones largas con protocolo TUS",
        "Selector de calidad de grabación",
        "Temporizador automático",
        "Grabación de webcam",
        "Descarga directa en modo invitado",
      ],
      inLanguage: "es",
      image: `${SITE_URL}/og-image.png`,
      author: { "@id": `${SITE_URL}/#author` },
      creator: { "@id": `${SITE_URL}/#author` },
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#author`,
      name: "Aitor Sánchez Gutiérrez",
      url: "https://aitorhub.vercel.app/",
      sameAs: [
        "https://aitorsanchez.pages.dev/",
        "https://aitorhub.vercel.app/",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DESCRIPTION,
      inLanguage: "es",
      publisher: { "@id": `${SITE_URL}/#author` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${dmSans.variable} ${dmMono.variable}`}>
      <head>
        {/* JSON-LD — datos estructurados */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
