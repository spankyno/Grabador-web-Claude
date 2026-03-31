"use client";
// =============================================
// src/components/Navbar.tsx
// Barra de navegación con estado de autenticación Supabase.
// Muestra login/registro si no hay sesión, o avatar + menú si la hay.
// =============================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
    window.location.href = "/";
  };

  // Inicial del email para el avatar
  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link href="/" className="nav-logo">
        <span className="nav-logo-icon">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="11" cy="11" r="4.5" fill="var(--amber)"/>
          </svg>
        </span>
        <span className="nav-logo-text">GrabadorWeb</span>
      </Link>

      {/* Acciones */}
      <div className="nav-actions">
        {!mounted ? null : user ? (
          // --- Usuario autenticado ---
          <div className="nav-user">
            <Link href="/recorder" className="nav-btn nav-btn-ghost">
              Grabar
            </Link>
            <Link href="/recordings" className="nav-btn nav-btn-ghost">
              Biblioteca
            </Link>
            <div className="nav-avatar-wrap">
              <button
                className="nav-avatar"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menú de usuario"
                title={user.email ?? ""}
              >
                {initial}
              </button>
              {menuOpen && (
                <div className="nav-dropdown">
                  <p className="nav-dropdown-email">{user.email}</p>
                  <hr className="nav-dropdown-divider" />
                  <Link href="/recordings" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>
                    Mi biblioteca
                  </Link>
                  <button className="nav-dropdown-item danger" onClick={handleSignOut}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // --- Sin sesión ---
          <div className="nav-auth">
            <Link href="/auth/login" className="nav-btn nav-btn-ghost">
              Iniciar sesión
            </Link>
            <Link href="/auth/register" className="nav-btn nav-btn-primary">
              Crear cuenta
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 60px;
          background: rgba(6, 8, 14, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
          color: var(--text-primary, #f1f5f9);
        }
        .nav-logo-icon { color: var(--amber, #f59e0b); display: flex; }
        .nav-logo-text {
          font-family: var(--font-syne, sans-serif);
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .nav-actions { display: flex; align-items: center; }
        .nav-auth, .nav-user {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-btn {
          padding: 0.4rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: var(--font-mono, monospace);
          text-decoration: none;
          transition: all 0.15s;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
        }
        .nav-btn-ghost {
          color: #94a3b8;
          background: transparent;
        }
        .nav-btn-ghost:hover { color: #f1f5f9; background: rgba(255,255,255,0.05); }
        .nav-btn-primary {
          background: var(--amber, #f59e0b);
          color: #000;
        }
        .nav-btn-primary:hover { background: #fbbf24; transform: translateY(-1px); }

        /* Avatar */
        .nav-avatar-wrap { position: relative; }
        .nav-avatar {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: var(--amber, #f59e0b);
          color: #000;
          font-size: 0.8rem;
          font-weight: 700;
          font-family: var(--font-syne, sans-serif);
          border: none;
          cursor: pointer;
          transition: transform 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-avatar:hover { transform: scale(1.08); }

        /* Dropdown */
        .nav-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 200px;
          background: #0f1117;
          border: 1px solid #1e2433;
          border-radius: 10px;
          padding: 0.5rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }
        .nav-dropdown-email {
          font-size: 0.72rem;
          color: #6b7280;
          padding: 0.4rem 0.6rem;
          font-family: var(--font-mono, monospace);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .nav-dropdown-divider {
          border: none;
          border-top: 1px solid #1e2433;
          margin: 0.3rem 0;
        }
        .nav-dropdown-item {
          display: block;
          width: 100%;
          padding: 0.5rem 0.6rem;
          border-radius: 6px;
          font-size: 0.84rem;
          color: #94a3b8;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-mono, monospace);
          text-align: left;
          transition: all 0.12s;
        }
        .nav-dropdown-item:hover { background: rgba(255,255,255,0.05); color: #f1f5f9; }
        .nav-dropdown-item.danger { color: #f87171; }
        .nav-dropdown-item.danger:hover { background: rgba(248,113,113,0.08); }

        @media (max-width: 520px) {
          .navbar { padding: 0 1rem; }
          .nav-logo-text { display: none; }
          .nav-btn-ghost:not(.always-show) { display: none; }
        }
      `}</style>
    </nav>
  );
}
