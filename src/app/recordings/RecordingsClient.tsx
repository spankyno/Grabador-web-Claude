"use client";

// =============================================
// src/app/recordings/RecordingsClient.tsx
// Componente cliente: listado de grabaciones con polling
// =============================================

import { useEffect, useState, useCallback } from "react";
import type { Recording } from "@/types";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  raw:        { label: "Subido",       color: "var(--accent)" },
  processing: { label: "Procesando…",  color: "var(--accent)" },
  ready:      { label: "Listo",        color: "var(--green, #34d399)" },
  error:      { label: "Error",        color: "#f87171" },
};

export default function RecordingsClient() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRecordings = useCallback(async () => {
    try {
      const res = await fetch("/api/recordings");
      if (!res.ok) throw new Error("Error al cargar grabaciones");
      const data = await res.json();
      setRecordings(data.recordings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordings();

    // Polling cada 8 segundos si hay grabaciones procesando
    const interval = setInterval(() => {
      const hasProcessing = recordings.some(
        (r) => r.status === "processing" || r.status === "raw"
      );
      if (hasProcessing) fetchRecordings();
    }, 8_000);

    return () => clearInterval(interval);
  }, [fetchRecordings, recordings]);

  const handleRetry = async (id: string) => {
    setRetrying(id);
    try {
      const res = await fetch(`/api/recordings/${id}/retry`, { method: "POST" });
      if (!res.ok) throw new Error("Error al reintentar");
      await fetchRecordings();
    } catch {
      alert("No se pudo reintentar. Comprueba las variables de entorno QSTASH_TOKEN y WORKER_ENDPOINT en Vercel.");
    } finally {
      setRetrying(null);
    }
  };

  const handleDownload = async (rec: Recording) => {
    const type = rec.processed_url ? "processed" : "raw";
    const res = await fetch(`/api/signed-url?id=${rec.id}&type=${type}`);
    if (!res.ok) return alert("No se pudo generar el enlace de descarga");
    const { url } = await res.json();
    window.open(url, "_blank");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta grabación? Esta acción no se puede deshacer.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/recordings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setRecordings(prev => prev.filter(r => r.id !== id));
    } catch {
      alert("No se pudo eliminar la grabación.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <main className="page">
      <div className="page-header">
        <a href="/" className="back-link">← Grabar</a>
        <h1>Mis grabaciones</h1>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner" />
          <p>Cargando…</p>
        </div>
      ) : error ? (
        <div className="empty-state error">
          <p>{error}</p>
          <button onClick={fetchRecordings} className="btn-secondary">Reintentar</button>
        </div>
      ) : recordings.length === 0 ? (
        <div className="empty-state">
          <p>Aún no tienes grabaciones.</p>
          <a href="/" className="btn-primary">Hacer mi primera grabación →</a>
        </div>
      ) : (
        <div className="recordings-grid">
          {recordings.map((rec) => {
            const status = STATUS_LABELS[rec.status] ?? STATUS_LABELS.error;
            return (
              <div key={rec.id} className="recording-card">
                {/* Thumbnail */}
                <div className="card-thumb">
                  {rec.thumbnail_url ? (
                    <img src={rec.thumbnail_url} alt={rec.title ?? "Grabación"} />
                  ) : (
                    <div className="thumb-placeholder">
                      {rec.status === "processing" && <div className="spinner sm" />}
                    </div>
                  )}
                  <span
                    className="status-chip"
                    style={{ "--chip-color": status.color } as React.CSSProperties}
                  >
                    {status.label}
                  </span>
                  {rec.duration_seconds && (
                    <span className="duration-chip">
                      {formatDuration(rec.duration_seconds)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="card-body">
                  <p className="card-title">{rec.title ?? "Grabación sin título"}</p>
                  <p className="card-meta">
                    {formatDate(rec.created_at)} · {formatBytes(rec.size_bytes)}
                  </p>
                  {rec.error_message && (
                    <p className="card-error" title={rec.error_message}>
                      ⚠ {rec.error_message.substring(0, 60)}…
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="card-actions">
                  {rec.status === "ready" && (
                    <button
                      className="btn-primary sm"
                      onClick={() => handleDownload(rec)}
                    >
                      ↓ Descargar MP4
                    </button>
                  )}
                  {rec.status === "error" && (
                    <>
                      <button
                        className="btn-retry sm"
                        onClick={() => handleRetry(rec.id)}
                        disabled={retrying === rec.id}
                      >
                        {retrying === rec.id ? "…" : "↺ Reintentar"}
                      </button>
                      {rec.raw_path && (
                        <button
                          className="btn-secondary sm"
                          onClick={() => handleDownload(rec)}
                        >
                          ↓ WebM
                        </button>
                      )}
                    </>
                  )}
                  {rec.status === "raw" && (
                    <>
                      <button
                        className="btn-retry sm"
                        onClick={() => handleRetry(rec.id)}
                        disabled={retrying === rec.id}
                      >
                        {retrying === rec.id ? "…" : "↺ Procesar"}
                      </button>
                      <button
                        className="btn-secondary sm"
                        onClick={() => handleDownload(rec)}
                      >
                        ↓ WebM original
                      </button>
                    </>
                  )}
                  <button
                    className="btn-delete sm"
                    onClick={() => handleDelete(rec.id)}
                    disabled={deleting === rec.id}
                    title="Eliminar grabación"
                  >
                    {deleting === rec.id ? "…" : "✕"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .page {
          max-width: 960px;
          margin: 0 auto;
          padding: 2rem 1rem;
          font-family: 'DM Sans', sans-serif;
          color: #f1f5f9;
        }
        .page-header {
          display: flex;
          align-items: baseline;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        h1 { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.03em; }
        .back-link {
          font-size: 0.82rem;
          color: #6b7280;
          text-decoration: none;
        }
        .back-link:hover { color: #94a3b8; }

        .recordings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }
        .recording-card {
          background: #0f1117;
          border: 1.5px solid #1e2433;
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .recording-card:hover { border-color: #374151; }

        .card-thumb {
          position: relative;
          width: 100%;
          aspect-ratio: 16/9;
          background: #080b12;
          overflow: hidden;
        }
        .card-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .thumb-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #374151;
        }
        .status-chip {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          background: color-mix(in srgb, var(--chip-color) 20%, #000);
          border: 1px solid color-mix(in srgb, var(--chip-color) 40%, transparent);
          color: var(--chip-color);
        }
        .duration-chip {
          position: absolute;
          bottom: 0.5rem;
          right: 0.5rem;
          font-size: 0.72rem;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          background: rgba(0,0,0,0.7);
          color: #e2e8f0;
        }

        .card-body {
          padding: 0.75rem 1rem 0.5rem;
        }
        .card-title {
          font-size: 0.88rem;
          font-weight: 600;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 0.25rem;
        }
        .card-meta {
          font-size: 0.72rem;
          color: #6b7280;
        }
        .card-error {
          font-size: 0.72rem;
          color: #f87171;
          margin-top: 0.35rem;
        }

        .card-actions {
          padding: 0.5rem 1rem 0.75rem;
          display: flex;
          gap: 0.5rem;
          align-items: center;
          min-height: 44px;
        }

        .btn-primary {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          font-family: inherit;
          background: #3b82f6;
          color: #fff;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: #2563eb; }
        .btn-primary.sm { padding: 0.4rem 0.75rem; font-size: 0.78rem; }

        .btn-secondary {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          font-family: inherit;
          background: transparent;
          color: #94a3b8;
          border: 1.5px solid #1e2433;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-secondary:hover { border-color: #374151; color: #e2e8f0; }
        .btn-secondary.sm { padding: 0.4rem 0.75rem; font-size: 0.78rem; }
        .btn-retry {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          font-family: inherit;
          background: rgba(124,106,247,0.12);
          color: var(--accent);
          border: 1.5px solid rgba(245, 158, 11, 0.3);
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-retry:hover:not(:disabled) { background: rgba(124,106,247,0.2); border-color: var(--accent); }
        .btn-retry:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-retry.sm { padding: 0.4rem 0.75rem; font-size: 0.78rem; }
        .btn-delete {
          padding: 0.35rem 0.6rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-family: inherit;
          background: transparent;
          color: #94a3b8;
          border: 1.5px solid #2d3748;
          cursor: pointer;
          transition: all 0.15s;
          margin-left: auto;
          line-height: 1;
        }
        .btn-delete:hover:not(:disabled) { color: #f87171; border-color: rgba(248,113,113,0.5); background: rgba(248,113,113,0.08); }
        .btn-delete:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-delete.sm { padding: 0.35rem 0.55rem; font-size: 0.78rem; }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 4rem 2rem;
          color: #6b7280;
          font-size: 0.9rem;
          text-align: center;
        }
        .empty-state.error { color: #f87171; }

        .spinner {
          width: 24px; height: 24px;
          border: 2px solid #1e2433;
          border-top-color: #94a3b8;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .spinner.sm { width: 16px; height: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 480px) {
          .recordings-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
