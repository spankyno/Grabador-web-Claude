"use client";
// =============================================
// src/components/recorder/RecorderUI.tsx
// UI rediseñada: paleta violeta/teal, DM Sans,
// selector de calidad y temporizador automático.
// =============================================

import { useRef, useEffect, useState } from "react";
import { useScreenRecorder } from "@/hooks/useScreenRecorder";
import { QUALITY_PRESETS } from "@/types";
import type { RecorderOptions, RecordingQuality } from "@/types";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const TIMER_OPTIONS = [
  { value: 0,    label: "Sin límite" },
  { value: 300,  label: "5 min" },
  { value: 600,  label: "10 min" },
  { value: 900,  label: "15 min" },
  { value: 1800, label: "30 min" },
  { value: 3600, label: "1 hora" },
  { value: 7200, label: "2 horas" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; pulse: boolean }> = {
  idle:       { label: "Listo para grabar",       color: "var(--text-muted)",    pulse: false },
  requesting: { label: "Solicitando permisos…",   color: "var(--accent)",        pulse: true  },
  recording:  { label: "Grabando",                color: "var(--red)",           pulse: true  },
  paused:     { label: "Pausado",                 color: "var(--accent)",        pulse: false },
  stopping:   { label: "Finalizando…",            color: "var(--accent)",        pulse: true  },
  uploading:  { label: "Subiendo grabación…",     color: "var(--teal)",          pulse: true  },
  processing: { label: "Procesando en servidor…", color: "var(--accent-bright)", pulse: true  },
  ready:      { label: "¡Grabación lista!",       color: "var(--green)",         pulse: false },
  error:      { label: "Error",                   color: "var(--red)",           pulse: false },
};

interface RecorderUIProps { options?: RecorderOptions; }

export default function RecorderUI({ options }: RecorderUIProps) {
  const [quality, setQuality] = useState<RecordingQuality>("medium");
  const [autoStopSeconds, setAutoStopSeconds] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [audioOpts, setAudioOpts] = useState({ includeSystemAudio: true, includeMicrophone: false });
  const [videoSource, setVideoSource] = useState<"screen" | "webcam" | "both">("screen");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerDisplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detectar si hay sesión — RecorderLoader pasa isGuest como prop
  const isGuest = (options as RecorderOptions & { isGuest?: boolean }).isGuest ?? false;

  const recOptions: RecorderOptions = {
    ...options,
    quality,
    autoStopSeconds: isGuest ? 0 : autoStopSeconds, // guest usa límite interno de 2min
    guestMode: isGuest,
    videoSource,
    includeSystemAudio: audioOpts.includeSystemAudio,
    includeMicrophone: audioOpts.includeMicrophone,
  };

  const { state, startRecording, stopRecording, pauseRecording, resumeRecording, abortUpload, reset, screenStream } = useScreenRecorder(recOptions);
  const previewRef = useRef<HTMLVideoElement>(null);

  const handleGuestDownload = () => {
    if (!state.guestBlob) return;
    const url = URL.createObjectURL(state.guestBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grabacion-${new Date().toISOString().slice(0,19).replace(/[T:]/g, "-")}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (previewRef.current && screenStream.current && state.status === "recording") {
      previewRef.current.srcObject = screenStream.current;
    } else if (previewRef.current && state.status !== "recording" && state.status !== "paused") {
      previewRef.current.srcObject = null;
    }
  }, [state.status, screenStream]);

  useEffect(() => {
    if (state.status === "recording" && autoStopSeconds > 0) {
      if (timerDisplayRef.current) clearInterval(timerDisplayRef.current);
      timerDisplayRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const left = autoStopSeconds - state.durationSeconds;
          return left >= 0 ? left : 0;
        });
      }, 500);
      setTimeLeft(autoStopSeconds - state.durationSeconds);
    } else {
      if (timerDisplayRef.current) clearInterval(timerDisplayRef.current);
      if (state.status !== "recording") setTimeLeft(null);
    }
    return () => { if (timerDisplayRef.current) clearInterval(timerDisplayRef.current); };
  }, [state.status, autoStopSeconds, state.durationSeconds]);

  const sc = STATUS_CONFIG[state.status] ?? STATUS_CONFIG.idle;
  const isRecording = state.status === "recording";
  const isPaused = state.status === "paused";
  const isUploading = state.status === "uploading" || state.status === "processing";
  const isIdle = state.status === "idle" || state.status === "error";
  const isReady = state.status === "ready";

  return (
    <div className="recorder">

      {/* STATUS */}
      <div className="status-row">
        <div className="status-badge" style={{ "--sc": sc.color } as React.CSSProperties}>
          {sc.pulse && <span className="status-ring" />}
          <span className="status-dot" />
          <span>{sc.label}</span>
        </div>
        {isRecording && autoStopSeconds > 0 && timeLeft !== null && (
          <div className="countdown">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Para en {formatDuration(Math.max(0, timeLeft))}
          </div>
        )}
      </div>

      {/* PREVIEW */}
      <div className="preview-wrap">
        {(isRecording || isPaused) ? (
          <>
            <video ref={previewRef} autoPlay muted playsInline className="preview-video" />
            {isPaused && <div className="preview-overlay">⏸ Pausado</div>}
            {isRecording && (
              <div className="preview-hud">
                <span className="hud-rec">● REC</span>
                <span className="hud-time">{formatDuration(state.durationSeconds)}</span>
                <span className="hud-size">{state.sizeMB} MB</span>
              </div>
            )}
          </>
        ) : isUploading ? (
          <div className="preview-placeholder">
            <div className="upload-icon">
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                <path d="M20 28V12M20 12L13 19M20 12L27 19" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="8" y1="32" x2="32" y2="32" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="ph-title">{state.status === "processing" ? "Procesando con FFmpeg…" : "Subiendo grabación…"}</p>
            {state.status === "uploading" && (
              <div className="progress-track"><div className="progress-fill" style={{ width: `${state.uploadProgress}%` }} /></div>
            )}
            {state.status === "processing" && <div className="spinner" />}
          </div>
        ) : isReady ? (
          <div className="preview-placeholder">
            <div className="ready-icon">✓</div>
            <p className="ph-title">{isGuest ? "¡Grabación lista!" : "Grabación guardada"}</p>
            {isGuest ? (
              <p className="ph-note" style={{fontSize:".72rem",color:"var(--text-muted)"}}>
                Duración: {String(Math.floor(state.durationSeconds/60)).padStart(2,"0")}:{String(state.durationSeconds%60).padStart(2,"0")} · WebM Format
              </p>
            ) : (
              <a href="/recordings" className="btn-link">Ver en mi biblioteca →</a>
            )}
          </div>
        ) : state.error ? (
          <div className="preview-placeholder">
            <span style={{ fontSize: "2rem" }}>⚠</span>
            <p className="ph-title" style={{ color: "#fca5a5" }}>{state.error}</p>
          </div>
        ) : (
          <div className="preview-placeholder idle">
            <svg width="52" height="52" viewBox="0 0 56 56" fill="none" opacity=".2">
              <rect x="4" y="10" width="40" height="28" rx="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M44 20l8-5v26l-8-5V20z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <line x1="16" y1="46" x2="40" y2="46" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="28" y1="38" x2="28" y2="46" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="ph-note">Selecciona pantalla, ventana o pestaña</p>
          </div>
        )}
      </div>

      {/* CONTROLES */}
      <div className="controls-row">
        {!isUploading && !isReady && (
          <button
            className={`btn-record ${isRecording || isPaused ? "stop" : "start"}`}
            onClick={() => { if (isIdle) startRecording(); else stopRecording(); }}
            disabled={state.status === "requesting" || state.status === "stopping"}
          >
            {state.status === "requesting" || state.status === "stopping"
              ? <span className="spinner sm" />
              : isRecording || isPaused
              ? <><span className="bi">■</span> Detener</>
              : <><span className="bi rec">●</span> Grabar</>
            }
          </button>
        )}
        {isRecording && <button className="btn-sec" onClick={pauseRecording}>⏸ Pausar</button>}
        {isPaused && <button className="btn-sec" onClick={resumeRecording}>▶ Reanudar</button>}
        {isUploading && state.status === "uploading" && <button className="btn-danger" onClick={abortUpload}>Cancelar</button>}
        {(state.error || isReady) && <button className="btn-sec" onClick={reset}>Nueva grabación</button>}
        {isReady && isGuest && state.guestBlob && (
          <>
            <button className="btn-record start" onClick={handleGuestDownload}>
              ↓ Descargar WebM
            </button>
          </>
        )}
      </div>

      {/* OPCIONES */}
      {isIdle && (
        <div className="opts-panel">
          <div className="opt-group">
            <span className="opt-label">Fuente de vídeo</span>
            <div className="source-grid">
              {([
                { value: "screen", icon: "🖥", label: "Pantalla" },
                { value: "webcam", icon: "📷", label: "Webcam" },
                { value: "both",   icon: "⊞",  label: "Ambas" },
              ] as const).map(src => (
                <button key={src.value} className={`src-btn ${videoSource === src.value ? "active" : ""}`} onClick={() => setVideoSource(src.value)}>
                  <span className="src-icon">{src.icon}</span>
                  <span className="src-label">{src.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="opt-group">
            <span className="opt-label">Calidad de grabación</span>
            <div className="quality-grid">
              {(["low", "medium", "high"] as RecordingQuality[]).map(q => (
                <button key={q} className={`q-btn ${quality === q ? "active" : ""}`} onClick={() => setQuality(q)}>
                  <span className="q-name">{QUALITY_PRESETS[q].label}</span>
                  <span className="q-size">{QUALITY_PRESETS[q].desc}</span>
                </button>
              ))}
            </div>
          </div>

          {!isGuest && <div className="opt-group">
            <span className="opt-label">Parar automáticamente</span>
            <div className="timer-grid">
              {TIMER_OPTIONS.map(opt => (
                <button key={opt.value} className={`t-btn ${autoStopSeconds === opt.value ? "active" : ""}`} onClick={() => setAutoStopSeconds(opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>}

          <button className="adv-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? "▲" : "▼"} Audio y cámara
          </button>
          {showAdvanced && (
            <div className="adv-opts">
              <label className="chk-row">
                <input type="checkbox" checked={audioOpts.includeSystemAudio} onChange={e => setAudioOpts(p => ({ ...p, includeSystemAudio: e.target.checked }))} />
                <span>Audio del sistema / pestaña</span>
              </label>
              <label className="chk-row">
                <input type="checkbox" checked={audioOpts.includeMicrophone} onChange={e => setAudioOpts(p => ({ ...p, includeMicrophone: e.target.checked }))} />
                <span>Micrófono</span>
              </label>
            </div>
          )}
        </div>
      )}

      {state.uploadMode === "resumable" && isUploading && (
        <p className="info-note">🔄 Subida resumable — continúa si se pierde la conexión</p>
      )}

      <style>{`
        .recorder { display:flex; flex-direction:column; gap:1.2rem; width:100%; max-width:740px; margin:0 auto; padding:1.5rem; font-family:var(--font-sans,'DM Sans',sans-serif); }

        /* status */
        .status-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.5rem; }
        .status-badge { display:inline-flex; align-items:center; gap:.4rem; font-size:.76rem; font-weight:500; padding:.28rem .75rem; border-radius:99px; background:color-mix(in srgb,var(--sc) 12%,transparent); border:1px solid color-mix(in srgb,var(--sc) 28%,transparent); color:var(--sc); position:relative; }
        .status-dot { width:6px; height:6px; border-radius:50%; background:var(--sc); flex-shrink:0; }
        .status-ring { position:absolute; left:.75rem; width:6px; height:6px; border-radius:50%; background:var(--sc); animation:ring 1.5s ease-out infinite; }
        .countdown { display:flex; align-items:center; gap:.3rem; font-size:.74rem; font-weight:600; color:var(--teal); font-family:var(--font-mono,monospace); }

        /* preview */
        .preview-wrap { position:relative; width:100%; aspect-ratio:16/9; border-radius:14px; overflow:hidden; background:var(--surface); border:1.5px solid var(--border); }
        .preview-video { width:100%; height:100%; object-fit:contain; background:#000; }
        .preview-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.5); font-size:1.15rem; font-weight:600; color:#fff; }
        .preview-hud { position:absolute; bottom:0; left:0; right:0; display:flex; align-items:center; gap:.7rem; padding:.45rem .8rem; background:linear-gradient(0deg,rgba(0,0,0,.65) 0%,transparent 100%); }
        .hud-rec { font-size:.68rem; font-weight:700; color:var(--red); letter-spacing:.1em; animation:pulse-rec 1.2s ease-in-out infinite; }
        .hud-time { font-family:var(--font-mono,monospace); font-size:.82rem; font-weight:500; color:#fff; letter-spacing:.04em; }
        .hud-size { font-size:.7rem; color:#94a3b8; margin-left:auto; }

        .preview-placeholder { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.8rem; padding:2rem; text-align:center; }
        .ph-title { font-size:.88rem; font-weight:500; color:var(--text-secondary); }
        .ph-note { font-size:.76rem; color:var(--text-muted); }
        .upload-icon { animation:float 2s ease-in-out infinite; }
        .progress-track { width:100%; max-width:260px; height:4px; background:var(--border2); border-radius:2px; overflow:hidden; }
        .progress-fill { height:100%; background:linear-gradient(90deg,var(--accent),var(--teal)); border-radius:2px; transition:width .4s ease; }
        .ready-icon { width:50px; height:50px; border-radius:50%; background:rgba(52,211,153,.1); border:2px solid var(--green); display:flex; align-items:center; justify-content:center; font-size:1.4rem; color:var(--green); }
        .btn-link { font-size:.8rem; font-weight:600; color:var(--accent-bright); text-decoration:none; }
        .btn-link:hover { opacity:.8; }

        /* controls */
        .controls-row { display:flex; gap:.65rem; flex-wrap:wrap; align-items:center; }
        .btn-record { display:inline-flex; align-items:center; gap:.45rem; padding:.72rem 1.9rem; border-radius:10px; font-size:.97rem; font-weight:600; font-family:inherit; border:none; cursor:pointer; transition:all .18s; }
        .btn-record:disabled { opacity:.5; cursor:not-allowed; }
        .btn-record.start { background:var(--accent); color:#fff; box-shadow:0 4px 18px rgba(124,106,247,.3); }
        .btn-record.start:hover:not(:disabled) { background:var(--accent-bright); transform:translateY(-1px); box-shadow:0 6px 24px rgba(124,106,247,.45); }
        .btn-record.stop { background:var(--surface2); color:var(--text-primary); border:1.5px solid var(--border2); }
        .btn-record.stop:hover:not(:disabled) { background:#151827; border-color:#333b55; }
        .bi { font-size:.75em; }
        .bi.rec { color:var(--red); }
        .btn-sec { display:inline-flex; align-items:center; gap:.35rem; padding:.6rem 1.1rem; border-radius:10px; font-size:.85rem; font-weight:500; font-family:inherit; background:transparent; color:var(--text-secondary); border:1.5px solid var(--border2); cursor:pointer; text-decoration:none; transition:all .15s; }
        .btn-sec:hover { background:var(--surface2); color:var(--text-primary); border-color:#333b55; }
        .btn-danger { padding:.6rem 1.1rem; border-radius:10px; font-size:.85rem; font-weight:500; font-family:inherit; background:transparent; color:var(--red); border:1.5px solid rgba(240,98,146,.3); cursor:pointer; transition:all .15s; }
        .btn-danger:hover { background:rgba(240,98,146,.07); border-color:var(--red); }

        /* options panel */
        .opts-panel { display:flex; flex-direction:column; gap:.9rem; padding:1.1rem 1.2rem; background:var(--surface); border:1.5px solid var(--border); border-radius:12px; }
        .opt-group { display:flex; flex-direction:column; gap:.45rem; }
        .opt-label { font-size:.68rem; font-weight:600; letter-spacing:.09em; text-transform:uppercase; color:var(--text-muted); }

        .source-grid { display:flex; gap:.45rem; }
        .src-btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:.2rem; padding:.55rem .4rem; border-radius:8px; background:var(--surface2); border:1.5px solid var(--border2); cursor:pointer; transition:all .15s; }
        .src-btn:hover { border-color:var(--accent-border); }
        .src-btn.active { background:var(--accent-dim); border-color:var(--accent); }
        .src-icon { font-size:1.1rem; line-height:1; }
        .src-label { font-size:.72rem; font-weight:600; color:var(--text-secondary); }
        .src-btn.active .src-label { color:var(--accent-bright); }
        .quality-grid { display:flex; gap:.45rem; }
        .q-btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:.18rem; padding:.55rem .4rem; border-radius:8px; background:var(--surface2); border:1.5px solid var(--border2); cursor:pointer; transition:all .15s; }
        .q-btn:hover { border-color:var(--accent-border); }
        .q-btn.active { background:var(--accent-dim); border-color:var(--accent); }
        .q-name { font-size:.82rem; font-weight:600; color:var(--text-primary); }
        .q-btn.active .q-name { color:var(--accent-bright); }
        .q-size { font-size:.65rem; color:var(--text-muted); font-family:var(--font-mono,monospace); }
        .q-btn.active .q-size { color:var(--accent); }

        .timer-grid { display:flex; flex-wrap:wrap; gap:.35rem; }
        .t-btn { padding:.3rem .65rem; border-radius:7px; font-size:.76rem; font-weight:500; font-family:inherit; background:var(--surface2); border:1.5px solid var(--border2); color:var(--text-secondary); cursor:pointer; transition:all .15s; }
        .t-btn:hover { border-color:var(--accent-border); color:var(--text-primary); }
        .t-btn.active { background:var(--teal-dim); border-color:var(--teal); color:var(--teal); }

        .adv-toggle { background:none; border:none; padding:0; font-size:.75rem; color:var(--text-muted); font-family:inherit; cursor:pointer; width:fit-content; transition:color .15s; }
        .adv-toggle:hover { color:var(--text-secondary); }
        .adv-opts { display:flex; flex-direction:column; gap:.45rem; padding:.65rem .8rem; background:var(--surface2); border-radius:8px; border:1px solid var(--border); }
        .chk-row { display:flex; align-items:center; gap:.5rem; font-size:.82rem; color:var(--text-secondary); cursor:pointer; }
        .chk-row input { accent-color:var(--accent); width:14px; height:14px; }

        .info-note { font-size:.75rem; color:var(--text-muted); background:rgba(45,212,191,.05); border:1px solid rgba(45,212,191,.15); border-radius:8px; padding:.5rem .8rem; margin:0; }

        .spinner { width:20px; height:20px; border:2px solid var(--border2); border-top-color:var(--accent); border-radius:50%; animation:spin .7s linear infinite; }
        .spinner.sm { width:15px; height:15px; }

        @keyframes ring { 0%{transform:scale(1);opacity:1} 100%{transform:scale(3.5);opacity:0} }
        @keyframes pulse-rec { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

        @media(max-width:520px){
          .recorder{padding:1rem;gap:1rem;}
          .quality-grid{gap:.3rem;}
          .btn-record{padding:.65rem 1.4rem;}
        }
      `}</style>
    </div>
  );
}
