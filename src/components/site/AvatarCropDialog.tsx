import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

/**
 * Square avatar cropper with pan + zoom.
 *
 * Renders the source image on a 320px square canvas the user drags to
 * frame. On apply, the framed area is rendered to an off-screen 512px
 * canvas (matching the downstream compressor target) and returned as a
 * File — the caller then runs it through the normal compress+upload flow.
 */
export function AvatarCropDialog({
  file,
  open,
  onCancel,
  onApply,
  outputSize = 512,
}: {
  file: File | null;
  open: boolean;
  onCancel: () => void;
  onApply: (cropped: File) => void;
  outputSize?: number;
}) {
  const CANVAS = 320; // on-screen crop viewport (square)
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [minScale, setMinScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Load image whenever file changes
  useEffect(() => {
    if (!file || !open) {
      setImg(null);
      return;
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    const el = new Image();
    el.onload = () => {
      const fit = CANVAS / Math.min(el.naturalWidth, el.naturalHeight);
      setMinScale(fit);
      setScale(fit);
      // Center image in viewport
      setOffset({
        x: (CANVAS - el.naturalWidth * fit) / 2,
        y: (CANVAS - el.naturalHeight * fit) / 2,
      });
      setImg(el);
    };
    el.src = url;
    return () => {
      URL.revokeObjectURL(url);
      objectUrlRef.current = null;
    };
  }, [file, open]);

  // Clamp offsets so the image always covers the crop viewport
  function clamp(next: { x: number; y: number }, s = scale, image = img) {
    if (!image) return next;
    const w = image.naturalWidth * s;
    const h = image.naturalHeight * s;
    const minX = CANVAS - w;
    const minY = CANVAS - h;
    return {
      x: Math.min(0, Math.max(minX, next.x)),
      y: Math.min(0, Math.max(minY, next.y)),
    };
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset(clamp({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }));
  }
  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
  }

  function handleScale(next: number) {
    if (!img) return;
    const clamped = Math.min(minScale * 4, Math.max(minScale, next));
    // Zoom around the viewport center to feel natural.
    const cx = CANVAS / 2;
    const cy = CANVAS / 2;
    const ratio = clamped / scale;
    const nextOffset = {
      x: cx - (cx - offset.x) * ratio,
      y: cy - (cy - offset.y) * ratio,
    };
    setScale(clamped);
    setOffset(clamp(nextOffset, clamped));
  }

  function reset() {
    if (!img) return;
    setScale(minScale);
    setOffset({
      x: (CANVAS - img.naturalWidth * minScale) / 2,
      y: (CANVAS - img.naturalHeight * minScale) / 2,
    });
  }

  async function apply() {
    if (!img || !file) return;
    // Map viewport coords back to source pixels.
    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    const sSize = CANVAS / scale;
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize);
    const blob: Blob | null = await new Promise((r) =>
      canvas.toBlob((b) => r(b), "image/png"),
    );
    if (!blob) return;
    const base = file.name.replace(/\.[^.]+$/, "") || "avatar";
    const cropped = new File([blob], `${base}-cropped.png`, { type: "image/png" });
    onApply(cropped);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onCancel}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Crop your photo"
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-[0_32px_64px_-24px_oklch(0.52_0.24_293/0.35)]"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet via-neon-orange to-emerald"
        />
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              Crop
            </p>
            <h3 className="font-display text-base font-bold">Frame your photo</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 p-5">
          {/* Crop viewport */}
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="relative touch-none overflow-hidden rounded-2xl border border-border bg-black/40"
            style={{ width: CANVAS, height: CANVAS, cursor: dragRef.current ? "grabbing" : "grab" }}
          >
            {img ? (
              <img
                src={img.src}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: img.naturalWidth * scale,
                  height: img.naturalHeight * scale,
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                Loading…
              </div>
            )}
            {/* Circle mask overlay (visual only) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow: `0 0 0 9999px color-mix(in oklab, var(--background) 65%, transparent) inset`,
                clipPath: "circle(50% at 50% 50%)",
                WebkitClipPath: "circle(50% at 50% 50%)",
                mixBlendMode: "normal",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-violet/70"
              style={{ margin: 0 }}
            />
          </div>

          {/* Zoom controls */}
          <div className="flex w-full items-center gap-3">
            <button
              type="button"
              onClick={() => handleScale(scale / 1.15)}
              aria-label="Zoom out"
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <ZoomOut className="size-4" />
            </button>
            <input
              type="range"
              min={minScale}
              max={minScale * 4}
              step={(minScale * 3) / 100 || 0.01}
              value={scale}
              onChange={(e) => handleScale(parseFloat(e.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-violet"
              aria-label="Zoom"
            />
            <button
              type="button"
              onClick={() => handleScale(scale * 1.15)}
              aria-label="Zoom in"
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              type="button"
              onClick={reset}
              aria-label="Reset framing"
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Drag to reposition · scroll or use the slider to zoom
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 bg-muted/30 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!img}
            className="rounded-xl bg-violet px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_oklch(0.52_0.24_293/0.6)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Apply crop
          </button>
        </div>
      </div>
    </div>
  );
}
