import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SiteShell } from "@/components/site/SiteShell";
import { TrackOrderSkeleton } from "@/components/site/TrackOrderSkeleton";
import { TrackResultSkeleton } from "@/components/site/TrackResultSkeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAuth } from "@/hooks/use-auth";
import { Search, Package, Database, ShieldCheck, Truck, Check, Clock, Mail, Hash, AlertCircle, ArrowRight, RefreshCcw } from "lucide-react";
import { PremiumSparkles as Sparkles } from "@/components/site/PremiumIcons";
import { ordersApi, ApiError, getApiBase } from "@/lib/api-client";


export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Track your order | EmailsLy" },
      { name: "description", content: "Sign in to look up your EmailsLy order status in real time." },
      { property: "og:title", content: "Track your order | EmailsLy" },
      { property: "og:description", content: "Sign in to look up your EmailsLy order status in real time." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/track-order" }],
  }),
  pendingComponent: TrackOrderSkeleton,
  component: TrackOrderPage,
});

type Stage = {
  key: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STAGES: Stage[] = [
  { key: "received", label: "Order received", desc: "We've got your brief and payment confirmation.", icon: Package },
  { key: "sourcing", label: "Sourcing data", desc: "Our team is pulling your ICP from live databases.", icon: Database },
  { key: "verifying", label: "Verifying leads", desc: "Emails validated through MillionVerifier at 99% accuracy.", icon: ShieldCheck },
  { key: "delivered", label: "Delivered", desc: "Your export is ready — check your inbox for the download link.", icon: Truck },
];

type Lookup = {
  id: string;
  service: string;
  quantity: string;
  placed: string;
  eta: string;
  stageIndex: number;
  email: string;
};

// Deterministic mock — same input always returns the same result
type ErrorState = {
  title: string;
  message: string;
  hint?: string;
  detail?: string;
  kind: "validation" | "not_found" | "network" | "server";
};

function TrackOrderPage() {
  const hydrated = useHydrated();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Lookup | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  // Auth gate: Track Order is authenticated-only. Once the auth state is
  // resolved, unauthenticated visitors are bounced to /login with a
  // same-origin return path. The login route already validates that the
  // redirect param starts with "/".
  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (!user) {
      void navigate({ to: "/login", search: { redirect: "/track-order" } });
    }
  }, [hydrated, authLoading, user, navigate]);

  const detectKind = (q: string): "order" | "invoice" | "email" | "unknown" => {
    if (q.includes("@")) return /\S+@\S+\.\S+/.test(q) ? "email" : "unknown";
    if (/^lyr[-_]?\w{3,}$/i.test(q)) return "order";
    if (/^inv[-_]?\w{3,}$/i.test(q)) return "invoice";
    return "unknown";
  };

  const runLookup = async (q: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLastQuery(q);
    try {
      const resp = await ordersApi.track(q);
      const o = resp?.order;
      if (!o) {
        setError({
          kind: "not_found",
          title: "No matching order",
          message: `We couldn't find an order for “${q}”.`,
          hint: "Double-check the ID from your confirmation email, or try the email address you paid with.",
        });
        return;
      }
      setResult({
        id: o.id ?? o.order_id ?? q,
        service: o.service ?? o.product ?? "—",
        quantity: o.quantity ?? o.qty ?? "—",
        placed: o.placed_at ? new Date(o.placed_at).toLocaleString() : (o.created_at ? new Date(o.created_at).toLocaleString() : "—"),
        eta: o.eta ? new Date(o.eta).toLocaleString() : "—",
        stageIndex: Math.max(0, Math.min(STAGES.length - 1, Number(resp?.stageIndex ?? o.stage_index ?? 0))),
        email: o.email ?? "",
      });
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 404) {
          setError({
            kind: "not_found",
            title: "No matching order",
            message: `We couldn't find an order for “${q}”.`,
            hint: "Check the ID (LYR-…) or use the email you paid with. If you placed the order recently, try again in a minute.",
          });
        } else if (e.status === 400 || e.status === 422) {
          setError({
            kind: "validation",
            title: "Invalid lookup",
            message: e.message || "The server rejected that lookup value.",
            hint: "Use an order ID (LYR-000123), invoice number (INV-000123), or the email you paid with.",
          });
        } else if (e.status === 0 || /unreachable|Failed to fetch|NetworkError/i.test(e.message)) {
          setError({
            kind: "network",
            title: "Can't reach the tracking service",
            message: e.message,
            hint: "Check your internet connection or try again in a few seconds.",
            detail: `Base URL: ${getApiBase() || window.location.origin}`,
          });
        } else {
          setError({
            kind: "server",
            title: `Tracking failed (HTTP ${e.status || "?"})`,
            message: e.message || "Unexpected server response.",
            hint: "This is on us — please retry, or contact support if it keeps happening.",
            detail: `Base URL: ${getApiBase() || window.location.origin}`,
          });
        }
      } else {
        setError({
          kind: "network",
          title: "Can't reach the tracking service",
          message: e instanceof Error ? e.message : String(e),
          hint: "Check your connection and try again.",
          detail: `Base URL: ${getApiBase() || window.location.origin}`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setError({ kind: "validation", title: "Enter something to look up", message: "Please enter your order ID, invoice number, or email." });
      setResult(null);
      return;
    }
    if (q.includes("@") && !/\S+@\S+\.\S+/.test(q)) {
      setError({ kind: "validation", title: "That email looks incomplete", message: "Use the full address you paid with (e.g. you@company.com)." });
      setResult(null);
      return;
    }
    if (q.length < 4) {
      setError({ kind: "validation", title: "Too short", message: "Order IDs and invoices are at least 4 characters." });
      setResult(null);
      return;
    }
    const kind = detectKind(q);
    if (kind === "unknown") {
      setError({
        kind: "validation",
        title: "Unrecognized format",
        message: "Use an order ID (LYR-000123), an invoice number (INV-000123), or the email you paid with.",
      });
      setResult(null);
      return;
    }
    void runLookup(q);
  };

  const errorMsg = error?.message ?? null;


  if (!hydrated || authLoading || !user) {
    return (
      <SiteShell>
        <TrackOrderSkeleton />
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="relative overflow-hidden px-6 py-16 sm:py-24">
        <div className="pointer-events-none absolute right-0 top-20 -z-10 size-96 rounded-full bg-violet/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-10 -z-10 size-96 rounded-full bg-coral/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              <Sparkles className="size-3" /> Order tracking
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Where's my <span className="text-violet">order</span>?
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Enter your order ID, invoice number, or the email you used to place the
              order — we'll show live status in seconds.
            </p>
          </div>

          {/* Lookup form */}
          <form
            onSubmit={onSubmit}
            className="mx-auto mt-8 max-w-2xl rounded-3xl border border-border bg-card p-3 shadow-[0_20px_60px_-30px_rgba(24,24,60,0.25)] sm:p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (error) setError(null);
                  }}

                  aria-invalid={!!errorMsg}
                  aria-describedby={errorMsg ? "track-error" : undefined}
                  placeholder="LYR-000123, INV-000123, or you@company.com"
                  className={`w-full rounded-2xl border bg-background py-3.5 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-4 sm:text-base ${
                    errorMsg
                      ? "border-coral focus:border-coral focus:ring-coral/10"
                      : "border-input focus:border-violet focus:ring-violet/10"
                  }`}
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet/40 sm:text-base"
              >
                Track order <ArrowRight className="size-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Hash className="size-3" /> Order ID</span>
              <span className="inline-flex items-center gap-1.5"><Hash className="size-3" /> Invoice #</span>
              <span className="inline-flex items-center gap-1.5"><Mail className="size-3" /> Email</span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-emerald"><ShieldCheck className="size-3" /> Private lookup</span>
            </div>
          </form>

          {/* Error state — validation / not-found / network / server */}
          {error && (
            <div
              id="track-error"
              role="alert"
              className={`mx-auto mt-6 max-w-2xl rounded-2xl border p-4 text-left ${
                error.kind === "not_found"
                  ? "border-amber-300/40 bg-amber-50/60 dark:bg-amber-950/20"
                  : error.kind === "network" || error.kind === "server"
                    ? "border-coral/30 bg-coral-soft/60"
                    : "border-coral/30 bg-coral-soft/60"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-coral" />
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-semibold text-foreground">{error.title}</div>
                  <div className="mt-1 break-words text-muted-foreground">{error.message}</div>
                  {error.hint && (
                    <div className="mt-2 text-muted-foreground">{error.hint}</div>
                  )}
                  {error.detail && (
                    <div className="mt-2 rounded-lg bg-background/60 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                      {error.detail}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {(error.kind === "network" || error.kind === "server") && lastQuery && (
                      <button
                        type="button"
                        onClick={() => void runLookup(lastQuery)}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:border-violet hover:text-violet"
                      >
                        <RefreshCcw className="size-3.5" /> Retry
                      </button>
                    )}
                    <Link to="/contact" className="text-xs font-semibold text-violet hover:underline">
                      Contact support
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Loading state */}
          {loading && <TrackResultSkeleton />}

          {/* Result */}
          {result && (
            <div className="mt-10 space-y-6">
              {/* Summary card */}
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_-30px_rgba(24,24,60,0.25)]">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-secondary/40 px-5 py-4 sm:px-8">
                  <div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order</div>
                    <div className="font-display text-lg font-bold tracking-tight sm:text-xl">{result.id}</div>
                  </div>
                  <StatusPill stage={STAGES[result.stageIndex]} isComplete={result.stageIndex === STAGES.length - 1} />
                </div>
                <div className="grid gap-4 px-5 py-5 text-sm sm:grid-cols-4 sm:px-8 sm:py-6">
                  <InfoCell label="Service" value={result.service} />
                  <InfoCell label="Quantity" value={result.quantity} />
                  <InfoCell label="Placed" value={result.placed} />
                  <InfoCell label="Est. delivery" value={result.eta} />
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-3xl border border-border bg-card p-5 shadow-[0_20px_60px_-30px_rgba(24,24,60,0.25)] sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold sm:text-xl">Progress</h2>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Step {result.stageIndex + 1} of {STAGES.length}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet to-coral transition-all"
                    style={{ width: `${((result.stageIndex + 1) / STAGES.length) * 100}%` }}
                  />
                </div>

                <ol className="space-y-5">
                  {STAGES.map((s, i) => {
                    const done = i < result.stageIndex;
                    const active = i === result.stageIndex;
                    const Icon = s.icon;
                    return (
                      <li key={s.key} className="flex items-start gap-4">
                        <div
                          className={`grid size-10 shrink-0 place-items-center rounded-xl border transition-all ${
                            done
                              ? "border-emerald/30 bg-emerald-soft text-emerald"
                              : active
                                ? "border-violet/30 bg-violet text-white shadow-lg shadow-violet/25"
                                : "border-border bg-secondary text-muted-foreground"
                          }`}
                        >
                          {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className={`text-sm font-semibold sm:text-base ${active ? "text-foreground" : done ? "text-foreground" : "text-muted-foreground"}`}>
                              {s.label}
                            </span>
                            {active && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-violet-soft px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                                <Clock className="size-3" /> In progress
                              </span>
                            )}
                            {done && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-soft px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald">
                                <Check className="size-3" /> Done
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-sm">
                  <div className="text-muted-foreground">
                    Updates are sent to <span className="font-semibold text-foreground">{result.email}</span>.
                  </div>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 font-semibold transition-colors hover:border-violet hover:text-violet"
                  >
                    Need help? <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Empty state (before search) */}
          {!result && !error && !loading && (
            <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                { icon: Hash, title: "Find your ID", desc: "It's in the confirmation email subject line (LYR-…)." },
                { icon: Clock, title: "Live status", desc: "See exactly which stage your order is in right now." },
                { icon: ShieldCheck, title: "No account needed", desc: "Quick lookup — no login, no password reset dance." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
                  <div className="mb-2 grid size-9 place-items-center rounded-lg bg-violet-soft text-violet">
                    <Icon className="size-4" />
                  </div>
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function StatusPill({ stage, isComplete }: { stage: Stage; isComplete: boolean }) {
  const Icon = isComplete ? Check : stage.icon;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest ${
        isComplete
          ? "bg-emerald-soft text-emerald"
          : "bg-violet-soft text-violet"
      }`}
    >
      <Icon className="size-3.5" />
      {isComplete ? "Delivered" : stage.label}
    </span>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
