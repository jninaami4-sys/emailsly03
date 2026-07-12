import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { Globe, FileText } from "lucide-react";

const chipClass: Record<Product["categoryColor"], string> = {
  violet: "bg-violet-soft text-violet",
  coral: "bg-coral-soft text-coral",
  emerald: "bg-emerald-soft text-emerald",
};

const previewClass: Record<Product["categoryColor"], string> = {
  violet: "group-hover:bg-violet-soft",
  coral: "group-hover:bg-coral-soft",
  emerald: "group-hover:bg-emerald-soft",
};

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const savings =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-xl">
      {product.featured && (
        <span className="absolute -top-2 left-6 rounded-full bg-coral px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
          Featured
        </span>
      )}
      <div className="mb-4 flex items-start justify-between gap-3">
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
          <span className="font-display text-xl font-bold">${product.price}</span>
        </div>
      </div>
      <h3 className="font-display font-semibold leading-tight">{product.title}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] font-semibold">
          {product.records.toLocaleString()} records
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] font-semibold">
          <Globe className="size-3" /> {product.geography}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] font-semibold">
          <FileText className="size-3" /> {product.fileFormat}
        </span>
        {savings && (
          <span className="inline-flex items-center rounded-full bg-emerald-soft px-2 py-0.5 font-mono text-[10px] font-bold text-emerald">
            Save {savings}%
          </span>
        )}
      </div>
      <div
        className={`mt-4 grid aspect-[2/1] w-full place-items-center rounded-lg bg-secondary transition-colors ${previewClass[product.categoryColor]}`}
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          Data preview
        </span>
      </div>
      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
      {product.sampleNote && (
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">{product.sampleNote}</p>
      )}
      <button
        onClick={() => add(product)}
        className="mt-5 w-full rounded-xl bg-ink py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet"
      >
        Add to cart
      </button>
    </article>
  );
}
