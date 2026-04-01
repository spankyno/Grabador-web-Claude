// =============================================
// worker/src/index.ts
// Worker externo de procesamiento de vídeo con FFmpeg
// Deploy recomendado: Railway, Fly.io, o Render con Docker
//
// Este proceso:
// 1. Recibe jobs de QStash (o BullMQ)
// 2. Descarga el WebM de Supabase Storage
// 3. Convierte a MP4 con FFmpeg (H.264 + AAC)
// 4. Genera thumbnail
// 5. Sube los resultados a processed-recordings
// 6. Actualiza el registro en la DB
// =============================================

import express from "express";
import { createClient } from "@supabase/supabase-js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { createWriteStream, createReadStream, promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pipeline } from "node:stream/promises";
import type { ProcessingJob } from "./types";

// Configurar FFmpeg con el binario estático incluido en el paquete
if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);

// NO crear el cliente Supabase a nivel de módulo — si las variables
// de entorno no están disponibles al arrancar, el proceso crashea.
// Se crea lazy dentro de cada función que lo necesita.
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      `Variables de entorno faltantes: ${!url ? "NEXT_PUBLIC_SUPABASE_URL" : ""} ${!key ? "SUPABASE_SERVICE_ROLE_KEY" : ""}`.trim()
    );
  }
  return createClient(url, key);
}

const app = express();
app.use(express.json());

// =============================================
// POST /process
// Endpoint que recibe jobs de QStash
// QStash reintenta automáticamente si el worker falla
// =============================================
app.post("/process", async (req, res) => {
  // Verificar la firma de QStash para seguridad
  // En producción: usar @upstash/qstash para verificar
  const job = req.body as ProcessingJob;

  console.log(`[Worker] Iniciando procesamiento: ${job.recording_id}`);

  // Responder inmediatamente para que QStash no haga timeout
  // El procesamiento continúa en background
  res.json({ accepted: true, recording_id: job.recording_id });

  // Procesar en background (no bloquear la respuesta HTTP)
  processVideo(job).catch((err) => {
    console.error(`[Worker] Error fatal en ${job.recording_id}:`, err);
  });
});

// =============================================
// Función principal de procesamiento
// =============================================
async function processVideo(job: ProcessingJob): Promise<void> {
  const { recording_id, raw_path, user_id } = job;
  const tmpDir = join(tmpdir(), `rec-${recording_id}`);
  const supabase = getSupabase();

  try {
    await fs.mkdir(tmpDir, { recursive: true });

    // --- 1. Generar URL firmada para descargar el WebM original ---
    console.log(`[Worker] Generando signed URL para: ${raw_path}`);
    const { data: signedData, error: signError } = await supabase
      .storage
      .from("raw-recordings")
      .createSignedUrl(raw_path, 3600); // 1 hora de validez

    if (signError || !signedData) {
      throw new Error(`Error generando signed URL: ${signError?.message}`);
    }

    // --- 2. Descargar el archivo WebM ---
    const inputPath = join(tmpDir, "input.webm");
    console.log(`[Worker] Descargando WebM...`);

    const downloadResponse = await fetch(signedData.signedUrl);
    if (!downloadResponse.ok || !downloadResponse.body) {
      throw new Error(`Error al descargar WebM: ${downloadResponse.status}`);
    }

    await pipeline(
      downloadResponse.body as unknown as NodeJS.ReadableStream,
      createWriteStream(inputPath)
    );

    const inputStats = await fs.stat(inputPath);
    console.log(`[Worker] WebM descargado: ${(inputStats.size / 1024 / 1024).toFixed(1)} MB`);

    // --- 3. Convertir WebM → MP4 con FFmpeg ---
    const outputMp4 = join(tmpDir, "output.mp4");

    await convertToMp4(inputPath, outputMp4);
    console.log(`[Worker] MP4 generado: ${outputMp4}`);

    // --- 4. Generar thumbnail ---
    const thumbnailPath = join(tmpDir, "thumbnail.jpg");
    await generateThumbnail(inputPath, thumbnailPath);
    console.log(`[Worker] Thumbnail generado`);

    // --- 5. Subir MP4 al bucket processed-recordings ---
    const mp4ObjectName = `${user_id}/${recording_id}/video.mp4`;
    const thumbnailObjectName = `${user_id}/${recording_id}/thumbnail.jpg`;

    const mp4Buffer = await fs.readFile(outputMp4);
    const { error: mp4UploadError } = await supabase
      .storage
      .from("processed-recordings")
      .upload(mp4ObjectName, mp4Buffer, {
        contentType: "video/mp4",
        upsert: true,
        cacheControl: "31536000", // 1 año de caché
      });

    if (mp4UploadError) {
      throw new Error(`Error subiendo MP4: ${mp4UploadError.message}`);
    }

    // --- 6. Subir thumbnail ---
    const thumbBuffer = await fs.readFile(thumbnailPath);
    const { error: thumbUploadError } = await supabase
      .storage
      .from("processed-recordings")
      .upload(thumbnailObjectName, thumbBuffer, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "31536000",
      });

    if (thumbUploadError) {
      console.warn(`[Worker] Error subiendo thumbnail: ${thumbUploadError.message}`);
      // No fallamos — el MP4 es lo importante
    }

    // --- 7. Obtener URLs públicas de los archivos subidos ---
    const { data: mp4PublicUrl } = supabase
      .storage
      .from("processed-recordings")
      .getPublicUrl(mp4ObjectName);

    const { data: thumbPublicUrl } = supabase
      .storage
      .from("processed-recordings")
      .getPublicUrl(thumbnailObjectName);

    // --- 8. Obtener duración del vídeo procesado ---
    const duration = await getVideoDuration(outputMp4);

    // --- 9. Actualizar registro en la base de datos ---
    const { error: dbError } = await supabase
      .from("recordings")
      .update({
        status: "ready",
        processed_url: mp4PublicUrl.publicUrl,
        thumbnail_url: thumbPublicUrl.publicUrl,
        duration_seconds: Math.round(duration),
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recording_id);

    if (dbError) {
      throw new Error(`Error actualizando DB: ${dbError.message}`);
    }

    console.log(`[Worker] ✅ Procesamiento completado: ${recording_id}`);

    // Opcional: eliminar el WebM original para ahorrar almacenamiento
    // await supabase.storage.from("raw-recordings").remove([raw_path]);

  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(`[Worker] ❌ Error procesando ${recording_id}:`, message);

    // Actualizar el registro con el error
    await supabase
      .from("recordings")
      .update({
        status: "error",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recording_id);

    // Relanzar el error para que QStash reintente si corresponde
    throw error;
  } finally {
    // Limpiar archivos temporales
    await fs.rm(tmpDir, { recursive: true, force: true });
    console.log(`[Worker] Archivos temporales eliminados: ${tmpDir}`);
  }
}

// =============================================
// FFmpeg: Conversión WebM → MP4
// superfast: mejor compresión que ultrafast, RAM similar.
// CRF 32 + mono audio = archivos pequeños para contenido de pantalla.
// =============================================
function convertToMp4(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec("libx264")
      .outputOptions([
        "-preset superfast",
        "-crf 32",
        "-movflags +faststart",
        "-profile:v baseline",
        "-level 3.1",
        "-pix_fmt yuv420p",
        "-threads 1",
        "-vf scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease",
      ])
      .audioCodec("aac")
      .audioBitrate("64k")
      .audioChannels(1)  // mono — el audio de pantalla no necesita stereo
      .format("mp4")
      .on("start", (cmd) => {
        console.log(`[FFmpeg] Comando: ${cmd.substring(0, 120)}...`);
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          console.log(`[FFmpeg] Progreso: ${Math.round(progress.percent)}%`);
        }
      })
      .on("end", () => {
        console.log("[FFmpeg] Conversión completada");
        resolve();
      })
      .on("error", (err) => {
        console.error("[FFmpeg] Error:", err.message);
        reject(new Error(`FFmpeg falló: ${err.message}`));
      })
      .save(outputPath);
  });
}

// =============================================
// FFmpeg: Generar thumbnail del vídeo
// =============================================
function generateThumbnail(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      // Capturar frame a los 3 segundos (o al inicio si es más corto)
      .seekInput("00:00:03")
      .frames(1)
      // Redimensionar a 640x360 manteniendo aspect ratio
      .videoFilter("scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2")
      .format("image2")
      .outputOptions(["-q:v 3"]) // Calidad JPEG (2=mejor, 5=peor)
      .on("end", () => resolve())
      .on("error", (err) => {
        // Si falla a los 3s (vídeo corto), intentar con frame 0
        console.warn("[FFmpeg] Thumbnail a 3s falló, intentando con frame 0");
        ffmpeg(inputPath)
          .seekInput(0)
          .frames(1)
          .videoFilter("scale=640:360:force_original_aspect_ratio=decrease")
          .format("image2")
          .on("end", () => resolve())
          .on("error", (err2) => reject(new Error(`Thumbnail falló: ${err2.message}`)))
          .save(outputPath);
      })
      .save(outputPath);
  });
}

// =============================================
// Obtener duración del vídeo con ffprobe
// =============================================
function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.warn("[ffprobe] No se pudo obtener duración:", err.message);
        resolve(0);
      } else {
        resolve(metadata.format.duration ?? 0);
      }
    });
  });
}

// =============================================
// Health check endpoint
// =============================================
app.get("/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = parseInt(process.env.PORT ?? "3001");
app.listen(PORT, () => {
  console.log(`[Worker] Servidor iniciado en puerto ${PORT}`);
  console.log(`[Worker] FFmpeg path: ${ffmpegStatic ?? "system"}`);
  // Verificar variables de entorno al arrancar
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(`[Worker] NEXT_PUBLIC_SUPABASE_URL: ${hasUrl ? "✓ presente" : "✗ FALTA"}`);
  console.log(`[Worker] SUPABASE_SERVICE_ROLE_KEY: ${hasKey ? "✓ presente" : "✗ FALTA"}`);
  if (!hasUrl || !hasKey) {
    console.error("[Worker] ⚠ Variables de entorno faltantes — el procesamiento fallará");
  }
});
