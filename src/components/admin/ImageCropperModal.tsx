import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, Crop as CropIcon, X } from "lucide-react";

type Props = {
  file: File;
  aspect: number; // e.g. 16/9 or 1
  aspectLabel: string; // "16:9" | "1:1"
  onCancel: () => void;
  onConfirm: (blob: Blob, filename: string) => void | Promise<void>;
};

async function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function cropToBlob(src: string, area: Area, mime: string): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode image"))),
      mime,
      0.92,
    );
  });
}

export function ImageCropperModal({ file, aspect, aspectLabel, onCancel, onConfirm }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  // load on mount
  useState(() => {
    readAsDataURL(file).then(setSrc);
    return undefined;
  });

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  const confirm = async () => {
    if (!src || !area) return;
    setBusy(true);
    try {
      const mime = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
      const blob = await cropToBlob(src, area, mime);
      const base = file.name.replace(/\.[^.]+$/, "") || "image";
      const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      await onConfirm(blob, `${base}-cropped.${ext}`);
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    setBusy(true);
    try {
      await onConfirm(file, file.name);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <CropIcon className="size-4 text-violet" />
            <h3 className="text-sm font-semibold">Crop image ({aspectLabel})</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="relative h-[420px] bg-black">
          {src ? (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              restrictPosition
              showGrid
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/60">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-border p-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Zoom
            </span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-violet"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={skip}
              disabled={busy}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
            >
              Use original
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={busy || !src || !area}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet/25 disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <CropIcon className="size-3.5" />}
              {busy ? "Processing…" : "Crop & upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
