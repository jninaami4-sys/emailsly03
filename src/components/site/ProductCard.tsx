import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { ArrowUpRight, Check, Globe, ShieldCheck, X, Eye } from "lucide-react";
import { PremiumImageIcon, PremiumUpload, PremiumFileText } from "./PremiumIcons";
import { ProductDetailsModal } from "./ProductDetailsModal";

const accentClass: Record<Product["categoryColor"], { dot: string; ring: string; chip: string; glow: string }> = {
  violet: {
    dot: "bg-violet",
    ring: "ring-violet/30",
    chip: "text-violet",
    glow: "from-violet/20 via-violet/5 to-transparent",
  },
  coral: {
    dot: "bg-coral",
    ring: "ring-coral/30",
    chip: "text-coral",
    glow: "from-coral/20 via-coral/5 to-transparent",
  },
  emerald: {
    dot: "bg-emerald",
    ring: "ring-emerald/30",
    chip: "text-emerald",
    glow: "from-emerald/20 via-emerald/5 to-transparent",
  },
};

const coverGradient: Record<Product["categoryColor"], string> = {
  violet:
    "bg-[radial-gradient(circle_at_15%_15%,hsl(var(--violet)/0.45),transparent_60%),radial-gradient(circle_at_85%_85%,hsl(var(--coral)/0.3),transparent_60%),linear-gradient(135deg,hsl(var(--violet)/0.12),hsl(var(--ink)/0.9))]",
  coral:
    "bg-[radial-gradient(circle_at_15%_15%,hsl(var(--coral)/0.5),transparent_60%),radial-gradient(circle_at_85%_85%,hsl(var(--violet)/0.3),transparent_60%),linear-gradient(135deg,hsl(var(--coral)/0.12),hsl(var(--ink)/0.9))]",
  emerald:
    "bg-[radial-gradient(circle_at_15%_15%,hsl(var(--emerald)/0.45),transparent_60%),radial-gradient(circle_at_85%_85%,hsl(var(--violet)/0.25),transparent_60%),linear-gradient(135deg,hsl(var(--emerald)/0.12),hsl(var(--ink)/0.9))]",
};

const coverKey = (id: string) => `product-cover:${id}`;

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadedCover, setUploadedCover] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(coverKey(product.id));
      if (stored) setUploadedCover(stored);
    } catch {}
  }, [product.id]);

  const cover = uploadedCover ?? product.coverImage ?? null;
  const accent = accentClass[product.categoryColor];

  const savings =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const pricePerRecord = (product.price / product.records).toFixed(3);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      try {
        localStorage.setItem(coverKey(product.id), dataUrl);
      } catch {}
      setUploadedCover(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const clearCover = () => {
    try {
      localStorage.removeItem(coverKey(product.id));
    } catch {}
    setUploadedCover(null);
  };

  const handleAdd = () => {
    add(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all duration-500 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_30px_60px_-25px_hsl(var(--ink)/0.35)] hover:ring-2 ${accent.ring}`}
    >
      {/* Ambient accent glow on hover */}
      <div
        className={`pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br ${accent.glow} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      />

      {/* Cover */}
      <div
        className={`relative aspect-[5/3] w-full overflow-hidden ${cover ? "" : coverGradient[product.categoryColor]}`}
      >
        {cover ? (
          <img
            src={cover}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-white/60">
              <PremiumImageIcon className="size-8" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                {product.category}
              </span>
            </div>
          </div>
        )}

        {/* Gradient bottom scrim so category chip reads over any image */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent opacity-90" />

        {/* Top-left: verified strip */}
        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink shadow-sm backdrop-blur">
          <ShieldCheck className="size-3 text-emerald" />
          Verified 30d
        </div>

        {/* Top-right badges stack */}
        <div className="absolute right-4 top-4 flex flex-col items-end gap-1.5">
          {product.featured && (
            <span className="rounded-full bg-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
              ★ Featured
            </span>
          )}
          {savings && (
            <span className="rounded-full bg-coral px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
              −{savings}%
            </span>
          )}
        </div>

        {/* Bottom-left over scrim: category */}
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          <span className={`size-1.5 rounded-full ${accent.dot}`} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/95">
            {product.category}
          </span>
        </div>

        {/* Upload controls (hover) */}
        <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 font-mono text-[10px] font-semibold text-ink backdrop-blur transition-colors hover:bg-white"
            aria-label="Upload cover image"
          >
            <PremiumUpload className="size-3" />
            {cover ? "Change" : "Upload"}
          </button>
          {uploadedCover && (
            <button
              type="button"
              onClick={clearCover}
              className="rounded-full bg-white/95 p-1.5 text-ink backdrop-blur transition-colors hover:bg-white"
              aria-label="Remove uploaded cover"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Body */}
      <div className="relative z-10 flex flex-1 flex-col gap-4 p-6">
        {/* Title + records */}
        <div>
          <h3 className="font-display text-[17px] font-semibold leading-snug tracking-tight">
            {product.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </div>

        {/* Meta grid — editorial spec strip */}
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-border">
          <div className="flex flex-col gap-0.5 bg-card px-3 py-2.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              Records
            </span>
            <span className="font-mono text-[13px] font-bold tabular-nums">
              {product.records.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 bg-card px-3 py-2.5">
            <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              <Globe className="size-2.5" /> Region
            </span>
            <span
              className="truncate font-mono text-[13px] font-bold"
              title={product.geography}
            >
              {product.geography}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 bg-card px-3 py-2.5">
            <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              <PremiumFileText className="size-2.5" /> Format
            </span>
            <span className="font-mono text-[13px] font-bold">{product.fileFormat}</span>
          </div>
        </div>

        {/* Price row */}
        <div className="flex items-end justify-between gap-3 border-t border-dashed border-border pt-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold leading-none tracking-tight">
                ${product.price}
              </span>
              {product.compareAtPrice && (
                <span className="font-mono text-xs text-muted-foreground line-through">
                  ${product.compareAtPrice}
                </span>
              )}
            </div>
            <span className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              ${pricePerRecord} <span className="opacity-60">/ record</span>
            </span>
          </div>

          <button
            onClick={handleAdd}
            className={`group/btn relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.97] ${
              added
                ? "bg-emerald text-white"
                : "bg-ink text-white hover:bg-violet"
            }`}
          >
            <span className="relative">{added ? "Added" : "Add to cart"}</span>
            {added ? (
              <Check className="size-4" />
            ) : (
              <ArrowUpRight className="size-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            )}
          </button>
        </div>

        {product.sampleNote && (
          <p className="-mt-1 font-mono text-[10px] text-muted-foreground/80">
            {product.sampleNote}
          </p>
        )}
      </div>
    </article>
  );
}
