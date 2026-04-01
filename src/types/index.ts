// =============================================
// src/types/index.ts
// Tipos TypeScript centralizados para toda la app
// =============================================

export type RecordingStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "paused"
  | "stopping"
  | "uploading"
  | "processing"
  | "ready"
  | "error";

export type UploadMode = "standard" | "resumable";

// Estado interno del hook useScreenRecorder
export interface RecorderState {
  status: RecordingStatus;
  durationSeconds: number;
  sizeMB: number;
  uploadProgress: number; // 0-100
  uploadMode: UploadMode | null;
  error: string | null;
  recordingId: string | null;
  downloadUrl: string | null;
}

export type RecordingQuality = "low" | "medium" | "high";

// Presets de calidad → bitrates
export const QUALITY_PRESETS: Record<RecordingQuality, { video: number; audio: number; label: string; desc: string }> = {
  low:    { video: 400_000,   audio: 48_000,  label: "Baja",  desc: "~1 MB/min" },
  medium: { video: 800_000,   audio: 64_000,  label: "Media", desc: "~2 MB/min" },
  high:   { video: 2_000_000, audio: 128_000, label: "Alta",  desc: "~5 MB/min" },
};

// Opciones de grabación pasadas al hook
export interface RecorderOptions {
  // Umbral en minutos para activar modo resumable con TUS
  resumableThresholdMinutes?: number;
  // Umbral en MB para activar modo resumable
  resumableThresholdMB?: number;
  // Intervalo en ms para generar chunks (timeslice)
  timesliceMs?: number;
  // Incluir audio del sistema
  includeSystemAudio?: boolean;
  // Incluir micrófono
  includeMicrophone?: boolean;
  // Incluir cámara (picture-in-picture)
  includeCamera?: boolean;
  // Calidad de grabación
  quality?: RecordingQuality;
  // Temporizador: detener automáticamente a los N segundos (0 = sin límite)
  autoStopSeconds?: number;
}

// Registro en la tabla `recordings` de PostgreSQL
export interface Recording {
  id: string;
  user_id: string;
  status: "raw" | "processing" | "ready" | "error";
  raw_path: string | null;
  processed_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  size_bytes: number | null;
  title: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Payload enviado al endpoint /api/recording-complete
export interface RecordingCompletePayload {
  recording_id: string;
  raw_path: string;
  duration_seconds: number;
  size_bytes: number;
}

// Payload del job encolado en Redis/QStash
export interface ProcessingJob {
  recording_id: string;
  raw_path: string;
  user_id: string;
  priority?: number;
}

// Respuesta de /api/recordings (listado)
export interface RecordingsResponse {
  recordings: Recording[];
  total: number;
  page: number;
}

// Opciones para el cliente TUS
export interface TusUploadOptions {
  file: Blob;
  fileName: string;
  recordingId: string;
  accessToken: string;
  onProgress: (percentage: number) => void;
  onSuccess: (objectPath: string) => void;
  onError: (error: Error) => void;
}
