import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PRODUCTS, type Product } from "@/lib/products";
import { Header } from "@/components/site/Header";
import { ProductCard } from "@/components/site/ProductCard";
import { AnnouncementsAdmin } from "@/components/admin/AnnouncementsAdmin";
import { TrackingAdmin } from "@/components/admin/TrackingAdmin";
import { ConversionEventsAdmin } from "@/components/admin/ConversionEventsAdmin";
import { DebugModeAdmin } from "@/components/admin/DebugModeAdmin";
import { ServerTrackingAdmin } from "@/components/admin/ServerTrackingAdmin";
import { ProductDetailsAdmin } from "@/components/admin/ProductDetailsAdmin";
import { ChatbotAdmin } from "@/components/admin/ChatbotAdmin";
import { ReviewsAdmin } from "@/components/admin/ReviewsAdmin";
import { ContactLeadsAdmin } from "@/components/admin/ContactLeadsAdmin";
import { SocialLinksAdmin } from "@/components/admin/SocialLinksAdmin";
import { SiteContentAdmin } from "@/components/admin/SiteContentAdmin";
import { BrandSettingsAdmin } from "@/components/admin/BrandSettingsAdmin";
import { OrdersAdmin } from "@/components/admin/OrdersAdmin";
import { ReferralsAdmin } from "@/components/admin/ReferralsAdmin";
import { StripeEventsAdmin } from "@/components/admin/StripeEventsAdmin";
import { ImportExportAdmin } from "@/components/admin/ImportExportAdmin";
import { PricingAdmin } from "@/components/admin/PricingAdmin";
import { SampleDatasetsAdmin, SampleDatasetAuditLog } from "@/components/admin/SampleDatasetsAdmin";
import { SupportTicketsAdmin } from "@/components/admin/SupportTicketsAdmin";
import { BlogSeoAdmin } from "@/components/admin/BlogSeoAdmin";
import { BlogAnalyticsAdmin } from "@/components/admin/BlogAnalyticsAdmin";
import { BlogPostsAdmin } from "@/components/admin/BlogPostsAdmin";
import { EmailTestAdmin } from "@/components/admin/EmailTestAdmin";
import { StoreOffersAdmin } from "@/components/admin/StoreOffersAdmin";
import { TelegramBotsAdmin } from "@/components/admin/TelegramBotsAdmin";
import { BackupRestoreAdmin } from "@/components/admin/BackupRestoreAdmin";
import { ImportOrdersAdmin } from "@/components/admin/ImportOrdersAdmin";
import { CampaignsAdmin } from "@/components/admin/CampaignsAdmin";
import { whoAmIAdmin } from "@/lib/announcements.functions";
import { useAuth } from "@/hooks/use-auth";
import {
  Upload, X, Search, ShieldAlert, Lock,
  Layout, BarChart3, Boxes, Package, Users, MessageSquare, Palette,
  Database, LineChart, Sparkles, HelpCircle, ShieldCheck, Megaphone,
  Globe, PanelBottom, ImageIcon, Webhook, Server, Mail,
} from "@/components/admin/AdminIcons";
import { EmailslyLoaderInline } from "@/components/site/EmailslyLoaderInline";
import { AdminShell, type NavGroup } from "@/components/admin/AdminShell";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Product Cover Editor" },
      { name: "description", content: "Upload and preview cover images for prebuilt lead products." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/admin" }],
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
      <div className="theme-midnight min-h-screen bg-background text-foreground">
        <Header />
        <PlainBackdrop>
          <EmailslyLoaderInline label="Checking access" />
        </PlainBackdrop>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="theme-midnight min-h-screen bg-background text-foreground">
        <Header />
        <PlainBackdrop>
          <main className="relative mx-auto max-w-md px-4 py-24 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Lock className="size-6" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold">Admin sign-in required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in with the admin email to manage site content.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Go to sign in
            </Link>
          </main>
        </PlainBackdrop>
      </div>
    );
  }

  if (error || !data?.isAdmin) {
    return (
      <div className="theme-midnight min-h-screen bg-background text-foreground">
        <Header />
        <PlainBackdrop>
          <main className="relative mx-auto max-w-md px-4 py-24 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/30">
              <ShieldAlert className="size-6" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold">Not authorized</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {user.email} isn't the admin account. Sign in with the admin email.
            </p>
          </main>
        </PlainBackdrop>
      </div>
    );
  }

  return <AdminPage />;
}

const coverKey = (id: string) => `product-cover:${id}`;

function AdminPage() {
  const { user, signOut } = useAuth();
  const [covers, setCovers] = useState<Record<string, string | null>>({});
  const [selectedId, setSelectedId] = useState<string>(PRODUCTS[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string>("overview");
  const [paletteOpen, setPaletteOpen] = useState(false);

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

  // Keyboard: ⌘K / Ctrl+K opens palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Scroll to top when switching views
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [activeId]);

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

  const previewProduct: Product | undefined = selected
    ? { ...selected, coverImage: covers[selected.id] ?? selected.coverImage }
    : undefined;

  const productCoverEditor = (
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
  );

  const groups: NavGroup[] = [
    {
      id: "overview",
      label: "Home",
      items: [
        { id: "overview", label: "Overview", desc: "Dashboard, activity, and quick jumps.", icon: Layout, keywords: "home dashboard" },
      ],
    },
    {
      id: "revenue",
      label: "Revenue",
      items: [
        { id: "orders", label: "Orders", desc: "Review orders, update status, and fulfilment.", icon: Package, keywords: "orders fulfilment" },
        { id: "pricing", label: "Pricing", desc: "Per-service rates, minimums, and helper text.", icon: BarChart3, keywords: "pricing rates" },
        { id: "stripe", label: "Stripe Events", desc: "Recent Stripe webhook events.", icon: Webhook, keywords: "stripe payments webhook" },
        { id: "referrals", label: "Referrals", desc: "Referral codes, clicks, and conversions.", icon: Sparkles, keywords: "referrals codes" },
      ],
    },
    {
      id: "content",
      label: "Content & Site",
      items: [
        { id: "site-content", label: "Site Content", desc: "Editable copy for every landing section.", icon: Globe, keywords: "hero faq footer copy" },
        { id: "brand", label: "Brand Identity", desc: "Logo, colors, and global brand tokens.", icon: Palette, keywords: "logo brand color" },
        { id: "product-details", label: "Product Details", desc: "Long descriptions and hero images per product.", icon: Boxes, keywords: "product descriptions" },
        { id: "product-covers", label: "Product Covers", desc: "Upload storefront cover images.", icon: ImageIcon, keywords: "product covers images" },
        { id: "announcements", label: "Announcements", desc: "Marketing banners and popups.", icon: Megaphone, keywords: "banner popup" },
        { id: "reviews", label: "Reviews", desc: "Curate customer testimonials.", icon: ShieldCheck, keywords: "reviews testimonials" },
        { id: "blog-posts", label: "Blog Posts", desc: "Write, edit, and publish blog articles.", icon: Layout, keywords: "blog posts articles write editor" },
        { id: "blog-seo", label: "Blog SEO", desc: "Per-post meta description, canonical, OG image, and social title.", icon: Globe, keywords: "blog seo meta og canonical" },
        { id: "social", label: "Social Links", desc: "Header and footer social profiles.", icon: PanelBottom, keywords: "social links" },
      ],
    },
    {
      id: "customers",
      label: "Customers & Support",
      items: [
        { id: "support", label: "Support Tickets", desc: "Reply to customer tickets and change status.", icon: MessageSquare, keywords: "support tickets" },
        { id: "leads", label: "Contact Leads", desc: "Inbound contact form submissions.", icon: Mail, keywords: "leads contact" },
        { id: "chatbot", label: "Chatbot", desc: "AI chatbot knowledge base and behavior.", icon: HelpCircle, keywords: "chatbot ai" },
      ],
    },
    {
      id: "analytics",
      label: "Analytics & Tracking",
      items: [
        { id: "tracking", label: "Tracking Scripts", desc: "GA / Meta / custom pixel snippets.", icon: LineChart, keywords: "ga meta pixel tracking" },
        { id: "conversion", label: "Conversion Events", desc: "Named events for analytics providers.", icon: BarChart3, keywords: "conversion events" },
        { id: "blog-analytics", label: "Blog Analytics", desc: "Views, scroll depth, CTA clicks, and conversions per post.", icon: LineChart, keywords: "blog analytics views scroll cta" },
        { id: "server-tracking", label: "Server Tracking", desc: "Server-side event forwarding config.", icon: Server, keywords: "server tracking" },
        { id: "debug", label: "Debug Mode", desc: "Toggle verbose logging and on-screen tools.", icon: ShieldAlert, keywords: "debug logs" },
      ],
    },
    {
      id: "growth",
      label: "Growth",
      items: [
        { id: "store-offers", label: "Store Offers", desc: "Promotional banners for the store page.", icon: Megaphone, keywords: "store offers promo banner deal" },
        { id: "campaigns", label: "Campaigns", desc: "Broadcast emails or in-app announcements to targeted audiences.", icon: Megaphone, keywords: "campaigns broadcast email announcement audience" },
        { id: "telegram", label: "Telegram Bots", desc: "Instant notifications for orders, tickets, and more.", icon: MessageSquare, keywords: "telegram bots notifications" },
      ],
    },
    {
      id: "data",
      label: "Data",
      items: [
        { id: "datasets", label: "Sample Datasets", desc: "Seeded demo datasets shown across the site.", icon: Database, keywords: "sample datasets" },
        { id: "audit", label: "Audit Log", desc: "History of sample dataset changes.", icon: Server, keywords: "audit history" },
        { id: "import-export", label: "Import / Export", desc: "Bulk import or export data via CSV/JSON.", icon: Users, keywords: "import export csv" },
        { id: "import-legacy-orders", label: "Import Legacy Orders", desc: "Bulk-import old orders from a CSV file.", icon: Users, keywords: "import legacy orders csv old" },
        { id: "backup-restore", label: "Backup / Restore", desc: "Download or restore a JSON backup of site data.", icon: Database, keywords: "backup restore json export" },
        { id: "email-test", label: "Email Diagnostics", desc: "Send test emails through each SMTP sender.", icon: Mail, keywords: "email smtp test diagnostics deliverability" },
      ],
    },
  ];

  const views: Record<string, React.ReactNode> = {
    overview: <AdminDashboard groups={groups} onSelect={setActiveId} userEmail={user?.email} />,
    orders: <OrdersAdmin />,
    pricing: <PricingAdmin />,
    stripe: <StripeEventsAdmin />,
    referrals: <ReferralsAdmin />,
    "site-content": <SiteContentAdmin />,
    brand: <BrandSettingsAdmin />,
    "product-details": <ProductDetailsAdmin />,
    "product-covers": productCoverEditor,
    announcements: <AnnouncementsAdmin />,
    reviews: <ReviewsAdmin />,
    "blog-seo": <BlogSeoAdmin />,
    "blog-posts": <BlogPostsAdmin />,
    social: <SocialLinksAdmin />,
    support: <SupportTicketsAdmin />,
    leads: <ContactLeadsAdmin />,
    chatbot: <ChatbotAdmin />,
    tracking: <TrackingAdmin />,
    conversion: <ConversionEventsAdmin />,
    "blog-analytics": <BlogAnalyticsAdmin />,
    "server-tracking": <ServerTrackingAdmin />,
    debug: <DebugModeAdmin />,
    datasets: <SampleDatasetsAdmin />,
    audit: <SampleDatasetAuditLog />,
    "import-export": <ImportExportAdmin />,
    "email-test": <EmailTestAdmin />,
  };

  return (
    <>
      <AdminShell
        groups={groups}
        activeId={activeId}
        onSelect={setActiveId}
        onOpenPalette={() => setPaletteOpen(true)}
        userEmail={user?.email}
        onSignOut={() => { void signOut(); }}
      >
        {views[activeId] ?? views.overview}
      </AdminShell>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        groups={groups}
        onNavigate={setActiveId}
      />
    </>
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

function PlainBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background">
      <div className="relative">{children}</div>
    </div>
  );
}

