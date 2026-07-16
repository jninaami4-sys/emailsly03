import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X, ArrowUpRight, Loader2 } from "lucide-react";
import type { Product } from "@/lib/products";
import { getProductDetails } from "@/lib/product-details.functions";
import { useCart } from "@/lib/cart";

export function ProductDetailsModal({
  product,
  open,
  onClose,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
}) {
  const { add } = useCart();
  const getDetailsFn = useServerFn(getProductDetails);
  const { data, isLoading } = useQuery({
    queryKey: ["product-details", product.slug],
    queryFn: () => getDetailsFn({ data: { slug: product.slug } }),
    enabled: open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const hasExtra =
    !!data &&
    (data.long_description.trim() ||
      data.extra_info.trim() ||
      data.cta_url.trim() ||
      data.image_url.trim());

  const heroImage = data?.image_url?.trim() || product.coverImage || null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={product.title}
    >
      <div
        className="relative flex max-h-[95dvh] min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:max-h-[88dvh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-ink shadow transition-colors hover:bg-white"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {heroImage && (
          <div className="relative aspect-[16/6] max-h-[22vh] w-full shrink-0 overflow-hidden bg-secondary sm:max-h-[28vh]">
            <img src={heroImage} alt={product.title} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-violet">
            {product.category}
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            {product.title}
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-border">
            <div className="flex flex-col gap-0.5 bg-card px-3 py-2.5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Records
              </span>
              <span className="font-mono text-[13px] font-bold tabular-nums">
                {product.records.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 bg-card px-3 py-2.5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Region
              </span>
              <span className="truncate font-mono text-[13px] font-bold">
                {product.geography}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 bg-card px-3 py-2.5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Format
              </span>
              <span className="font-mono text-[13px] font-bold">{product.fileFormat}</span>
            </div>
          </div>

          {isLoading && (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading details…
            </div>
          )}

          {!isLoading && hasExtra && (
            <div className="mt-6 space-y-5">
              {data!.long_description.trim() && (
                <div>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    About this list
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                    {data!.long_description}
                  </p>
                </div>
              )}
              {data!.extra_info.trim() && (
                <div>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Additional info
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                    {data!.extra_info}
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="mt-6 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Included fields
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {product.fields.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-border bg-secondary px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse items-stretch gap-3 border-t border-border bg-card/90 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-5 sm:pb-5">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold">${product.price}</span>
            {product.compareAtPrice && (
              <span className="font-mono text-xs text-muted-foreground line-through">
                ${product.compareAtPrice}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {data?.cta_url?.trim() && (
              <a
                href={data.cta_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
              >
                {data.cta_label?.trim() || "Learn more"}
                <ArrowUpRight className="size-4" />
              </a>
            )}
            <button
              onClick={() => {
                add(product);
                onClose();
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet"
            >
              Add to cart
              <ArrowUpRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
