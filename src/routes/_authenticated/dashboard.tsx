import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listMyOrders,
  getMyOrder,
  getMyProfile,
  updateMyProfile,
  requestRevision,
} from "@/lib/orders.functions";
import { getMyReferralSummary, type ReferralSummary } from "@/lib/referrals.functions";
import { SiteShell } from "@/components/site/SiteShell";
import { ReferralErrorBoundary } from "@/components/site/ReferralErrorBoundary";
import { useAuth } from "@/hooks/use-auth";
import { openOrderDrawer } from "@/components/site/OrderDrawer";
import { Loader2, Download, Package, User as UserIcon, Receipt, RotateCcw, ExternalLink, ShoppingBag, PackageSearch, MessageCircle, BookOpen, Zap, TrendingUp, CheckCircle2, Clock, Wallet, ArrowUpRight, Copy, Gift, Headphones, ChevronRight, Search, Camera, Trash2, LifeBuoy } from "lucide-react";
import { PremiumSparkles as Sparkles } from "@/components/site/PremiumIcons";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image-compress";
import { AvatarCropDialog } from "@/components/site/AvatarCropDialog";
import { ShareExperienceCTA } from "@/components/site/ShareExperienceCTA";
import { SupportTicketsPanel } from "@/components/site/SupportTicketsPanel";
import { SupportTicketModal } from "@/components/site/SupportTicketModal";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — EmailsLy" },
      { name: "robots", content: "noindex,nofollow" },
    ],
    links: [{ rel: "canonical", href: "/dashboard" }],
  }),
  component: DashboardPage,
});

type Tab = "orders" | "downloads" | "invoices" | "support" | "profile";

function DashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("orders");
  const listFn = useServerFn(listMyOrders);
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => listFn() });
  const profileFn = useServerFn(getMyProfile);
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: () => profileFn() });

  const data = orders.data ?? [];
  const stats = useMemo(() => summarize(data), [data]);
  const first = user?.email?.[0]?.toUpperCase() ?? "L";
  const displayName =
    (profile.data?.full_name as string | undefined)?.split(" ")?.[0] ??
    (user?.user_metadata as any)?.full_name?.split(" ")?.[0] ??
    user?.email?.split("@")?.[0] ??
    "there";
  const avatarUrl = profile.data?.avatar_url ?? null;

  return (
    <SiteShell>
      <div className="relative">
        {/* Ambient background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden"
        >
          <div className="absolute -left-32 top-0 size-[420px] rounded-full bg-violet/25 blur-[120px]" />
          <div className="absolute right-0 top-16 size-[360px] rounded-full bg-neon-orange/15 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,var(--background)_75%)]" />
        </div>

        <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10 lg:px-8">
          {/* Greeting header */}
          <section className="mb-6 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="size-12 rounded-2xl object-cover shadow-lg shadow-violet/30 ring-1 ring-white/10 sm:size-14"
                  />
                ) : (
                  <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet to-neon-orange font-display text-lg font-bold text-white shadow-lg shadow-violet/30 sm:size-14 sm:text-xl">
                    {first}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-background bg-emerald">
                  <CheckCircle2 className="size-3 text-white" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet/25 bg-violet/10 px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-violet">
                  <span className="relative flex size-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-violet/70" />
                    <span className="relative size-1.5 rounded-full bg-violet" />
                  </span>
                  Member workspace
                </span>
                <h1 className="mt-1.5 font-display text-[26px] font-black leading-[1.1] tracking-tight break-words sm:text-4xl lg:text-[44px]">
                  Welcome back,{" "}
                  <span className="break-words bg-gradient-to-r from-violet via-magenta to-neon-orange bg-clip-text text-transparent">
                    {displayName}
                  </span>
                </h1>
                <p className="mt-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
                  Track orders, grab deliveries, and reorder in one click.
                </p>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:flex-wrap">
              <button
                onClick={openOrderDrawer}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet to-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet/25 transition-transform hover:scale-[1.02]"
              >
                <Sparkles className="size-4" /> New order
              </button>
              <Link
                to="/store"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-violet/40 hover:bg-secondary"
              >
                <ShoppingBag className="size-4" /> Browse store
              </Link>
            </div>
          </section>


          {/* Stat cards */}
          <section className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              label="Total orders"
              value={stats.total.toString()}
              hint={stats.total ? "All-time" : "Start your first order"}
              icon={<Package className="size-4" />}
              accent="violet"
            />
            <StatCard
              label="Delivered"
              value={stats.delivered.toString()}
              hint={stats.delivered ? "Ready to download" : "None yet"}
              icon={<CheckCircle2 className="size-4" />}
              accent="emerald"
            />
            <StatCard
              label="In progress"
              value={(stats.pending + stats.inProgress).toString()}
              hint={stats.pending + stats.inProgress ? "Team on it" : "Nothing queued"}
              icon={<Clock className="size-4" />}
              accent="orange"
            />
            <StatCard
              label="Lifetime spend"
              value={money(stats.spend, "USD")}
              hint={stats.spend ? "Net of refunds" : "No spend yet"}
              icon={<Wallet className="size-4" />}
              accent="indigo"
            />
          </section>

          {/* Quick actions */}
          <section className="mb-8">
            <SectionHeading eyebrow="Shortcuts" title="Jump back in" />
            <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-5">
              <QuickAction
                to="/store"
                icon={<ShoppingBag className="size-5" />}
                label="Lead Store"
                sub="Curated lists"
              />
              <QuickAction
                to="/apollo-leads-export"
                icon={<Zap className="size-5" />}
                label="Apollo Export"
                sub="Custom pulls"
              />
              <QuickAction
                to="/track-order"
                icon={<PackageSearch className="size-5" />}
                label="Track order"
                sub="Status & ETA"
              />
              <QuickAction
                to="/pricing"
                icon={<TrendingUp className="size-5" />}
                label="Pricing"
                sub="Calculate cost"
              />
              <QuickAction
                to="/contact"
                icon={<Headphones className="size-5" />}
                label="Support"
                sub="24h response"
              />
            </div>
          </section>

          {/* Main grid */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              {/* Tabs */}
              <div className="mb-4 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max gap-1 rounded-2xl border border-border bg-card p-1 sm:grid sm:min-w-0 sm:grid-cols-5">
                  <TabBtn active={tab === "orders"} onClick={() => setTab("orders")} icon={<Package className="size-4" />}>
                    Orders
                  </TabBtn>
                  <TabBtn
                    active={tab === "downloads"}
                    onClick={() => setTab("downloads")}
                    icon={<Download className="size-4" />}
                    count={stats.delivered}
                  >
                    Downloads
                  </TabBtn>
                  <TabBtn active={tab === "invoices"} onClick={() => setTab("invoices")} icon={<Receipt className="size-4" />}>
                    Invoices
                  </TabBtn>
                  <TabBtn active={tab === "support"} onClick={() => setTab("support")} icon={<LifeBuoy className="size-4" />}>
                    Support
                  </TabBtn>
                  <TabBtn active={tab === "profile"} onClick={() => setTab("profile")} icon={<UserIcon className="size-4" />}>
                    Profile
                  </TabBtn>
                </div>
              </div>

              {tab === "orders" && <OrdersTab orders={data} loading={orders.isLoading} />}
              {tab === "downloads" && (
                <DownloadsTab orders={data.filter((o: any) => o.delivery_url)} />
              )}
              {tab === "invoices" && <InvoicesTab orders={data} />}
              {tab === "support" && <SupportTicketsPanel />}
              {tab === "profile" && <ProfileTab />}
            </div>

            {/* Sidebar */}
            <aside className="space-y-4">
              <ReferralErrorBoundary>
                <ReferralCard />
              </ReferralErrorBoundary>
              <ShareExperienceCTA variant="dashboard" />
              <RecommendedCard />
              <SupportCard />
            </aside>
          </div>
        </main>
      </div>
    </SiteShell>
  );
}

/* ------------------------------ helpers ------------------------------ */

function summarize(orders: any[]) {
  let delivered = 0,
    pending = 0,
    inProgress = 0,
    spend = 0;
  for (const o of orders) {
    if (o.status === "delivered") delivered++;
    else if (o.status === "pending") pending++;
    else if (o.status === "in_progress" || o.status === "revision_requested") inProgress++;
    if (o.status !== "refunded" && o.status !== "cancelled") spend += o.total_cents || 0;
  }
  return { total: orders.length, delivered, pending, inProgress, spend };
}

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format((cents || 0) / 100);
}

/* ------------------------------ atoms ------------------------------ */

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <div>
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-violet">
          {eyebrow}
        </span>
        <h2 className="mt-0.5 font-display text-xl font-black tracking-tight">
          {title}
        </h2>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  accent: "violet" | "emerald" | "orange" | "indigo";
}) {
  const accents: Record<string, { glow: string; text: string; grad: string }> = {
    violet:  { glow: "from-violet/25",      text: "text-violet",      grad: "from-violet to-magenta" },
    emerald: { glow: "from-emerald/25",     text: "text-emerald",     grad: "from-emerald to-teal-400" },
    orange:  { glow: "from-neon-orange/30", text: "text-neon-orange", grad: "from-neon-orange to-magenta" },
    indigo:  { glow: "from-indigo/25",      text: "text-indigo",      grad: "from-indigo to-violet" },
  };
  const a = accents[accent];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-violet/40 hover:shadow-lg hover:shadow-violet/10">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br ${a.glow} to-transparent opacity-70 blur-2xl transition-opacity group-hover:opacity-100`}
      />
      <div className="relative flex items-center justify-between">
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </span>
        <span className={`grid size-8 place-items-center rounded-lg bg-secondary ring-1 ring-border ${a.text}`}>
          {icon}
        </span>
      </div>
      <div
        className={`relative mt-3 bg-gradient-to-r ${a.grad} bg-clip-text font-display text-3xl font-black tracking-tight text-transparent tabular-nums sm:text-4xl`}
      >
        {value}
      </div>
      <div className="relative mt-1 text-[11px] font-medium text-muted-foreground">
        {hint}
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  label,
  sub,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <Link
      to={to as any}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-violet/40 hover:shadow-lg hover:shadow-violet/15"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-violet/20 opacity-0 blur-2xl transition-opacity group-hover:opacity-100"
      />
      <div className="relative mb-3 grid size-10 place-items-center rounded-xl bg-violet/10 text-violet ring-1 ring-violet/20 transition-all group-hover:scale-105 group-hover:bg-violet group-hover:text-white group-hover:ring-violet">
        {icon}
      </div>
      <div className="relative text-sm font-black uppercase tracking-tight">{label}</div>
      <div className="relative mt-0.5 text-[11px] font-medium text-muted-foreground">{sub}</div>
      <ArrowUpRight className="absolute right-3 top-3 size-3.5 text-violet opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
        active
          ? "bg-gradient-to-r from-violet to-indigo text-white shadow-md shadow-violet/20"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {icon}
      <span>{children}</span>
      {count ? (
        <span
          className={`grid min-w-4 place-items-center rounded-full px-1.5 py-0 font-mono text-[10px] font-bold ${
            active ? "bg-white/25 text-white" : "bg-violet/15 text-violet"
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

/* ------------------------------ orders ------------------------------ */

function OrdersTab({ orders, loading }: { orders: any[]; loading: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = orders;
    if (filter !== "all") list = list.filter((o) => o.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((o) =>
        [o.service_label, o.promo_code, o.id].some((v) => String(v || "").toLowerCase().includes(q))
      );
    }
    return list;
  }, [orders, filter, query]);

  if (loading)
    return (
      <div className="grid place-items-center rounded-2xl border border-border bg-card p-16">
        <Loader2 className="size-6 animate-spin text-violet" />
      </div>
    );

  if (orders.length === 0) return <EmptyOrders />;

  return (
    <>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders…"
            className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-sm focus:border-violet focus:outline-none"
          />
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-1 rounded-xl border border-border bg-card p-1">
            {(["all", "pending", "in_progress", "delivered", "revision_requested"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  filter === s ? "bg-violet text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No orders match your filter.
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((o) => (
            <OrderRow key={o.id} order={o} onOpen={() => setOpenId(o.id)} />
          ))}
        </div>
      )}

      {openId && <OrderDrawer id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

function OrderRow({ order: o, onOpen }: { order: any; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-violet/40 hover:shadow-lg hover:shadow-violet/10"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet/10 text-violet">
            <Package className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-base font-semibold">{o.service_label}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span className="font-mono">#{String(o.id).slice(0, 8)}</span>
              <span>·</span>
              <span>{new Date(o.created_at).toLocaleDateString()}</span>
              <span>·</span>
              <span>qty {o.quantity}</span>
              {o.promo_code && (
                <>
                  <span>·</span>
                  <span className="rounded bg-emerald/10 px-1.5 py-0.5 font-mono text-emerald">
                    {o.promo_code}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <StatusPill value={o.status} />
          <div className="ml-auto font-mono text-sm font-semibold sm:ml-0">{money(o.total_cents, o.currency)}</div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
      {o.delivery_url && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald/5 px-3 py-1.5 text-[11px] text-emerald">
          <Download className="size-3" /> Delivery ready — tap to open
        </div>
      )}
    </button>
  );
}

function EmptyOrders() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--color-violet-soft),transparent_60%)]" />
      <div className="relative">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-violet/10 text-violet">
          <Sparkles className="size-6" />
        </div>
        <h3 className="font-display text-xl font-bold">No orders yet</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Kick off your first order — verified leads delivered in 24 hours.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link
            to="/store"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet to-indigo px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet/25"
          >
            Browse services <ArrowUpRight className="size-4" />
          </Link>
          <button
            onClick={openOrderDrawer}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            Custom order
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    pending: "bg-neon-orange/10 text-neon-orange ring-1 ring-neon-orange/20",
    in_progress: "bg-indigo/15 text-indigo ring-1 ring-indigo/25",
    delivered: "bg-emerald/10 text-emerald ring-1 ring-emerald/20",
    cancelled: "bg-secondary text-muted-foreground ring-1 ring-border",
    refunded: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
    revision_requested: "bg-violet/10 text-violet ring-1 ring-violet/20",
  };
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
        map[value] ?? "bg-secondary"
      }`}
    >
      {value.replace("_", " ")}
    </span>
  );
}

/* ------------------------------ order drawer ------------------------------ */

function OrderDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const getFn = useServerFn(getMyOrder);
  const revFn = useServerFn(requestRevision);
  const { data, isLoading } = useQuery({
    queryKey: ["my-order", id],
    queryFn: () => getFn({ data: { id } }),
  });
  const [revText, setRevText] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);
  const rev = useMutation({
    mutationFn: () => revFn({ data: { order_id: id, message: revText } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-order", id] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      setRevText("");
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-end bg-black/60 backdrop-blur-sm sm:items-stretch"
      onClick={onClose}
    >
      <div
        className="theme-midnight max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-border bg-background p-5 shadow-2xl sm:h-full sm:max-h-none sm:rounded-none sm:border-l sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          ← Close
        </button>
        {isLoading || !data?.order ? (
          <Loader2 className="size-5 animate-spin text-violet" />
        ) : (
          <>
            <div className="mb-5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                Order #{String(data.order.id).slice(0, 8)}
              </span>
              <h2 className="mt-1 font-display text-2xl font-bold">{data.order.service_label}</h2>
              <div className="mt-2 flex items-center gap-2">
                <StatusPill value={data.order.status} />
                <span className="font-mono text-sm font-semibold">
                  {money(data.order.total_cents, data.order.currency)}
                </span>
              </div>
            </div>

            {data.order.delivery_url && (
              <div className="mb-5 overflow-hidden rounded-2xl border border-emerald/40 bg-gradient-to-br from-emerald/10 to-transparent p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald">
                  <Download className="size-4" /> Delivery ready
                </div>
                {data.order.delivery_notes && (
                  <p className="mb-3 text-sm text-muted-foreground">{data.order.delivery_notes}</p>
                )}
                <a
                  href={data.order.delivery_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                >
                  Open delivery <ExternalLink className="size-4" />
                </a>
              </div>
            )}

            {data.order.cancel_reason && (
              <div className="mb-5 rounded-2xl border border-rose-500/40 bg-rose-500/5 p-4 text-sm">
                <div className="mb-1 font-semibold text-rose-400">
                  Order {data.order.status}
                </div>
                <p className="text-muted-foreground">{data.order.cancel_reason}</p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Timeline
              </h3>
              <ol className="relative space-y-2 border-l border-border pl-4">
                <li className="relative">
                  <span className="absolute -left-[21px] top-1 grid size-3 place-items-center rounded-full bg-violet" />
                  <div className="rounded-xl border border-border bg-card p-3 text-xs">
                    <div className="font-semibold">Order placed</div>
                    <div className="text-muted-foreground">
                      {new Date(data.order.created_at).toLocaleString()}
                    </div>
                  </div>
                </li>
                {data.events.map((e: any) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[21px] top-1 grid size-3 place-items-center rounded-full bg-indigo" />
                    <div className="rounded-xl border border-border bg-card p-3 text-xs">
                      <div className="font-semibold uppercase">
                        {String(e.event_type).replace("_", " ")}
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(e.created_at).toLocaleString()} · {e.actor_role}
                      </div>
                      {e.message && <p className="mt-1">{e.message}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              <Link
                to="/invoice/$orderId"
                params={{ orderId: id }}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                <Receipt className="size-3" /> Invoice
              </Link>
              <Link
                to="/store"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                <RotateCcw className="size-3" /> Reorder
              </Link>
              <button
                onClick={() => setTicketOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-neon-orange/40 bg-neon-orange/10 px-3 py-1.5 text-xs font-semibold text-neon-orange hover:bg-neon-orange/20"
              >
                <LifeBuoy className="size-3" /> Report an issue
              </button>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                <MessageCircle className="size-3" /> Contact
              </Link>
            </div>

            <div>
              <h3 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Request revision
              </h3>
              <textarea
                value={revText}
                onChange={(e) => setRevText(e.target.value)}
                rows={3}
                placeholder="Describe what needs changing..."
                className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-violet focus:outline-none"
              />
              <button
                disabled={revText.trim().length < 3 || rev.isPending}
                onClick={() => rev.mutate()}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-violet px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {rev.isPending ? <Loader2 className="size-3 animate-spin" /> : null}
                Send revision request
              </button>
              {rev.isSuccess && (
                <p className="mt-2 text-xs text-emerald">Sent — admin has been notified.</p>
              )}
            </div>
          </>
        )}
      </div>
      <SupportTicketModal
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        orderId={id}
        orderLabel={data?.order?.service_label}
        defaultCategory="delivery"
      />
    </div>
  );
}

/* ------------------------------ downloads ------------------------------ */

function DownloadsTab({ orders }: { orders: any[] }) {
  if (orders.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-violet/10 text-violet">
          <Download className="size-5" />
        </div>
        <p className="text-sm text-muted-foreground">No delivered files yet. Once an order is delivered, it appears here.</p>
      </div>
    );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {orders.map((o) => (
        <div
          key={o.id}
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-colors hover:border-emerald/40"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-emerald/15 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-semibold">{o.service_label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Delivered {o.delivered_at ? new Date(o.delivered_at).toLocaleDateString() : "—"}
              </div>
              {o.delivery_notes && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{o.delivery_notes}</p>
              )}
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald/10 text-emerald">
              <Download className="size-4" />
            </span>
          </div>
          <a
            href={o.delivery_url}
            target="_blank"
            rel="noreferrer noopener"
            className="relative mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.01]"
          >
            Open delivery <ExternalLink className="size-3" />
          </a>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ invoices ------------------------------ */

function InvoicesTab({ orders }: { orders: any[] }) {
  if (orders.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Invoices appear once you place an order.
      </div>
    );
  return (
    <>
      {/* Mobile: card list */}
      <div className="grid gap-2 sm:hidden">
        {orders.map((o) => (
          <Link
            key={o.id}
            to="/invoice/$orderId"
            params={{ orderId: o.id }}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-violet/40"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">#{String(o.id).slice(0, 8)}</span>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
              </div>
              <div className="mt-1 truncate text-sm font-medium">{o.service_label}</div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-mono text-sm font-semibold">{money(o.total_cents, o.currency)}</span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                View <ArrowUpRight className="size-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono text-xs">#{String(o.id).slice(0, 8)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="truncate font-medium">{o.service_label}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {money(o.total_cents, o.currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/invoice/$orderId"
                      params={{ orderId: o.id }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-secondary"
                    >
                      View <ArrowUpRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ------------------------------ profile ------------------------------ */

function ProfileTab() {
  const getFn = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-profile"], queryFn: () => getFn() });
  const [form, setForm] = useState<{ full_name: string; company: string; phone: string; country: string }>({
    full_name: "",
    company: "",
    phone: "",
    country: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<{
    status: "idle" | "compressing" | "uploading" | "error";
    error?: string;
    savedKB?: number;
  }>({ status: "idle" });

  useEffect(() => {
    if (data) {
      setForm({
        full_name: data.full_name ?? "",
        company: data.company ?? "",
        phone: data.phone ?? "",
        country: data.country ?? "",
      });
      setAvatarUrl(data.avatar_url ?? null);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => updateFn({ data: { ...form, avatar_url: avatarUrl ?? null } }),
    onSuccess: async () => {
      // Keep auth.user_metadata in sync so components that read it
      // (chatbot prefill, review modal, etc.) reflect the new name/avatar.
      try {
        await supabase.auth.updateUser({
          data: { full_name: form.full_name, avatar_url: avatarUrl ?? null },
        });
      } catch {
        /* non-fatal — profile row is the source of truth */
      }
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });

  async function handleFile(file: File) {
    if (!data) return;
    const originalKB = Math.round(file.size / 1024);
    setUploadState({ status: "compressing" });
    try {
      const compressed = await compressImage(file, { maxDimension: 512, quality: 0.9 });
      setUploadState({ status: "uploading" });
      const path = `${data.user_id}/avatar-${Date.now()}.${compressed.ext}`;
      const contentType = compressed.ext === "webp" ? "image/webp" : "image/jpeg";
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, compressed.blob, { contentType, upsert: true, cacheControl: "31536000" });
      if (upErr) throw upErr;
      // Long-lived signed URL (1 year) — bucket is private but signed URLs
      // bypass RLS, so we can serve the avatar to anyone who has the profile.
      const { data: signed, error: signErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signErr || !signed?.signedUrl) throw signErr ?? new Error("Failed to create URL");
      setAvatarUrl(signed.signedUrl);
      // Persist immediately so the header/other places see the new avatar.
      await updateFn({ data: { ...form, avatar_url: signed.signedUrl } });
      try {
        await supabase.auth.updateUser({
          data: { full_name: form.full_name, avatar_url: signed.signedUrl },
        });
      } catch {
        /* non-fatal */
      }
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      const compressedKB = Math.round(compressed.bytes / 1024);
      setUploadState({ status: "idle", savedKB: Math.max(0, originalKB - compressedKB) });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setUploadState({ status: "error", error: message });
    }
  }

  async function handleRemove() {
    setAvatarUrl(null);
    try {
      await updateFn({ data: { ...form, avatar_url: null } });
      try {
        await supabase.auth.updateUser({ data: { avatar_url: null } });
      } catch {
        /* non-fatal */
      }
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    } catch {
      /* ignore — UI already reflects removal */
    }
  }

  if (isLoading || !data)
    return (
      <div className="grid place-items-center rounded-2xl border border-border bg-card p-16">
        <Loader2 className="size-5 animate-spin text-violet" />
      </div>
    );

  const fields: Array<{ key: keyof typeof form; label: string; placeholder: string }> = [
    { key: "full_name", label: "Full name", placeholder: "Alex Rivera" },
    { key: "company", label: "Company", placeholder: "Acme Corp" },
    { key: "phone", label: "Phone", placeholder: "+1 555 123 4567" },
    { key: "country", label: "Country", placeholder: "United States" },
  ];

  const uploading = uploadState.status === "compressing" || uploadState.status === "uploading";
  const uploadLabel =
    uploadState.status === "compressing"
      ? "Optimizing…"
      : uploadState.status === "uploading"
        ? "Uploading…"
        : avatarUrl
          ? "Change photo"
          : "Upload photo";

  return (
    <>
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={data.full_name || data.email}
              loading="lazy"
              decoding="async"
              width={64}
              height={64}
              className="size-16 rounded-2xl object-cover ring-2 ring-violet/40"
            />
          ) : (
            <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-violet to-indigo font-display text-xl font-bold text-white">
              {data.email?.[0]?.toUpperCase() ?? "L"}
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 grid size-7 cursor-pointer place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-violet">
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.currentTarget.value = "";
                if (f) setPendingFile(f);
              }}
            />
          </label>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{data.full_name || data.email}</div>
          <div className="truncate text-xs text-muted-foreground">{data.email}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
            <label className="cursor-pointer font-mono uppercase tracking-widest text-violet hover:underline">
              {uploadLabel}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.currentTarget.value = "";
                  if (f) setPendingFile(f);
                }}
              />
            </label>
            {avatarUrl && !uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1 font-mono uppercase tracking-widest text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3" /> Remove
              </button>
            )}
            {uploadState.status === "error" && (
              <span className="text-destructive">{uploadState.error}</span>
            )}
            {uploadState.status === "idle" && typeof uploadState.savedKB === "number" && uploadState.savedKB > 0 && (
              <span className="text-emerald">Saved {uploadState.savedKB} KB after compression</span>
            )}
          </div>
        </div>
      </div>

      <p className="mb-4 text-[11px] text-muted-foreground">
        Photos are resized to 512px and re-encoded as WebP for fast loading — original quality preserved for faces at typical avatar sizes.
      </p>

      <div className="mb-4">
        <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Email
        </label>
        <input
          value={data.email}
          disabled
          className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm opacity-70"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {f.label}
            </label>
            <input
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-violet focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet to-indigo px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet/25 disabled:opacity-50"
        >
          {save.isPending ? <Loader2 className="size-3 animate-spin" /> : null}
          Save changes
        </button>
        {save.isSuccess && <p className="text-xs text-emerald">Saved.</p>}
      </div>
    </div>
      <AvatarCropDialog
        file={pendingFile}
        open={!!pendingFile}
        onCancel={() => setPendingFile(null)}
        onApply={(cropped) => {
          setPendingFile(null);
          handleFile(cropped);
        }}
      />
    </>
  );
}


/* ------------------------------ sidebar cards ------------------------------ */

function ReferralCard() {
  const [copied, setCopied] = useState(false);
  const summaryFn = useServerFn(getMyReferralSummary);
  const { data } = useQuery({
    queryKey: ["my-referral-summary"],
    queryFn: () => summaryFn(),
    staleTime: 30_000,
    retry: false,
  });
  const code = data?.referral_code ?? "…";
  const link = typeof window !== "undefined"
    ? `${window.location.origin}/?ref=${code}`
    : `https://emailsly.com/?ref=${code}`;
  const balance = (data?.balance_cents ?? 0) / 100;
  const earned = (data?.totals.earned_cents ?? 0) / 100;
  const pending = (data?.totals.pending_cents ?? 0) / 100;
  const qualified = data?.referrals.filter((r: ReferralSummary["referrals"][number]) => r.status !== "pending").length ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-gradient-to-br from-neon-orange/30 to-violet/30 blur-3xl" />
      <div className="relative">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-neon-orange/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-neon-orange">
          <Gift className="size-3" /> Referral wallet
        </div>
        <h3 className="font-display text-lg font-bold">Give 10%, get 10%</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Every friend who orders unlocks a credit for you both. Applies as a discount on your next order.
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-emerald/30 bg-emerald/5 p-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-wider text-emerald/80">Balance</div>
            <div className="mt-0.5 font-display text-sm font-bold text-emerald">${balance.toFixed(2)}</div>
          </div>
          <div className="rounded-lg border border-border bg-background p-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Earned</div>
            <div className="mt-0.5 font-display text-sm font-bold">${earned.toFixed(2)}</div>
          </div>
          <div className="rounded-lg border border-border bg-background p-2 text-center">
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Signups</div>
            <div className="mt-0.5 font-display text-sm font-bold">{data?.referrals.length ?? 0}</div>
          </div>
        </div>

        {balance > 0 && (
          <p className="mt-3 rounded-lg bg-emerald/10 px-3 py-2 text-[11px] text-emerald">
            <strong>Use it:</strong> tick "Apply my referral credit" at checkout — it's deducted automatically, no code needed.
          </p>
        )}
        {pending > 0 && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            ${pending.toFixed(2)} more will unlock once {qualified === 0 ? "your first referred friend pays" : "more referred friends pay"}.
          </p>
        )}

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
          <span className="truncate font-mono text-xs">{link}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md bg-violet px-2 py-1 text-[11px] font-semibold text-white"
          >
            <Copy className="size-3" />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Your code: <span className="text-violet">{code}</span>
        </div>
      </div>
    </div>
  );
}

function RecommendedCard() {
  const items = [
    { to: "/apollo-leads-export", label: "Apollo custom export", sub: "500+ verified contacts" },
    { to: "/linkedin-sales-navigator-leads", label: "LinkedIn Sales Nav", sub: "Deep-search pulls" },
    { to: "/zoominfo-leads", label: "ZoomInfo leads", sub: "Enterprise-grade" },
    { to: "/manual-lead-research", label: "Manual research", sub: "Human-verified" },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="size-4 text-violet" />
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide">
          Explore services
        </h3>
      </div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.to}>
            <Link
              to={it.to as any}
              className="group flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-secondary"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{it.label}</div>
                <div className="truncate text-[11px] text-muted-foreground">{it.sub}</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SupportCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-violet/15 via-card to-card p-5">
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-violet">
        <Headphones className="size-3" /> Support
      </div>
      <h3 className="font-display text-lg font-bold">Need a hand?</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Our data specialists reply within hours — not days.
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          to="/contact"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet px-3 py-2 text-xs font-semibold text-white"
        >
          Message us
        </Link>
        <a
          href="https://wa.me/919999999999"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-secondary"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}
