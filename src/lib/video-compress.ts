// Browser-native video compression using MediaRecorder + Canvas.
// No wasm/ffmpeg — keeps the bundle lean and the site fast.

export type CompressResult = {
  video: Blob;
  poster: Blob;
  durationSec: number;
  width: number;
  height: number;
  mimeType: string;
  ext: string; // "webm" | "mp4"
};

export const MAX_INPUT_BYTES = 200 * 1024 * 1024; // 200 MB
export const MAX_OUTPUT_BYTES = 20 * 1024 * 1024; //  20 MB safety cap
export const MAX_DURATION_SEC = 60;
export const TARGET_LONG_EDGE = 720;
export const TARGET_BITRATE = 1_800_000; // ~1.8 Mbps

function pickMimeType(): { mime: string; ext: string } {
  const candidates: Array<{ mime: string; ext: string }> = [
    { mime: "video/webm;codecs=vp9,opus", ext: "webm" },
    { mime: "video/webm;codecs=vp8,opus", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
    { mime: "video/mp4", ext: "mp4" },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return { mime: "", ext: "" };
}

export function isCompressionSupported() {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  const canvas = document.createElement("canvas");
  return typeof (canvas as HTMLCanvasElement & { captureStream?: () => MediaStream }).captureStream === "function";
}

export async function compressVideo(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<CompressResult> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error(`That file is too large (max ${Math.floor(MAX_INPUT_BYTES / 1024 / 1024)} MB).`);
  }
  const picked = pickMimeType();
  if (!picked.mime) {
    throw new Error("Your browser can't compress video here. Try Chrome, Edge, or Firefox.");
  }

  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    await new Promise<void>((res, rej) => {
      video.onloadedmetadata = () => res();
      video.onerror = () => rej(new Error("Couldn't read that video file."));
    });

    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      throw new Error("Invalid video file.");
    }
    if (video.duration > MAX_DURATION_SEC) {
      throw new Error(`Please keep videos under ${MAX_DURATION_SEC} seconds.`);
    }

    const srcW = video.videoWidth || 1280;
    const srcH = video.videoHeight || 720;
    const long = Math.max(srcW, srcH);
    const scale = long > TARGET_LONG_EDGE ? TARGET_LONG_EDGE / long : 1;
    const width = Math.max(2, Math.round((srcW * scale) / 2) * 2);
    const height = Math.max(2, Math.round((srcH * scale) / 2) * 2);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported in this browser.");

    // Poster frame at 10% (or 1s max)
    const posterAt = Math.min(1, video.duration * 0.1);
    await seek(video, posterAt);
    ctx.drawImage(video, 0, 0, width, height);
    const poster = await canvasToBlob(canvas, "image/jpeg", 0.82);

    // Rewind
    await seek(video, 0);

    const captureStream = (
      canvas as HTMLCanvasElement & { captureStream: (fps?: number) => MediaStream }
    ).captureStream(30);

    // Route the video's audio to the recorder via WebAudio.
    let audioTracks: MediaStreamTrack[] = [];
    try {
      const AC = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new AC();
      const source = ac.createMediaElementSource(video);
      const dest = ac.createMediaStreamDestination();
      source.connect(dest);
      audioTracks = dest.stream.getAudioTracks();
    } catch {
      // Some files (cross-origin, previously connected element) can't be tapped — record silent.
    }

    const combined = new MediaStream([...captureStream.getVideoTracks(), ...audioTracks]);

    const recorder = new MediaRecorder(combined, {
      mimeType: picked.mime,
      videoBitsPerSecond: TARGET_BITRATE,
      audioBitsPerSecond: 96_000,
    });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    };

    const stopped = new Promise<Blob>((res) => {
      recorder.onstop = () => res(new Blob(chunks, { type: picked.mime }));
    });

    // Keep the canvas painted while the video plays.
    let raf = 0;
    const paint = () => {
      if (!video.paused && !video.ended) {
        ctx.drawImage(video, 0, 0, width, height);
        raf = requestAnimationFrame(paint);
      }
    };

    recorder.start(500);
    await video.play();
    raf = requestAnimationFrame(paint);

    const progressTimer = window.setInterval(() => {
      if (video.duration > 0) {
        onProgress?.(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
      }
    }, 250);

    await new Promise<void>((res) => {
      video.onended = () => res();
    });

    cancelAnimationFrame(raf);
    window.clearInterval(progressTimer);
    recorder.stop();

    const out = await stopped;

    if (out.size > MAX_OUTPUT_BYTES) {
      throw new Error(
        `Compressed video is still ${(out.size / 1024 / 1024).toFixed(1)} MB — please trim it shorter.`,
      );
    }

    onProgress?.(100);

    return {
      video: out,
      poster,
      durationSec: Math.round(video.duration),
      width,
      height,
      mimeType: picked.mime,
      ext: picked.ext,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function seek(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((res, rej) => {
    const done = () => {
      video.removeEventListener("seeked", done);
      res();
    };
    video.addEventListener("seeked", done, { once: true });
    try {
      video.currentTime = t;
    } catch (e) {
      rej(e as Error);
    }
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, q: number): Promise<Blob> {
  return new Promise((res, rej) => {
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("Failed to encode poster image."))),
      type,
      q,
    );
  });
}
