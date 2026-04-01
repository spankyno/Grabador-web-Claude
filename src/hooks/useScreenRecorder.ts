// =============================================
// src/hooks/useScreenRecorder.ts
// Hook principal que gestiona toda la lógica de grabación
// Maneja: captura de pantalla, chunks, detección de umbrales,
// y selección automática entre upload directo o TUS resumable
// =============================================

"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadWithTus, uploadDirect } from "@/lib/tus-upload";
import type { RecorderState, RecorderOptions } from "@/types";

// Umbrales por defecto para activar modo resumable
const DEFAULT_RESUMABLE_THRESHOLD_MINUTES = 8;
const DEFAULT_RESUMABLE_THRESHOLD_MB = 250;
// Intervalo de chunks para liberar RAM (20 segundos)
const DEFAULT_TIMESLICE_MS = 20_000;

const initialState: RecorderState = {
  status: "idle",
  durationSeconds: 0,
  sizeMB: 0,
  uploadProgress: 0,
  uploadMode: null,
  error: null,
  recordingId: null,
  downloadUrl: null,
};

export function useScreenRecorder(options: RecorderOptions = {}) {
  const {
    resumableThresholdMinutes = DEFAULT_RESUMABLE_THRESHOLD_MINUTES,
    resumableThresholdMB = DEFAULT_RESUMABLE_THRESHOLD_MB,
    timesliceMs = DEFAULT_TIMESLICE_MS,
    includeSystemAudio = true,
    includeMicrophone = false,
    includeCamera = false,
  } = options;

  const [state, setState] = useState<RecorderState>(initialState);

  // Refs para no provocar re-renders en cada chunk
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalSizeBytesRef = useRef<number>(0);
  const tusUploadRef = useRef<import("tus-js-client").Upload | null>(null);

  // Limpia recursos al desmontar el componente
  useEffect(() => {
    return () => {
      stopTimer();
      stopStreams();
    };
  }, []);

  const updateState = useCallback((updates: Partial<RecorderState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStreams = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    cameraStreamRef.current = null;
  };

  /**
   * Solicita permisos y comienza la grabación.
   * Combina pantalla + audio del sistema + micrófono + cámara según opciones.
   */
  const startRecording = useCallback(async () => {
    try {
      updateState({ status: "requesting", error: null });

      // 1. Capturar pantalla (con audio del sistema si está disponible)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 30, max: 60 },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: includeSystemAudio
          ? {
              echoCancellation: false,
              noiseSuppression: false,
              sampleRate: 44100,
            }
          : false,
      });

      const tracks: MediaStreamTrack[] = [...displayStream.getTracks()];

      // 2. Agregar micrófono si se solicita
      if (includeMicrophone) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
            },
          });
          micStream.getAudioTracks().forEach((t) => tracks.push(t));
        } catch {
          console.warn("[Recorder] No se pudo acceder al micrófono, continuando sin él");
        }
      }

      // 3. Agregar cámara (picture-in-picture) si se solicita
      if (includeCamera) {
        try {
          const camStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, frameRate: 15 },
          });
          cameraStreamRef.current = camStream;
          camStream.getVideoTracks().forEach((t) => tracks.push(t));
        } catch {
          console.warn("[Recorder] No se pudo acceder a la cámara, continuando sin ella");
        }
      }

      // 4. Combinar todos los tracks en un stream unificado
      const combinedStream = new MediaStream(tracks);
      streamRef.current = combinedStream;

      // 5. Detectar el mejor codec disponible en el navegador
      const mimeType = getSupportedMimeType();

      // 6. Crear el MediaRecorder con timeslice para generar chunks periódicos
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        // 800kbps es suficiente para pantalla (texto/UI con poca variación).
        // Subir a 1_500_000 si grabas vídeo con mucho movimiento.
        videoBitsPerSecond: 800_000,
        audioBitsPerSecond: 64_000,
      });

      // Acumular chunks y medir tamaño total
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          totalSizeBytesRef.current += event.data.size;
          updateState({
            sizeMB: +(totalSizeBytesRef.current / (1024 * 1024)).toFixed(1),
          });
        }
      };

      // Cuando el usuario cierra la ventana/pestaña compartida
      displayStream.getVideoTracks()[0].addEventListener("ended", () => {
        if (
          mediaRecorderRef.current?.state === "recording" ||
          mediaRecorderRef.current?.state === "paused"
        ) {
          stopRecording();
        }
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      totalSizeBytesRef.current = 0;
      startTimeRef.current = Date.now();

      // 7. Iniciar con timeslice para generar chunks periódicos (libera RAM)
      mediaRecorder.start(timesliceMs);
      updateState({ status: "recording", recordingId: null });

      // 8. Timer para mostrar la duración en tiempo real
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        updateState({ durationSeconds: elapsed });
      }, 1000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar grabación";

      // El usuario canceló la selección de pantalla — no es un error real
      if (message.includes("Permission denied") || message.includes("NotAllowedError")) {
        updateState({ status: "idle", error: null });
      } else {
        updateState({ status: "error", error: message });
      }
      console.error("[Recorder] Error al iniciar:", err);
    }
  }, [
    includeSystemAudio,
    includeMicrophone,
    includeCamera,
    timesliceMs,
    updateState,
  ]);

  /**
   * Pausa la grabación (si el navegador lo soporta)
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      stopTimer();
      updateState({ status: "paused" });
    }
  }, [updateState]);

  /**
   * Reanuda la grabación pausada
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      // Recalcular startTime para que el timer sea preciso
      startTimeRef.current =
        Date.now() - state.durationSeconds * 1000;
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        updateState({ durationSeconds: elapsed });
      }, 1000);
      updateState({ status: "recording" });
    }
  }, [state.durationSeconds, updateState]);

  /**
   * Detiene la grabación y dispara el proceso de subida
   */
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    updateState({ status: "stopping" });
    stopTimer();

    // Forzar último chunk antes de parar
    await new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = () => resolve();
      mediaRecorderRef.current!.stop();
    });

    stopStreams();

    const chunks = chunksRef.current;
    if (chunks.length === 0) {
      updateState({ status: "error", error: "No se grabó ningún contenido" });
      return;
    }

    // Ensamblar todos los chunks en un solo Blob WebM
    const mimeType = getSupportedMimeType();
    const blob = new Blob(chunks, { type: mimeType });
    const durationSeconds = Math.floor(
      (Date.now() - startTimeRef.current) / 1000
    );

    // Limpiar chunks de memoria RAM
    chunksRef.current = [];

    await handleUpload(blob, durationSeconds);
  }, [updateState]);

  /**
   * Decide el modo de subida (directo vs TUS) según umbrales
   * y ejecuta la subida correspondiente
   */
  const handleUpload = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      try {
        const supabase = createClient();

        // Obtener sesión del usuario
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          updateState({
            status: "error",
            error: "Debes iniciar sesión para guardar grabaciones",
          });
          return;
        }

        // Generar ID único para esta grabación
        const recordingId = crypto.randomUUID();
        const fileName = `recording-${Date.now()}.webm`;
        const sizeMB = blob.size / (1024 * 1024);

        // Crear registro en la base de datos con status "raw"
        const { error: dbError } = await supabase.from("recordings").insert({
          id: recordingId,
          user_id: session.user.id,
          status: "raw",
          duration_seconds: durationSeconds,
          size_bytes: blob.size,
          title: `Grabación ${new Date().toLocaleString("es-ES")}`,
        });

        if (dbError) {
          console.error("[Recorder] Error al crear registro DB:", dbError);
          // Continuamos igualmente — el registro puede crearse al completar la subida
        }

        updateState({
          status: "uploading",
          recordingId,
          uploadProgress: 0,
        });

        // Determinar si usar TUS resumable basándonos en umbrales
        const useResumable =
          durationSeconds / 60 >= resumableThresholdMinutes ||
          sizeMB >= resumableThresholdMB;

        console.log(
          `[Recorder] Modo de subida: ${useResumable ? "TUS resumable" : "directo"}`,
          { durationSeconds, sizeMB }
        );

        updateState({ uploadMode: useResumable ? "resumable" : "standard" });

        let objectPath: string;

        if (useResumable) {
          // --- SUBIDA TUS RESUMABLE ---
          objectPath = await new Promise<string>((resolve, reject) => {
            tusUploadRef.current = uploadWithTus({
              file: blob,
              fileName,
              recordingId,
              accessToken: session.access_token,
              onProgress: (pct) => updateState({ uploadProgress: pct }),
              onSuccess: resolve,
              onError: reject,
            });
          });
        } else {
          // --- SUBIDA DIRECTA ---
          objectPath = await uploadDirect(
            blob,
            fileName,
            recordingId,
            session.access_token,
            (pct) => updateState({ uploadProgress: pct })
          );
        }

        // Notificar al backend que la subida terminó → encola procesamiento
        updateState({ status: "processing", uploadProgress: 100 });

        const response = await fetch("/api/recording-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recording_id: recordingId,
            raw_path: objectPath,
            duration_seconds: durationSeconds,
            size_bytes: blob.size,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Error al notificar al servidor");
        }

        updateState({
          status: "ready",
          recordingId,
          // La URL procesada se generará asíncronamente en el worker
          downloadUrl: null,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error durante la subida";
        console.error("[Recorder] Error en upload:", err);
        updateState({ status: "error", error: message });
      }
    },
    [resumableThresholdMinutes, resumableThresholdMB, updateState]
  );

  /**
   * Aborta una subida TUS en progreso
   */
  const abortUpload = useCallback(() => {
    if (tusUploadRef.current) {
      tusUploadRef.current.abort();
      tusUploadRef.current = null;
    }
    updateState(initialState);
  }, [updateState]);

  /**
   * Resetea el estado al inicial
   */
  const reset = useCallback(() => {
    abortUpload();
    stopTimer();
    stopStreams();
    chunksRef.current = [];
    totalSizeBytesRef.current = 0;
    setState(initialState);
  }, [abortUpload]);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    abortUpload,
    reset,
    // Referencia al stream de pantalla para previsualización
    screenStream: streamRef,
    cameraStream: cameraStreamRef,
  };
}

// Detecta el codec WebM más adecuado disponible en el navegador
function getSupportedMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log(`[Recorder] Usando codec: ${type}`);
      return type;
    }
  }

  return "video/webm";
}
