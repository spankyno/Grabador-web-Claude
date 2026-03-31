// =============================================
// src/app/auth/login/page.tsx
// Página de login — usa Supabase Auth con magic link
// También soporta OAuth con Google/GitHub
// =============================================

"use client";

// Forzar rendering dinámico — en build time no hay variables de entorno
// de Supabase disponibles, lo que causa el error de prerender.
export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Grabador Web</h1>
        <p className="auth-subtitle">Inicia sesión para guardar tus grabaciones</p>

        {sent ? (
          <div className="sent-state">
            <div className="sent-icon">✉</div>
            <p>Revisa tu email</p>
            <p className="sent-hint">
              Te hemos enviado un enlace mágico a <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleMagicLink} className="auth-form">
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
                autoFocus
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <span className="spinner sm" /> : "Continuar con email"}
              </button>
            </form>

            <div className="divider">
              <span>o</span>
            </div>

            <div className="oauth-buttons">
              <button className="btn-oauth" onClick={() => handleOAuth("google")}>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
                </svg>
                Google
              </button>
              <button className="btn-oauth" onClick={() => handleOAuth("github")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12"/>
                </svg>
                GitHub
              </button>
            </div>

            {error && <p className="auth-error">{error}</p>}
          </>
        )}
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080b12;
          padding: 1rem;
          font-family: 'IBM Plex Mono', monospace;
        }
        .auth-card {
          width: 100%;
          max-width: 380px;
          background: #0f1117;
          border: 1.5px solid #1e2433;
          border-radius: 16px;
          padding: 2.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .auth-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.03em;
          margin-bottom: 0;
        }
        .auth-subtitle {
          font-size: 0.82rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-top: 0.5rem;
        }
        .auth-input {
          padding: 0.7rem 1rem;
          border-radius: 9px;
          background: #080b12;
          border: 1.5px solid #1e2433;
          color: #f1f5f9;
          font-size: 0.9rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s;
        }
        .auth-input:focus { border-color: #3b82f6; }
        .auth-input::placeholder { color: #374151; }
        .btn-primary {
          padding: 0.7rem 1.25rem;
          border-radius: 9px;
          background: #3b82f6;
          color: #fff;
          border: none;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background 0.15s;
        }
        .btn-primary:hover:not(:disabled) { background: #2563eb; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #374151;
          font-size: 0.78rem;
          margin: 0.25rem 0;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #1e2433;
        }
        .oauth-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
        }
        .btn-oauth {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.6rem;
          border-radius: 9px;
          background: transparent;
          border: 1.5px solid #1e2433;
          color: #94a3b8;
          font-size: 0.84rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-oauth:hover {
          background: rgba(255,255,255,0.03);
          border-color: #374151;
          color: #e2e8f0;
        }
        .auth-error {
          font-size: 0.78rem;
          color: #f87171;
          padding: 0.5rem 0.75rem;
          background: rgba(248, 113, 113, 0.08);
          border-radius: 6px;
          border: 1px solid rgba(248, 113, 113, 0.2);
        }
        .sent-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          padding: 1.5rem 0;
          text-align: center;
          color: #94a3b8;
          font-size: 0.88rem;
        }
        .sent-icon {
          font-size: 2rem;
          margin-bottom: 0.25rem;
        }
        .sent-hint { font-size: 0.78rem; color: #6b7280; }
        .sent-hint strong { color: #94a3b8; }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .spinner.sm { width: 16px; height: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
