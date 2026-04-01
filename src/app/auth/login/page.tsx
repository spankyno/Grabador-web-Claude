"use client";

export const metadata = {
  title: "Iniciar sesión",
  robots: { index: false },
};

// =============================================
// src/app/auth/login/page.tsx
// Login con email + contraseña únicamente (sin OAuth)
// =============================================

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message.includes("Invalid login")
          ? "Email o contraseña incorrectos"
          : error.message
      );
      setLoading(false);
    } else {
      window.location.href = "/recorder";
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-back">← Volver</Link>
        <h1 className="auth-title">Bienvenido</h1>
        <p className="auth-subtitle">Inicia sesión en tu cuenta</p>

        <form onSubmit={handleLogin} className="auth-form">
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required className="auth-input" autoFocus />
          <input type="password" placeholder="Contraseña" value={password}
            onChange={e => setPassword(e.target.value)} required className="auth-input" />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : "Entrar"}
          </button>
          <p className="auth-switch">
            ¿Sin cuenta? <Link href="/auth/register">Crear una gratis</Link>
          </p>
        </form>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh; display: flex; align-items: center;
          justify-content: center; padding: 1rem;
          background: var(--bg, #06080e);
        }
        .auth-card {
          width: 100%; max-width: 380px;
          background: #0a0d15; border: 1px solid #1a2030;
          border-radius: 16px; padding: 2.5rem 2rem;
          display: flex; flex-direction: column; gap: 0.6rem;
          box-shadow: 0 0 60px rgba(245,158,11,0.04);
        }
        .auth-back { font-size: 0.78rem; color: #4b5563; text-decoration: none; margin-bottom: 0.5rem; }
        .auth-back:hover { color: #94a3b8; }
        .auth-title {
          font-family: var(--font-sans, 'DM Sans', sans-serif);
          font-size: 1.6rem; font-weight: 800;
          color: #f1f5f9; letter-spacing: -0.03em;
        }
        .auth-subtitle { font-size: 0.82rem; color: #6b7280; margin-bottom: 0.5rem; }
        .auth-form { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.25rem; }
        .auth-input {
          padding: 0.7rem 1rem; border-radius: 9px;
          background: #06080e; border: 1px solid #1a2030;
          color: #f1f5f9; font-size: 0.9rem;
          font-family: var(--font-sans, 'DM Sans', sans-serif); outline: none;
          transition: border-color 0.15s;
        }
        .auth-input:focus { border-color: var(--accent); }
        .auth-input::placeholder { color: #2d3748; }
        .auth-error {
          font-size: 0.78rem; color: #f87171;
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.2);
          border-radius: 6px; padding: 0.5rem 0.75rem;
        }
        .auth-submit {
          margin-top: 0.25rem; padding: 0.75rem;
          border-radius: 9px; background: var(--accent);
          color: #000; font-weight: 700; font-size: 0.95rem;
          font-family: var(--font-sans, 'DM Sans', sans-serif);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, transform 0.15s;
        }
        .auth-submit:hover:not(:disabled) { background: var(--accent-bright); transform: translateY(-1px); }
        .auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .auth-switch { font-size: 0.8rem; color: #6b7280; text-align: center; }
        .auth-switch a { color: var(--accent); text-decoration: none; }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(0,0,0,0.2); border-top-color: #000;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
