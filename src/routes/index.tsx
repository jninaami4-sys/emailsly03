import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { ProductCard } from "@/components/site/ProductCard";
import { PRODUCTS } from "@/lib/products";
import rawApollo from "@/lib/apollo-leads-raw.json";
import rawLinkedin from "@/lib/linkedin-leads-raw.json";
import rawZoominfo from "@/lib/zoominfo-leads-raw.json";
import { openOrderDrawer } from "@/components/site/OrderDrawer";

import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Database,
  Star,
  Download,
  Search,
  Sparkles,
  Layers,
  Timer,
  Target,
  Globe2,
} from "lucide-react";
import { Testimonials } from "@/components/site/Testimonials";

type RawData = {
  headers: string[];
  rows: Record<string, string | number | boolean>[];
};
const apolloData = rawApollo as RawData;
const linkedinData = rawLinkedin as RawData;
const zoominfoData = rawZoominfo as RawData;

type SourceKey = "apollo" | "linkedin" | "zoominfo";
type SourceMeta = {
  key: SourceKey;
  label: string;
  file: string;
  accent: "indigo" | "coral" | "emerald";
  rows: number;
  cols: number;
};

const SOURCES: SourceMeta[] = [
  { key: "apollo", label: "Apollo", file: "apollo_sample_leads.csv", accent: "indigo", rows: apolloData.rows.length, cols: apolloData.headers.length },
  { key: "linkedin", label: "LinkedIn", file: "linkedin_sales_nav.csv", accent: "coral", rows: linkedinData.rows.length, cols: linkedinData.headers.length },
  { key: "zoominfo", label: "ZoomInfo", file: "zoominfo_export.csv", accent: "emerald", rows: zoominfoData.rows.length, cols: zoominfoData.headers.length },
];

const ACCENT: Record<SourceMeta["accent"], { dot: string; text: string; ring: string; solid: string }> = {
  indigo: { dot: "bg-indigo", text: "text-indigo", ring: "ring-indigo/40", solid: "bg-indigo text-white" },
  coral: { dot: "bg-coral", text: "text-coral", ring: "ring-coral/40", solid: "bg-coral text-white" },
  emerald: { dot: "bg-emerald", text: "text-emerald", ring: "ring-emerald/40", solid: "bg-emerald text-white" },
};

const SOURCE_DATA: Record<SourceKey, RawData> = {
  apollo: apolloData,
  linkedin: linkedinData,
  zoominfo: zoominfoData,
};

const csvEscape = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const downloadCsv = (filename: string, data: RawData) => {
  const lines = [
    data.headers.map(csvEscape).join(","),
    ...data.rows.map((r) => data.headers.map((h) => csvEscape(r[h])).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LyraData — Verified B2B leads from Apollo, ZoomInfo & LinkedIn" },
      { name: "description", content: "Clean, verified B2B lead exports from Apollo, ZoomInfo, and LinkedIn Sales Navigator — delivered to your CRM in 24 hours." },
      { property: "og:title", content: "LyraData — Verified B2B Data Platform" },
      { property: "og:description", content: "Verified leads delivered to your CRM in 24h. No manual cleaning." },
    ],
  }),
  component: Home,
});

const stats = [
  { k: "24h", v: "avg. delivery" },
  { k: "99%", v: "deliverability" },
  { k: "4.2K", v: "operators onboard" },
  { k: "12M+", v: "leads shipped" },
];

const faqs = [
  { q: "How fast will I receive my data?", a: "Most orders are delivered within 24 hours. Larger or custom research orders may take 48–72 hours. You'll get an email update at every step." },
  { q: "What format will the data be in?", a: "All data is delivered as a clean, ready-to-import CSV file with verified work emails, job titles, company info, and LinkedIn URLs (where available)." },
  { q: "How accurate is the data?", a: "Emails are validated in real-time before delivery. If any leads bounce, we replace them free of charge." },
  { q: "Do you offer custom ICP / niche research?", a: "Yes — our Manual Lead Research service is 100% human-verified and perfect for complex ICPs that automated tools miss." },
  { q: "What payment methods do you accept?", a: "We accept secure payments via card, bank transfer, and crypto. Payment links are sent after order confirmation." },
  { q: "Can I track my order status?", a: "Absolutely. Use our Track Order page with your order ID or email, or create a free account to see all your orders in one dashboard." },
];

function Home() {
  const featured = PRODUCTS.filter((p) => p.featured).concat(PRODUCTS.filter((p) => !p.featured)).slice(0, 6);
  const [activeSource, setActiveSource] = useState<SourceKey>("apollo");
  const [query, setQuery] = useState("");
  const active = SOURCES.find((s) => s.key === activeSource)!;
  const accent = ACCENT[active.accent];
  const totalRows = SOURCES.reduce((a, s) => a + s.rows, 0);
  const rawActive = SOURCE_DATA[activeSource];
  const filteredRows = useMemo(() => {
    if (!query.trim()) return rawActive.rows;
    const q = query.toLowerCase();
    return rawActive.rows.filter((r) =>
      rawActive.headers.some((h) => String(r[h] ?? "").toLowerCase().includes(q)),
    );
  }, [query, rawActive]);

  return (
    <SiteShell>
      <div className="theme-midnight bg-background text-foreground">
        {/* HERO */}
        <section className="relative overflow-hidden px-6 pt-20 pb-16 lg:pt-28 lg:pb-24">
          {/* Ambient */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-[-10%] size-[900px] -translate-x-1/2 rounded-full bg-indigo/25 blur-[140px]" />
            <div className="absolute right-[-10%] top-[30%] size-[500px] rounded-full bg-coral/10 blur-[120px]" />
            <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo/60 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-indigo" />
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/80">
                  3 live sample databases · verified today
                </span>
              </div>

              <h1 className="font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-foreground md:text-7xl lg:text-[88px]">
                Prospect data that
                <br />
                <span className="bg-gradient-to-br from-white via-white to-indigo bg-clip-text text-transparent">
                  actually converts.
                </span>
              </h1>

              <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-foreground/70 md:text-xl">
                On-demand B2B leads from Apollo, LinkedIn Sales Navigator, and ZoomInfo — verified, formatted, and dropped into your CRM in under 24 hours.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  onClick={openOrderDrawer}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo px-8 py-4 text-base font-semibold text-white shadow-[0_20px_50px_-15px_rgba(79,70,229,0.8)] transition-all hover:-translate-y-0.5 sm:w-auto"
                >
                  Build your order
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
                <Link
                  to="/sample-data"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-8 py-4 text-base font-semibold text-foreground backdrop-blur transition-colors hover:bg-white/[0.08] sm:w-auto"
                >
                  Preview live samples
                </Link>
              </div>

              {/* Stat strip */}
              <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.v} className="bg-midnight/70 px-4 py-5 text-center">
                    <div className="font-display text-2xl font-bold tabular-nums text-foreground md:text-3xl">{s.k}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-foreground/50">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BENTO GRID */}
        <section className="px-6 pb-24">
          <div className="mx-auto grid max-w-7xl auto-rows-[220px] grid-cols-1 gap-4 md:grid-cols-6">
            {/* Live data console — hero card */}
            <article className="group relative col-span-1 row-span-3 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 md:col-span-4 md:row-span-2">
              <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-indigo/25 blur-3xl" />
              <div className="relative flex h-full flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid size-9 place-items-center rounded-xl bg-indigo/20 text-indigo">
                      <Database className="size-4" />
                    </div>
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/50">Live data console</p>
                      <p className="font-display text-sm font-bold">{totalRows.toLocaleString()} rows across 3 sources</p>
                    </div>
                  </div>
                  <div className="hidden items-center gap-1.5 sm:flex">
                    {SOURCES.map((s) => {
                      const a = ACCENT[s.accent];
                      const isA = s.key === activeSource;
                      return (
                        <button
                          key={s.key}
                          onClick={() => setActiveSource(s.key)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${
                            isA ? `border-transparent ${a.solid}` : "border-white/10 bg-white/5 text-foreground/60 hover:bg-white/10"
                          }`}
                        >
                          <span className={`size-1.5 rounded-full ${isA ? "bg-white/70" : a.dot}`} />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[140px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-foreground/40" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={`Search ${active.label} rows…`}
                      className="w-full rounded-lg border border-white/10 bg-black/30 py-1.5 pl-8 pr-3 font-mono text-[11px] text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo/40"
                    />
                  </div>
                  <button
                    onClick={() => downloadCsv(active.file, rawActive)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-transform hover:-translate-y-0.5 ${accent.solid}`}
                  >
                    <Download className="size-3.5" /> CSV
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  <div className="h-full overflow-auto">
                    <table className="w-full min-w-[640px] border-collapse text-sm">
                      <thead className="sticky top-0 z-10 bg-black/60 backdrop-blur">
                        <tr>
                          <th className="w-10 border-b border-white/10 px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/50">#</th>
                          {rawActive.headers.map((h) => (
                            <th key={h} className="whitespace-nowrap border-b border-white/10 px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/50">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.length === 0 ? (
                          <tr><td colSpan={rawActive.headers.length + 1} className="px-5 py-10 text-center font-mono text-xs text-foreground/50">No rows match “{query}”.</td></tr>
                        ) : (
                          filteredRows.slice(0, 60).map((r, i) => (
                            <tr key={i} className="border-b border-white/[0.06] transition-colors last:border-0 hover:bg-white/[0.03]">
                              <td className="w-10 px-3 py-2 font-mono text-[10px] text-foreground/40">{i + 1}</td>
                              {rawActive.headers.map((h) => {
                                const v = String(r[h] ?? "");
                                return (
                                  <td key={h} className="max-w-[220px] truncate whitespace-nowrap px-3 py-2 text-foreground/85" title={v}>
                                    {v || <span className="text-foreground/30">—</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest text-foreground/50">
                  <span>{filteredRows.length.toLocaleString()} / {active.rows.toLocaleString()} rows · {active.cols} cols</span>
                  <Link to="/sample-data" className={`inline-flex items-center gap-1 ${accent.text} hover:opacity-80`}>
                    Open full sample <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            </article>

            {/* Instant quote CTA */}
            <button
              onClick={openOrderDrawer}
              className="group relative col-span-1 row-span-2 overflow-hidden rounded-3xl border border-indigo/40 bg-gradient-to-br from-indigo to-[oklch(0.42_0.22_275)] p-6 text-left text-white transition-transform hover:-translate-y-0.5 md:col-span-2"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 size-48 rounded-full bg-white/15 blur-2xl" />
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <Sparkles className="size-6" />
                  <h3 className="mt-6 font-display text-2xl font-bold leading-tight md:text-3xl">Get your price in 30 seconds.</h3>
                  <p className="mt-3 text-sm text-white/80">Slide out the builder, pick a service, see the exact cost. No calls, no forms.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest">
                  Open builder <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </button>

            {/* Verified feature */}
            <article className="col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:col-span-2">
              <div className="grid size-10 place-items-center rounded-xl bg-emerald/15 text-emerald">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">Real-time verification</h3>
              <p className="mt-1 text-sm text-foreground/60">Every email pinged live. Bounces replaced free.</p>
            </article>

            {/* 24h feature */}
            <article className="col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:col-span-2">
              <div className="grid size-10 place-items-center rounded-xl bg-indigo/15 text-indigo">
                <Timer className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">24h turnaround</h3>
              <p className="mt-1 text-sm text-foreground/60">Requirements in, cleaned dataset out — under a business day.</p>
            </article>

            {/* CRM feature */}
            <article className="col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:col-span-2">
              <div className="grid size-10 place-items-center rounded-xl bg-coral/15 text-coral">
                <Layers className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">CRM-native format</h3>
              <p className="mt-1 text-sm text-foreground/60">Mapped for HubSpot, Salesforce, Pipedrive. Single-click import.</p>
            </article>

            {/* ICP */}
            <article className="col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:col-span-3">
              <div className="flex items-start gap-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo/15 text-indigo">
                  <Target className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Precise ICP targeting</h3>
                  <p className="mt-1 text-sm text-foreground/60">Filter by title, seniority, tech-stack, funding, geo — pick a saved Apollo URL or paste your own.</p>
                </div>
              </div>
            </article>

            {/* Global */}
            <article className="col-span-1 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:col-span-3">
              <div className="flex items-start gap-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald/15 text-emerald">
                  <Globe2 className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Global coverage</h3>
                  <p className="mt-1 text-sm text-foreground/60">100M+ contacts across 180+ countries, GDPR &amp; CCPA compliant.</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* FEATURED PRODUCTS */}
        <section className="border-t border-white/10 px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-indigo">Prebuilt lists</p>
                <h2 className="mt-2 font-display text-3xl font-bold lg:text-5xl">Ship in one click.</h2>
                <p className="mt-2 max-w-xl text-foreground/60">Instant CSV download, verified contacts, ready to import.</p>
              </div>
              <Link to="/store" className="inline-flex items-center gap-1 font-semibold text-indigo hover:underline">
                Browse full store <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial band */}
        <section className="relative overflow-hidden border-y border-white/10 px-6 py-24">
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-indigo/20 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-coral/10 blur-[100px]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center gap-1 text-indigo">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-5 fill-current" />
              ))}
            </div>
            <blockquote className="font-display text-3xl font-medium leading-snug text-foreground md:text-4xl">
              "LyraData cut our prospecting time in half. We no longer spend hours cleaning Apollo exports — we just receive the verified file and start selling."
            </blockquote>
            <div className="mt-10 flex items-center justify-center gap-3">
              <div className="grid size-12 place-items-center rounded-full bg-indigo font-bold text-white">MT</div>
              <div className="text-left">
                <p className="font-bold">Marcus Thorne</p>
                <p className="text-sm text-foreground/60">VP Sales, VelocityGrowth</p>
              </div>
            </div>
          </div>
        </section>

        <Testimonials />

        {/* FAQ */}
        <section className="border-t border-white/10 px-6 py-24">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-indigo">FAQ</p>
              <h2 className="mt-2 font-display text-4xl font-bold">Answers before you ask.</h2>
              <p className="mt-4 text-foreground/60">Still curious? Open the order builder or ping our team — we reply in under an hour.</p>
              <button
                onClick={openOrderDrawer}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Build your order <ArrowUpRight className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 open:bg-white/[0.06]">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-foreground">
                    {f.q}
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo/20 text-indigo transition-transform group-open:rotate-45">
                      <Zap className="size-3.5" />
                    </span>
                  </summary>
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/70">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-indigo/25 via-midnight-surface to-midnight p-12 text-center md:p-24">
            <div className="pointer-events-none absolute -right-20 top-1/2 size-96 -translate-y-1/2 rounded-full bg-indigo/40 blur-3xl" />
            <div className="relative">
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/80">
                <Zap className="size-3 text-indigo" /> Ready when you are
              </div>
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
                Your next 10,000 leads <br className="hidden md:block" />are one slide away.
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/70">
                Skip the sales call. Open the builder, pick your service, and get a verified export by tomorrow.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <button
                  onClick={openOrderDrawer}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-indigo shadow-xl transition-transform hover:-translate-y-0.5"
                >
                  Build your order <ArrowUpRight className="size-4" />
                </button>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-transparent px-8 py-4 text-base font-bold text-foreground transition-colors hover:bg-white/10"
                >
                  Talk to sales
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
