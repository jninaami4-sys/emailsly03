import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { ProductCard } from "@/components/site/ProductCard";
import { StoreSkeleton } from "@/components/site/StoreSkeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { PRODUCTS, CATEGORIES } from "@/lib/products";
import { useAllProducts } from "@/hooks/use-all-products";
import { Search } from "lucide-react";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "Lead Store — Prebuilt B2B lead lists | EmailsLy" },
      { name: "description", content: "Browse verified prebuilt B2B lead lists. Instant download, pay per list, no subscription." },
      { property: "og:title", content: "Lead Store — Prebuilt B2B lead lists" },
      { property: "og:description", content: "Browse verified prebuilt B2B lead lists. Instant download after checkout." },
    ],
    links: [{ rel: "canonical", href: "/store" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "EmailsLy Lead Store",
          url: "/store",
          description:
            "Prebuilt, verified B2B lead lists — instant download after checkout.",
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: PRODUCTS.length,
            itemListElement: PRODUCTS.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Product",
                name: p.title,
                category: p.category,
                description: p.description,
                url: `/store/${p.slug}`,
                offers: {
                  "@type": "Offer",
                  price: p.price,
                  priceCurrency: "USD",
                  availability: "https://schema.org/InStock",
                },
              },
            })),
          },
        }),
      },
    ],
  }),
  pendingComponent: StoreSkeleton,
  component: Store,
});


function Store() {
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const hydrated = useHydrated();
  const allProducts = useAllProducts();

  const filtered = allProducts.filter((p) => {
    if (category !== "All" && p.category !== category) return false;
    if (query && !`${p.title} ${p.category} ${p.description}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  if (!hydrated) {
    return (
      <SiteShell>
        <StoreSkeleton />
      </SiteShell>
    );
  }

  return (
    <SiteShell>

      <section className="border-b border-border px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-display text-4xl font-bold lg:text-5xl">Lead store</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Curated, verified B2B lead lists. Instant CSV download after checkout.
          </p>
          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search titles, industries, roles…"
                className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 outline-none focus:border-violet"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  category === c
                    ? "border-violet bg-violet text-white"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
              No lists match your filters.
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Available B2B lead lists
              </h2>
              <p className="mb-6 mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "list" : "lists"}
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
