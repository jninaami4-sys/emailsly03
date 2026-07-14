/**
 * Client-side image compression for profile avatars.
 *
 * - Downscales to a max dimension (default 512px) using a high-quality
 *   two-pass canvas resize so faces stay sharp.
 * - Re-encodes to WebP (falling back to JPEG) at high quality (~0.9).
 * - Corrects EXIF orientation via createImageBitmap when available.
 *
 * The output is typically 30-80 KB for a 512px avatar — small enough for
 * fast loads while preserving perceptual quality.
 */

export type CompressedImage = {
  blob: Blob;
  ext: "webp" | "jpg";
  width: number;
  height: number;
  bytes: number;
};

export type CompressOptions = {
  maxDimension?: number;
  quality?: number;
  preferWebp?: boolean;
};

async function loadBitmap(file: Blob): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; close?: () => void }> {
  if (typeof createImageBitmap === "function") {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" as ImageOrientation });
    return {
      width: bmp.width,
      height: bmp.height,
      draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h),
      close: () => bmp.close(),
    };
  }
  // Fallback: HTMLImageElement
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to load image"));
      el.src = url;
    });
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
    };
  } finally {
    // Revoke after draw completes — done in caller via close()
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<CompressedImage> {
  const maxDim = opts.maxDimension ?? 512;
  const quality = opts.quality ?? 0.9;
  const preferWebp = opts.preferWebp ?? true;

  const src = await loadBitmap(file);
  try {
    const scale = Math.min(1, maxDim / Math.max(src.width, src.height));
    let curW = src.width;
    let curH = src.height;
    const targetW = Math.max(1, Math.round(src.width * scale));
    const targetH = Math.max(1, Math.round(src.height * scale));

    // Two-pass downscale — one big step then final — avoids the "canvas soft
    // downscale" aliasing that hurts perceived sharpness of faces.
    let canvas = document.createElement("canvas");
    canvas.width = curW;
    canvas.height = curH;
    let ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not available");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    src.draw(ctx, curW, curH);

    while (curW * 0.5 > targetW) {
      const nextW = Math.round(curW * 0.5);
      const nextH = Math.round(curH * 0.5);
      const next = document.createElement("canvas");
      next.width = nextW;
      next.height = nextH;
      const nctx = next.getContext("2d")!;
      nctx.imageSmoothingEnabled = true;
      nctx.imageSmoothingQuality = "high";
      nctx.drawImage(canvas, 0, 0, nextW, nextH);
      canvas = next;
      ctx = nctx;
      curW = nextW;
      curH = nextH;
    }

    if (curW !== targetW || curH !== targetH) {
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = targetW;
      finalCanvas.height = targetH;
      const fctx = finalCanvas.getContext("2d")!;
      fctx.imageSmoothingEnabled = true;
      fctx.imageSmoothingQuality = "high";
      fctx.drawImage(canvas, 0, 0, targetW, targetH);
      canvas = finalCanvas;
    }

    let blob: Blob | null = null;
    let ext: "webp" | "jpg" = "jpg";
    if (preferWebp) {
      blob = await canvasToBlob(canvas, "image/webp", quality);
      if (blob) ext = "webp";
    }
    if (!blob) {
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
      ext = "jpg";
    }
    if (!blob) throw new Error("Image encoding failed");

    return { blob, ext, width: canvas.width, height: canvas.height, bytes: blob.size };
  } finally {
    src.close?.();
  }
}
