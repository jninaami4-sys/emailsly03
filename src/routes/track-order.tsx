import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackOrderSkeleton } from "@/components/site/TrackOrderSkeleton";
import { TrackResultSkeleton } from "@/components/site/TrackResultSkeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { Search, Package, Database, ShieldCheck, Truck, Check, Clock, Mail, Hash, AlertCircle, ArrowRight } from "lucide-react";
import { PremiumSparkles as Sparkles } from "@/components/site/PremiumIcons";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Track your order | LyraData" },
      { name: "description", content: "Look up your LyraData order status in real time using your order ID or email." },
      { property: "og:title", content: "Track your order | LyraData" },
      { property: "og:description", content: "Look up your LyraData order status in real time using your order ID or email." },
    ],
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
function mockLookup(query: string): Lookup | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const hash = Array.from(q).reduce((a, c) => a + c.charCodeAt(0), 0);
  const stageIndex = hash % STAGES.length;
  const services = ["Apollo B2B Data", "LinkedIn Lead Lists", "Hand-Picked Leads", "ZoomInfo Data"];
  const quantities = ["5,000 leads", "10,000 leads", "25,000 leads", "50,000 leads"];
  return {
    id: q.startsWith("lyr-") ? query.trim().toUpperCase() : `LYR-${String(hash).padStart(6, "0")}`,
    service: services[hash % services.length],
    quantity: quantities[hash % quantities.length],
    placed: new Date(Date.now() - (hash % 20) * 3600_000).toLocaleString(),
    eta: new Date(Date.now() + ((STAGES.length - stageIndex) * 6) * 3600_000).toLocaleString(),
    stageIndex,
    email: q.includes("@") ? query.trim() : "you@company.com",
  };
}

function TrackOrderPage() {
  const hydrated = useHydrated();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const result = useMemo(
    () => (submitted && !loading ? mockLookup(submitted) : null),
    [submitted, loading],
  );

  useEffect(() => {
    if (!submitted) return;
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 850);
    return () => window.clearTimeout(t);
  }, [submitted]);

  const detectKind = (q: string): "order" | "invoice" | "email" | "unknown" => {
    if (q.includes("@")) return /\S+@\S+\.\S+/.test(q) ? "email" : "unknown";
    if (/^lyr[-_]?\w{3,}$/i.test(q)) return "order";
    if (/^inv[-_]?\w{3,}$/i.test(q)) return "invoice";
    return "unknown";
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setErrorMsg("Please enter your order ID, invoice number, or email.");
      setSubmitted(null);
      return;
    }
    if (q.includes("@") && !/\S+@\S+\.\S+/.test(q)) {
      setErrorMsg("That email looks incomplete — use the full address you paid with.");
      setSubmitted(null);
      return;
    }
    if (q.length < 4) {
      setErrorMsg("Too short — order IDs and invoices are at least 4 characters.");
      setSubmitted(null);
      return;
    }
    const kind = detectKind(q);
    if (kind === "unknown") {
      setErrorMsg(
        "Use an order ID (LYR-000123), an invoice number (INV-000123), or the email you paid with.",
      );
      setSubmitted(null);
      return;
    }
    setErrorMsg(null);
    setSubmitted(q);
  };

  if (!hydrated) {
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
                    if (errorMsg) setErrorMsg(null);
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

          {/* Validation / not-found state */}
          {errorMsg && (
            <div
              id="track-error"
              role="alert"
              className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-2xl border border-coral/30 bg-coral-soft/60 p-4 text-left"
            >
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-coral" />
              <div className="text-sm">
                <div className="font-semibold text-foreground">Check your input</div>
                <div className="mt-1 text-muted-foreground">
                  {errorMsg}{" "}
                  Still stuck? <Link to="/contact" className="font-semibold text-violet hover:underline">Contact support</Link>.
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
          {!result && !notFound && (
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
