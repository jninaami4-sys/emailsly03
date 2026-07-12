import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { Globe, X } from "lucide-react";
import { PremiumImageIcon, PremiumUpload, PremiumFileText } from "./PremiumIcons";

const chipClass: Record<Product["categoryColor"], string> = {
  violet: "bg-violet-soft text-violet",
  coral: "bg-coral-soft text-coral",
  emerald: "bg-emerald-soft text-emerald",
};

const coverGradient: Record<Product["categoryColor"], string> = {
  violet:
    "bg-[radial-gradient(circle_at_20%_20%,hsl(var(--violet)/0.35),transparent_55%),radial-gradient(circle_at_80%_80%,hsl(var(--coral)/0.25),transparent_55%),linear-gradient(135deg,hsl(var(--violet)/0.15),hsl(var(--violet)/0.05))]",
  coral:
    "bg-[radial-gradient(circle_at_20%_20%,hsl(var(--coral)/0.4),transparent_55%),radial-gradient(circle_at_80%_80%,hsl(var(--violet)/0.25),transparent_55%),linear-gradient(135deg,hsl(var(--coral)/0.15),hsl(var(--coral)/0.05))]",
  emerald:
    "bg-[radial-gradient(circle_at_20%_20%,hsl(var(--emerald)/0.35),transparent_55%),radial-gradient(circle_at_80%_80%,hsl(var(--violet)/0.2),transparent_55%),linear-gradient(135deg,hsl(var(--emerald)/0.15),hsl(var(--emerald)/0.05))]",
};

const coverKey = (id: string) => `product-cover:${id}`;

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadedCover, setUploadedCover] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(coverKey(product.id));
      if (stored) setUploadedCover(stored);
    } catch {}
  }, [product.id]);

  const cover = uploadedCover ?? product.coverImage ?? null;

  const savings =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

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

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-violet/40">
      {/* Cover / thumbnail */}
      <div
        className={`relative aspect-[16/9] w-full overflow-hidden ${cover ? "" : coverGradient[product.categoryColor]}`}
      >
        {cover ? (
          <img
            src={cover}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground/70">
              <ImageIcon className="size-8" />
              <span className="font-mono text-[10px] uppercase tracking-widest">
                {product.category}
              </span>
            </div>
          </div>
        )}

        {/* Featured badge over cover */}
        {product.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-coral px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
            ★ Featured
          </span>
        )}

        {/* Savings badge */}
        {savings && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
            Save {savings}%
          </span>
        )}

        {/* Upload controls (visible on hover) */}
        <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[10px] font-semibold text-ink backdrop-blur transition-colors hover:bg-white"
            aria-label="Upload cover image"
          >
            <Upload className="size-3" />
            {cover ? "Change cover" : "Upload cover"}
          </button>
          {uploadedCover && (
            <button
              type="button"
              onClick={clearCover}
              className="rounded-full bg-white/90 p-1.5 text-ink backdrop-blur transition-colors hover:bg-white"
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
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <span
            className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-tight ${chipClass[product.categoryColor]}`}
          >
            {product.category}
          </span>
          <div className="flex items-baseline gap-1.5 text-right">
            {product.compareAtPrice && (
              <span className="font-mono text-xs text-muted-foreground line-through">
                ${product.compareAtPrice}
              </span>
            )}
            <span className="font-display text-2xl font-bold">${product.price}</span>
          </div>
        </div>

        <h3 className="font-display text-base font-semibold leading-snug">{product.title}</h3>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] font-semibold">
            {product.records.toLocaleString()} records
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] font-semibold">
            <Globe className="size-3" /> {product.geography}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] font-semibold">
            <FileText className="size-3" /> {product.fileFormat}
          </span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        {product.sampleNote && (
          <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">{product.sampleNote}</p>
        )}

        <button
          onClick={() => add(product)}
          className="mt-auto w-full rounded-xl bg-ink py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-violet hover:shadow-md active:scale-[0.98] mt-4"
        >
          Add to cart
        </button>
      </div>
    </article>
  );
}
