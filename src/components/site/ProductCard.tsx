import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart";

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
  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-tight ${chipClass[product.categoryColor]}`}
        >
          {product.category}
        </span>
        <span className="font-display text-xl font-bold">${product.price}</span>
      </div>
      <h3 className="font-display font-semibold leading-tight">{product.title}</h3>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
        {product.records.toLocaleString()} records · {product.accuracy} accuracy · {product.geography}
      </p>
      <div
        className={`mt-4 grid aspect-[2/1] w-full place-items-center rounded-lg bg-secondary transition-colors ${previewClass[product.categoryColor]}`}
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          Data preview
        </span>
      </div>
      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
      <button
        onClick={() => add(product)}
        className="mt-5 w-full rounded-xl bg-ink py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet"
      >
        Add to cart
      </button>
    </article>
  );
}
