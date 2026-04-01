"use client";
// =============================================
// src/components/LandingClient.tsx
// Landing page completa: hero + feature cards + footer
// =============================================

import Link from "next/link";

const FEATURES = [
  {
    icon: "◉",
    tag: "Frontend",
    title: "Grabación nativa en el navegador",
    desc: "Usa la API MediaRecorder con timeslice cada 20s para generar chunks y evitar picos de RAM. Soporta pantalla completa, ventanas o pestañas individuales.",
    color: "var(--accent)",
  },
  {
    icon: "⬡",
    tag: "Supabase Storage",
    title: "Subida resumable con protocolo TUS",
    desc: "Grabaciones largas (+8 min / +250 MB) se suben con tus-js-client en chunks de 6 MB. Si se cae la conexión, reanuda automáticamente desde el último byte confirmado.",
    color: "#34d399",
  },
  {
    icon: "⬢",
    tag: "Supabase Auth",
    title: "Autenticación segura",
    desc: "Registro e inicio de sesión con email y contraseña gestionados por Supabase Auth. Sesión persistente con cookies HttpOnly a través de @supabase/ssr.",
    color: "#60a5fa",
  },
  {
    icon: "▦",
    tag: "PostgreSQL",
    title: "Base de datos con RLS",
    desc: "Tabla recordings en PostgreSQL con Row Level Security. Cada usuario solo accede a sus propias grabaciones. Políticas definidas a nivel de base de datos, no de aplicación.",
    color: "#a78bfa",
  },
  {
    icon: "⚙",
    tag: "Backend · Next.js",
    title: "API Routes en el servidor",
    desc: "Endpoint /api/recording-complete recibe la notificación de subida completa, actualiza la DB y encola el job de procesamiento. Nunca expone la service role key al cliente.",
    color: "#fb923c",
  },
  {
    icon: "◈",
    tag: "QStash · Upstash",
    title: "Cola de jobs serverless",
    desc: "QStash entrega los jobs de procesamiento al worker externo con reintentos automáticos y backoff exponencial. Sin Redis persistente ni workers siempre activos en Vercel.",
    color: "#f472b6",
  },
  {
    icon: "▶",
    tag: "Worker · Railway",
    title: "Procesado de vídeo con FFmpeg",
    desc: "Worker Node.js independiente desplegado en Railway. Descarga el WebM, ejecuta FFmpeg (H.264, preset fast, CRF 23, faststart) y genera thumbnail. Escala a cero cuando no hay jobs.",
    color: "#2dd4bf",
  },
  {
    icon: "⛨",
    tag: "Storage Policies",
    title: "Políticas de acceso al almacenamiento",
    desc: "authenticated solo puede escribir en raw-recordings. El worker usa service_role para processed-recordings. Las descargas se sirven con signed URLs de 1 hora de expiración.",
    color: "#facc15",
  },
];

export default function LandingClient() {
  return (
    <div className="landing">

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-noise" aria-hidden />
        <div className="hero-glow" aria-hidden />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Grabación de pantalla · Directo desde el navegador
          </div>

          <h1 className="hero-title">
            Graba.<br />
            <span className="hero-title-accent">Sube. Procesa.</span>
          </h1>

          <p className="hero-sub">
            Sin instalaciones. Sin límites de tiempo. Almacenamiento seguro
            en Supabase y conversión automática a MP4 con FFmpeg en la nube.
          </p>

          <div className="hero-cta">
            <Link href="/auth/register" className="btn-cta-primary">
              Empezar gratis
            </Link>
            <Link href="/recorder" className="btn-cta-ghost">
              Ir al grabador →
            </Link>
          </div>

          <div className="hero-stack">
            {["Next.js 15", "Supabase", "TUS Protocol", "FFmpeg", "QStash", "Railway"].map(t => (
              <span key={t} className="stack-tag">{t}</span>
            ))}
          </div>
        </div>

        {/* Decoración visual: pantalla animada */}
        <div className="hero-visual" aria-hidden>
          <div className="screen-frame">
            <div className="screen-bar">
              <span /><span /><span />
            </div>
            <div className="screen-body">
              <div className="rec-indicator">
                <span className="rec-dot" />
                REC · 00:04:32
              </div>
              <div className="screen-lines">
                {Array.from({length: 6}).map((_, i) => (
                  <div key={i} className="screen-line" style={{width: `${55 + Math.sin(i)*30}%`, animationDelay: `${i*0.15}s`}} />
                ))}
              </div>
              <div className="screen-progress">
                <div className="screen-progress-fill" />
              </div>
              <p className="screen-label">Subiendo — modo TUS resumable</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="features">
        <div className="features-header">
          <span className="section-tag">Arquitectura técnica</span>
          <h2 className="section-title">Construido con las mejores herramientas</h2>
          <p className="section-sub">
            Cada pieza del stack elegida con criterio. Production-ready desde el primer día.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="feature-card"
              style={{ "--card-color": f.color, animationDelay: `${i * 0.07}s` } as React.CSSProperties}
            >
              <div className="card-icon" style={{ color: f.color }}>{f.icon}</div>
              <div className="card-tag">{f.tag}</div>
              <h3 className="card-title">{f.title}</h3>
              <p className="card-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="cta-section">
        <div className="cta-box">
          <h2 className="cta-title">¿Listo para grabar?</h2>
          <p className="cta-sub">Crea tu cuenta gratis y empieza en segundos.</p>
          <div className="cta-actions">
            <Link href="/auth/register" className="btn-cta-primary">Crear cuenta gratis</Link>
            <Link href="/auth/login" className="btn-cta-ghost">Iniciar sesión</Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">GrabadorWeb</span>
            <p className="footer-copy">© 2026 · Reservados todos los derechos</p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <span className="footer-col-title">Autor</span>
              <span className="footer-author">Aitor Sánchez Gutiérrez</span>
            </div>
            <div className="footer-col">
              <span className="footer-col-title">Contacto</span>
              <a href="mailto:blog.cottage627@passinbox.com" className="footer-link">
                blog.cottage627@passinbox.com
              </a>
            </div>
            <div className="footer-col">
              <span className="footer-col-title">En la web</span>
              <a href="https://aitorblog.infinityfreeapp.com" target="_blank" rel="noopener noreferrer" className="footer-link">
                Blog
              </a>
              <a href="https://aitorhub.vercel.app" target="_blank" rel="noopener noreferrer" className="footer-link">
                Más apps →
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        /* ---- Variables ---- */
        :root {
          --bg: #06080e;
          --amber: var(--accent);
          --text-primary: #f1f5f9;
          --text-secondary: #94a3b8;
          --border: #1a2030;
          --surface: #0a0d15;
        }

        .landing {
          background: var(--bg);
          color: var(--text-primary);
          min-height: 100vh;
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          padding-top: 60px; /* navbar height */
          overflow-x: hidden;
        }

        /* ===== HERO ===== */
        .hero {
          position: relative;
          min-height: calc(100vh - 60px);
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 3rem;
          padding: 5rem 4rem 4rem;
          overflow: hidden;
        }

        /* Ruido de fondo sutil */
        .hero-noise {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        /* Glow ámbar en esquina superior izquierda */
        .hero-glow {
          position: absolute; top: -200px; left: -200px;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,106,247,0.07) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .hero-content { position: relative; z-index: 1; }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--accent);
          background: rgba(124,106,247,0.08);
          border: 1px solid rgba(124,106,247,0.2);
          border-radius: 99px; padding: 0.3rem 0.85rem;
          margin-bottom: 1.5rem;
          animation: fadeUp 0.6s ease both;
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        .hero-title {
          font-family: var(--font-sans, sans-serif);
          font-size: clamp(3rem, 6vw, 5.5rem);
          font-weight: 900; line-height: 0.95;
          letter-spacing: -0.04em; color: #fff;
          margin-bottom: 1.25rem;
          animation: fadeUp 0.6s 0.1s ease both;
        }
        .hero-title-accent {
          background: linear-gradient(135deg, var(--accent) 0%, #fb923c 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-size: 1rem; line-height: 1.7; color: var(--text-secondary);
          max-width: 460px; margin-bottom: 2rem;
          animation: fadeUp 0.6s 0.2s ease both;
        }

        .hero-cta {
          display: flex; align-items: center; gap: 1rem;
          flex-wrap: wrap; margin-bottom: 2.5rem;
          animation: fadeUp 0.6s 0.3s ease both;
        }

        .btn-cta-primary {
          padding: 0.8rem 2rem; border-radius: 10px;
          background: var(--accent); color: #000;
          font-weight: 800; font-size: 0.95rem;
          font-family: var(--font-sans, sans-serif);
          text-decoration: none; letter-spacing: -0.01em;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 20px rgba(124,106,247,0.25);
        }
        .btn-cta-primary:hover {
          background: var(--accent-bright); transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(124,106,247,0.4);
        }

        .btn-cta-ghost {
          padding: 0.8rem 1.5rem; border-radius: 10px;
          color: var(--text-secondary); text-decoration: none;
          font-size: 0.9rem; font-weight: 600;
          border: 1px solid var(--border);
          transition: all 0.15s;
        }
        .btn-cta-ghost:hover { color: var(--text-primary); border-color: #374151; }

        .hero-stack {
          display: flex; flex-wrap: wrap; gap: 0.5rem;
          animation: fadeUp 0.6s 0.4s ease both;
        }
        .stack-tag {
          font-size: 0.7rem; font-weight: 600; letter-spacing: 0.05em;
          padding: 0.25rem 0.6rem; border-radius: 6px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border); color: #6b7280;
        }

        /* ===== HERO VISUAL ===== */
        .hero-visual {
          position: relative; z-index: 1;
          display: flex; justify-content: center; align-items: center;
          animation: fadeUp 0.7s 0.35s ease both;
        }
        .screen-frame {
          width: 100%; max-width: 420px;
          background: var(--surface);
          border: 1px solid #1a2030;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,106,247,0.08);
        }
        .screen-bar {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.65rem 0.85rem;
          background: #0d1018; border-bottom: 1px solid #1a2030;
        }
        .screen-bar span {
          width: 10px; height: 10px; border-radius: 50%; background: #1e2433;
        }
        .screen-bar span:nth-child(1) { background: #f87171; }
        .screen-bar span:nth-child(2) { background: var(--accent-bright); }
        .screen-bar span:nth-child(3) { background: #34d399; }

        .screen-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

        .rec-indicator {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.72rem; font-weight: 700; color: #f87171;
          letter-spacing: 0.08em;
        }
        .rec-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #ef4444;
          animation: pulse-dot 1s ease-in-out infinite;
        }

        .screen-lines { display: flex; flex-direction: column; gap: 0.5rem; }
        .screen-line {
          height: 8px; border-radius: 4px;
          background: linear-gradient(90deg, #1a2030 0%, #252d40 100%);
          animation: shimmer 2s ease-in-out infinite alternate;
        }

        .screen-progress {
          height: 4px; background: #1a2030; border-radius: 2px; overflow: hidden;
        }
        .screen-progress-fill {
          height: 100%; width: 68%; border-radius: 2px;
          background: linear-gradient(90deg, var(--accent), #fb923c);
          animation: progress-grow 3s ease-in-out infinite alternate;
        }
        .screen-label {
          font-size: 0.68rem; color: #4b5563; letter-spacing: 0.05em; margin: 0;
        }

        /* ===== FEATURES ===== */
        .features {
          padding: 5rem 4rem;
          background: linear-gradient(180deg, var(--bg) 0%, #080b14 100%);
        }
        .features-header {
          text-align: center; max-width: 600px;
          margin: 0 auto 3.5rem;
        }
        .section-tag {
          display: inline-block; font-size: 0.7rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 0.75rem;
        }
        .section-title {
          font-family: var(--font-sans, sans-serif);
          font-size: clamp(1.8rem, 3.5vw, 2.5rem);
          font-weight: 800; letter-spacing: -0.03em;
          color: #fff; margin-bottom: 0.75rem;
        }
        .section-sub { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.65; }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          max-width: 1100px; margin: 0 auto;
        }

        .feature-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.5rem;
          display: flex; flex-direction: column; gap: 0.5rem;
          position: relative; overflow: hidden;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          animation: fadeUp 0.5s ease both;
        }
        .feature-card::before {
          content: ''; position: absolute;
          inset: 0; border-radius: 14px;
          background: radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--card-color) 8%, transparent), transparent 60%);
          opacity: 0; transition: opacity 0.3s;
          pointer-events: none;
        }
        .feature-card:hover {
          border-color: color-mix(in srgb, var(--card-color) 40%, transparent);
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3),
                      0 0 0 1px color-mix(in srgb, var(--card-color) 15%, transparent);
        }
        .feature-card:hover::before { opacity: 1; }

        .card-icon {
          font-size: 1.4rem; line-height: 1;
          margin-bottom: 0.25rem;
        }
        .card-tag {
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #4b5563;
        }
        .card-title {
          font-family: var(--font-sans, sans-serif);
          font-size: 1rem; font-weight: 700;
          color: #e2e8f0; letter-spacing: -0.01em; margin: 0;
        }
        .card-desc {
          font-size: 0.8rem; line-height: 1.65;
          color: #6b7280; margin: 0;
        }

        /* ===== CTA SECTION ===== */
        .cta-section {
          padding: 5rem 4rem;
          display: flex; justify-content: center;
        }
        .cta-box {
          text-align: center; max-width: 520px;
          padding: 3rem 2.5rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          box-shadow: 0 0 80px rgba(124,106,247,0.06);
          position: relative; overflow: hidden;
        }
        .cta-box::before {
          content: ''; position: absolute;
          top: -100px; left: 50%; transform: translateX(-50%);
          width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,106,247,0.08), transparent 70%);
          pointer-events: none;
        }
        .cta-title {
          font-family: var(--font-sans, sans-serif);
          font-size: 2rem; font-weight: 800;
          color: #fff; letter-spacing: -0.03em; margin-bottom: 0.6rem;
        }
        .cta-sub { font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 1.75rem; }
        .cta-actions { display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap; }

        /* ===== FOOTER ===== */
        .footer {
          border-top: 1px solid var(--border);
          padding: 2.5rem 4rem;
          background: #04060b;
        }
        .footer-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: flex-start;
          justify-content: space-between; flex-wrap: wrap;
          gap: 2rem;
        }
        .footer-brand { display: flex; flex-direction: column; gap: 0.4rem; }
        .footer-logo {
          font-family: var(--font-sans, sans-serif);
          font-size: 1.1rem; font-weight: 800;
          color: var(--accent); letter-spacing: -0.02em;
        }
        .footer-copy { font-size: 0.75rem; color: #374151; }

        .footer-links { display: flex; gap: 3rem; flex-wrap: wrap; }
        .footer-col {
          display: flex; flex-direction: column; gap: 0.35rem;
        }
        .footer-col-title {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #4b5563; margin-bottom: 0.15rem;
        }
        .footer-author { font-size: 0.82rem; color: #6b7280; }
        .footer-link {
          font-size: 0.82rem; color: #6b7280; text-decoration: none;
          transition: color 0.15s;
        }
        .footer-link:hover { color: var(--accent); }

        /* ===== ANIMATIONS ===== */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes shimmer {
          from { opacity: 0.4; }
          to   { opacity: 0.9; }
        }
        @keyframes progress-grow {
          from { width: 40%; }
          to   { width: 85%; }
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
            padding: 3rem 2rem 2rem;
            min-height: auto;
          }
          .hero-visual { display: none; }
          .features { padding: 3rem 1.5rem; }
          .cta-section { padding: 3rem 1.5rem; }
          .footer { padding: 2rem 1.5rem; }
          .footer-inner { flex-direction: column; gap: 1.5rem; }
          .footer-links { gap: 1.5rem; }
        }
        @media (max-width: 480px) {
          .hero { padding: 2.5rem 1rem 1.5rem; }
          .features-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
