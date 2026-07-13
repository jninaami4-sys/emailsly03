import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PRODUCTS, type Product } from "@/lib/products";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { AnnouncementsAdmin } from "@/components/admin/AnnouncementsAdmin";
import { TrackingAdmin } from "@/components/admin/TrackingAdmin";
import { ConversionEventsAdmin } from "@/components/admin/ConversionEventsAdmin";
import { DebugModeAdmin } from "@/components/admin/DebugModeAdmin";
import { ServerTrackingAdmin } from "@/components/admin/ServerTrackingAdmin";
import { whoAmIAdmin } from "@/lib/announcements.functions";
import { useAuth } from "@/hooks/use-auth";
import { Upload, X, Search, ShieldAlert, Lock } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Product Cover Editor" },
      { name: "description", content: "Upload and preview cover images for prebuilt lead products." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  const { user, loading } = useAuth();
  const whoFn = useServerFn(whoAmIAdmin);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-check", user?.id],
    queryFn: () => whoFn(),
    enabled: !!user,
    retry: false,
  });

  if (loading || (user && isLoading)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-muted-foreground">
          Checking access…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-violet/10 text-violet">
            <Lock className="size-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Admin sign-in required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with the admin email to manage site content.
          </p>
          <Link to="/auth" className="mt-6 inline-flex rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white">
            Go to sign in
          </Link>
        </main>
      </div>
    );
  }

  if (error || !data?.isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user.email} isn't the admin account. Sign in with the admin email.
          </p>
        </main>
      </div>
    );
  }

  return <AdminPage />;
}

const coverKey = (id: string) => `product-cover:${id}`;

function AdminPage() {
  const [covers, setCovers] = useState<Record<string, string | null>>({});
  const [selectedId, setSelectedId] = useState<string>(PRODUCTS[0]?.id ?? "");
  const [query, setQuery] = useState("");

  // Load persisted covers
  useEffect(() => {
    const initial: Record<string, string | null> = {};
    for (const p of PRODUCTS) {
      try {
        initial[p.id] = localStorage.getItem(coverKey(p.id));
      } catch {
        initial[p.id] = null;
      }
    }
    setCovers(initial);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRODUCTS;
    return PRODUCTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [query]);

  const selected = PRODUCTS.find((p) => p.id === selectedId) ?? PRODUCTS[0];

  const setCover = (id: string, dataUrl: string | null) => {
    try {
      if (dataUrl) localStorage.setItem(coverKey(id), dataUrl);
      else localStorage.removeItem(coverKey(id));
    } catch {}
    setCovers((c) => ({ ...c, [id]: dataUrl }));
  };

  const handleFile = (id: string, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCover(id, String(reader.result));
    reader.readAsDataURL(file);
  };

  // Product for live preview with in-memory cover override
  const previewProduct: Product | undefined = selected
    ? { ...selected, coverImage: covers[selected.id] ?? selected.coverImage }
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
            Admin
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
            Site control panel
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Manage marketing announcements shown to visitors and product covers on the storefront.
          </p>
        </header>

        <div className="mb-10 space-y-6">
          <AnnouncementsAdmin />
          <TrackingAdmin />
          <ConversionEventsAdmin />
          <DebugModeAdmin />
        </div>

        <h2 className="mb-4 font-display text-xl font-bold">Product cover editor</h2>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* LIST */}
          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border p-3">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <ul className="divide-y divide-border max-h-[70vh] overflow-y-auto">
              {filtered.map((p) => {
                const cover = covers[p.id] ?? p.coverImage ?? null;
                const isSelected = p.id === selectedId;
                return (
                  <li
                    key={p.id}
                    className={`flex items-center gap-3 p-3 transition-colors ${
                      isSelected ? "bg-secondary" : "hover:bg-secondary/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                        {cover ? (
                          <img
                            src={cover}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-mono text-[9px] uppercase text-muted-foreground/60">
                            No cover
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-semibold">
                          {p.title}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {p.category} · {p.records.toLocaleString()} records
                        </p>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <label className="cursor-pointer rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors hover:bg-secondary">
                        <Upload className="mr-1 inline size-3" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFile(p.id, e.target.files?.[0])}
                        />
                      </label>
                      {covers[p.id] && (
                        <button
                          type="button"
                          onClick={() => setCover(p.id, null)}
                          className="rounded-lg border border-border bg-background p-1.5 transition-colors hover:bg-secondary"
                          aria-label="Remove cover"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="p-8 text-center text-sm text-muted-foreground">
                  No products match "{query}".
                </li>
              )}
            </ul>
          </section>

          {/* LIVE PREVIEW */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Live preview
                </span>
                {selected && covers[selected.id] && (
                  <span className="rounded-full bg-emerald-soft px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald">
                    Custom cover
                  </span>
                )}
              </div>
              {previewProduct ? (
                <ProductCard product={previewProduct} />
              ) : (
                <p className="text-sm text-muted-foreground">Select a product.</p>
              )}
            </div>

            {selected && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Drop cover here
                </p>
                <DropZone onFile={(f) => handleFile(selected.id, f)} />
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                  Recommended: 16:9, 1200×675, JPG or PNG.
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
        dragging
          ? "border-violet bg-violet-soft"
          : "border-border hover:border-violet/50 hover:bg-secondary"
      }`}
    >
      <Upload className="size-5 text-muted-foreground" />
      <p className="text-sm font-medium">Drop image or click to browse</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}
