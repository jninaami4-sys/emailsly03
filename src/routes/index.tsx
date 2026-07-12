import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { ProductCard } from "@/components/site/ProductCard";
import { PRODUCTS } from "@/lib/products";
import rawApollo from "@/lib/apollo-leads-raw.json";
import rawLinkedin from "@/lib/linkedin-leads-raw.json";
import rawZoominfo from "@/lib/zoominfo-leads-raw.json";

import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Database,
  CheckCircle2,
  Star,
  Sparkles,
  Download,
  Search,
} from "lucide-react";
import { Testimonials } from "@/components/site/Testimonials";
import { OrderBuilder } from "@/components/site/OrderBuilder";

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
  accent: "violet" | "coral" | "emerald";
  rows: number;
  cols: number;
  highlight: string;
  preview: Array<{
    name: string;
    title: string;
    company: string;
    email: string;
    tag: string;
  }>;
};

const nameOf = (r: Record<string, string | number | boolean>, keys: string[]) =>
  keys.map((k) => String(r[k] ?? "").trim()).filter(Boolean).join(" ");

const SOURCES: SourceMeta[] = [
  {
    key: "apollo",
    label: "Apollo",
    file: "apollo_sample_leads.csv",
    accent: "violet",
    rows: apolloData.rows.length,
    cols: apolloData.headers.length,
    highlight: "Verified emails + firmographics",
    preview: apolloData.rows.slice(0, 4).map((r) => ({
      name: nameOf(r, ["First Name", "Last Name"]),
      title: String(r["Title"] ?? ""),
      company: String(r["Company Name"] ?? ""),
      email: String(r["Email"] ?? ""),
      tag: String(r["Email Status"] ?? "Verified"),
    })),
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    file: "linkedin_sales_nav.csv",
    accent: "coral",
    rows: linkedinData.rows.length,
    cols: linkedinData.headers.length,
    highlight: "Sales Nav scrape + direct dials",
    preview: linkedinData.rows.slice(0, 4).map((r) => ({
      name: nameOf(r, ["first_name", "last_name"]),
      title: String(r["job_title"] ?? ""),
      company: String(r["company_name"] ?? ""),
      email: String(r["email_first"] ?? ""),
      tag: String(r["phone"] ? "+ Phone" : "LinkedIn"),
    })),
  },
  {
    key: "zoominfo",
    label: "ZoomInfo",
    file: "zoominfo_export.csv",
    accent: "emerald",
    rows: zoominfoData.rows.length,
    cols: zoominfoData.headers.length,
    highlight: "Mobile phones + revenue bands",
    preview: zoominfoData.rows.slice(0, 4).map((r) => ({
      name: String(r["name"] ?? ""),
      title: String(r["lead_titles"] ?? ""),
      company: String(r["company_name"] ?? ""),
      email: String(r["email"] ?? ""),
      tag: r["email_score"] ? `Score ${r["email_score"]}` : "Enriched",
    })),
  },
];

const ACCENT_CLASSES: Record<
  SourceMeta["accent"],
  { dot: string; text: string; soft: string; ring: string; solid: string }
> = {
  violet: {
    dot: "bg-violet",
    text: "text-violet",
    soft: "bg-violet-soft",
    ring: "ring-violet/30",
    solid: "bg-violet text-white",
  },
  coral: {
    dot: "bg-coral",
    text: "text-coral",
    soft: "bg-coral-soft",
    ring: "ring-coral/30",
    solid: "bg-coral text-white",
  },
  emerald: {
    dot: "bg-emerald",
    text: "text-emerald",
    soft: "bg-emerald-soft",
    ring: "ring-emerald/30",
    solid: "bg-emerald text-white",
  },
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

const logos = ["Apollo", "Salesforce", "HubSpot", "LinkedIn", "ZoomInfo", "Pipedrive"];

const features = [
  {
    icon: ShieldCheck,
    title: "Real-time verification",
    desc: "Every email is pinged in real-time before delivery to ensure near-zero bounce rates for your outreach.",
  },
  {
    icon: Zap,
    title: "24h turnaround",
    desc: "Upload your requirements and receive a cleaned, formatted dataset in less than one business day.",
  },
  {
    icon: Database,
    title: "CRM-native format",
    desc: "Custom mapping for HubSpot, Salesforce, and Pipedrive so you can import with a single click.",
  },
];

const faqs = [
  {
    q: "How fast will I receive my data?",
    a: "Most orders are delivered within 24 hours. Larger or custom research orders may take 48–72 hours. You'll get an email update at every step.",
  },
  {
    q: "What format will the data be in?",
    a: "All data is delivered as a clean, ready-to-import CSV file with verified work emails, job titles, company info, and LinkedIn URLs (where available).",
  },
  {
    q: "How accurate is the data?",
    a: "Emails are validated in real-time before delivery. If any leads bounce, we replace them free of charge.",
  },
  {
    q: "Do you offer custom ICP / niche research?",
    a: "Yes — our Manual Lead Research service is 100% human-verified and perfect for complex ICPs that automated tools miss.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept secure payments via card, bank transfer, and crypto. Payment links are sent after order confirmation.",
  },
  {
    q: "Can I track my order status?",
    a: "Absolutely. Use our Track Order page with your order ID or email, or create a free account to see all your orders in one dashboard.",
  },
];

function Home() {
  const featured = PRODUCTS.filter((p) => p.featured).concat(PRODUCTS.filter((p) => !p.featured)).slice(0, 6);
  const [activeSource, setActiveSource] = useState<SourceKey>("apollo");
  const [query, setQuery] = useState("");
  const active = SOURCES.find((s) => s.key === activeSource)!;
  const accent = ACCENT_CLASSES[active.accent];
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
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 lg:pt-24">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,var(--violet-soft),transparent_70%)] opacity-70" />
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft px-3 py-1">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet/60 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-violet" />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              3 live sample databases included
            </span>
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tighter text-foreground md:text-7xl">
            High-intent B2B leads,
            <br />
            delivered to your <span className="text-violet">CRM in 24h.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Real samples from Apollo, LinkedIn Sales Navigator, and ZoomInfo — preview every row before you buy.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              to="/store"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet px-8 py-4 text-base font-semibold text-white shadow-lg shadow-violet/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet/30 sm:w-auto"
            >
              Start Exporting <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/sample-data"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary sm:w-auto"
            >
              View Sample Data
            </Link>
          </div>
        </div>

        {/* Multi-source data console */}
        <div className="relative mx-auto mt-20 max-w-6xl">
          {/* soft aurora */}
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-[conic-gradient(from_120deg_at_50%_50%,var(--violet-soft),var(--coral-soft),var(--emerald-soft),var(--violet-soft))] opacity-60 blur-3xl" />

          {/* Stacked file tabs (offset stack visual) */}
          <div className="relative mx-auto mb-[-14px] flex max-w-xl items-end justify-center gap-2">
            {SOURCES.map((s) => {
              const isActive = s.key === activeSource;
              const a = ACCENT_CLASSES[s.accent];
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSource(s.key)}
                  className={`group relative flex items-center gap-2 rounded-t-xl border border-b-0 border-border px-4 pb-4 pt-2.5 font-mono text-[11px] transition-all ${
                    isActive
                      ? `z-20 bg-card ${a.text} translate-y-0`
                      : "z-10 translate-y-1.5 bg-secondary/70 text-muted-foreground hover:translate-y-0.5"
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${a.dot}`} />
                  {s.file}
                </button>
              );
            })}
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-2xl">
            {/* console header row */}
            <div className="flex flex-col gap-3 border-b border-border px-3 pb-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-muted-foreground/25" />
                  <span className="size-2.5 rounded-full bg-muted-foreground/25" />
                  <span className="size-2.5 rounded-full bg-muted-foreground/25" />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  ~/lyra/exports /{" "}
                  <span className={`font-semibold ${accent.text}`}>{active.file}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${accent.soft} ${accent.text}`}>
                  <CheckCircle2 className="size-3" />
                  {active.highlight}
                </span>
              </div>
            </div>

            {/* Split: left source rail + right preview */}
            <div className="grid gap-3 pt-3 lg:grid-cols-[220px_1fr]">
              {/* Source rail */}
              <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
                {SOURCES.map((s) => {
                  const isActive = s.key === activeSource;
                  const a = ACCENT_CLASSES[s.accent];
                  return (
                    <button
                      key={s.key}
                      onClick={() => setActiveSource(s.key)}
                      className={`group relative shrink-0 overflow-hidden rounded-xl border p-3 text-left transition-all lg:shrink lg:p-4 ${
                        isActive
                          ? `border-transparent bg-secondary/80 ring-2 ${a.ring}`
                          : "border-border bg-background/40 hover:bg-secondary/50"
                      }`}
                    >
                      <span className={`absolute inset-y-0 left-0 w-1 ${a.dot} ${isActive ? "opacity-100" : "opacity-30"}`} />
                      <div className="flex items-center justify-between pl-2">
                        <span className={`font-display text-sm font-bold ${isActive ? a.text : "text-foreground"}`}>
                          {s.label}
                        </span>
                        <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${a.soft} ${a.text}`}>
                          live
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-3 pl-2 font-mono text-[10px] text-muted-foreground">
                        <span>
                          <b className="text-foreground tabular-nums">{s.rows}</b> rows
                        </span>
                        <span>
                          <b className="text-foreground tabular-nums">{s.cols}</b> cols
                        </span>
                      </div>
                    </button>
                  );
                })}
                <div className="hidden rounded-xl border border-dashed border-border p-4 lg:block">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Combined
                  </div>
                  <div className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
                    {totalRows.toLocaleString()}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">sample rows across 3 sources</div>
                </div>
              </div>

              {/* Preview table */}
              <div className="overflow-hidden rounded-xl border border-border bg-background/60">
                <div className="grid grid-cols-[1.3fr_1.1fr_1fr_1.2fr_0.9fr] gap-4 border-b border-border bg-secondary/60 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <div>Lead</div>
                  <div>Title</div>
                  <div>Company</div>
                  <div>Email</div>
                  <div className="text-right">Signal</div>
                </div>
                {active.preview.map((r, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[1.3fr_1.1fr_1fr_1.2fr_0.9fr] items-center gap-4 px-5 py-4 text-sm ${
                      i !== active.preview.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-foreground">{r.name || "—"}</div>
                      <div className={`truncate text-xs font-medium ${accent.text}`}>{active.label}</div>
                    </div>
                    <div className="truncate text-muted-foreground">{r.title || "—"}</div>
                    <div className="truncate text-muted-foreground">{r.company || "—"}</div>
                    <div className="truncate font-mono text-xs text-muted-foreground">{r.email || "—"}</div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${accent.soft} ${accent.text}`}
                      >
                        <span className={`size-1.5 rounded-full ${accent.dot}`} />
                        {r.tag}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>Showing 4 of {active.rows.toLocaleString()} rows · {active.cols} columns</span>
                  <Link
                    to="/sample-data"
                    className={`group inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold transition-opacity hover:opacity-70 ${accent.text}`}
                  >
                    Open full sample
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* legend */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {SOURCES.map((s) => {
              const a = ACCENT_CLASSES[s.accent];
              return (
                <span key={s.key} className="inline-flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full ${a.dot}`} />
                  {s.label} · {s.rows} rows
                </span>
              );
            })}
          </div>
        </div>
      </section>




      {/* Logo strip */}
      <section className="border-y border-border py-12">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Trusted by growth teams at
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-40">
            {logos.map((l) => (
              <span key={l} className="font-display text-xl font-bold tracking-tight text-foreground">
                {l}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Engineered for data accuracy
            </h2>
            <p className="mt-4 text-muted-foreground">
              We don't just scrape — we enrich, verify, and format data to fit your CRM schema perfectly.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-secondary/30 p-8 transition-all hover:-translate-y-0.5 hover:border-violet/30 hover:bg-card"
              >
                <div className="mb-6 inline-grid size-12 place-items-center rounded-xl bg-violet-soft text-violet">
                  <f.icon className="size-6" />
                </div>
                <h3 className="font-display text-xl font-bold">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="border-t border-border bg-card px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold lg:text-4xl">Prebuilt lead lists</h2>
              <p className="mt-2 text-muted-foreground">Instant CSV download, verified contacts, ready to import.</p>
            </div>
            <Link to="/store" className="inline-flex items-center gap-1 font-semibold text-violet hover:underline">
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
      <section className="relative overflow-hidden bg-ink px-6 py-24">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-violet/15 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-coral/10 blur-[100px]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center gap-1 text-violet">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-5 fill-current" />
            ))}
          </div>
          <blockquote className="font-display text-3xl font-medium leading-snug text-white md:text-4xl">
            "LyraData cut our prospecting time in half. We no longer spend hours cleaning Apollo exports — we just receive the verified file and start selling."
          </blockquote>
          <div className="mt-10 flex items-center justify-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-violet font-bold text-white">
              MT
            </div>
            <div className="text-left">
              <p className="font-bold text-white">Marcus Thorne</p>
              <p className="text-sm text-white/60">VP Sales, VelocityGrowth</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials wall (existing component with logos) */}
      <Testimonials />

      {/* Order builder — get instant price */}
      <OrderBuilder />



      {/* Pricing peek */}
      <section className="px-6 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight">
              Transparent, volume-based pricing
            </h2>
            <p className="mt-4 text-muted-foreground">Only pay for successfully verified leads delivered.</p>
          </div>

          <div className="mx-auto mt-16 max-w-lg rounded-3xl border border-border bg-card p-10 shadow-xl">
            <div className="mb-8">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">Popular</span>
              <div className="mt-2 flex items-baseline">
                <span className="font-display text-5xl font-bold tracking-tight text-foreground">$499</span>
                <span className="ml-2 text-muted-foreground">/month</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Perfect for growing SDR teams.</p>
            </div>
            <ul className="mb-10 space-y-4">
              {[
                "5,000 verified leads / month",
                "Apollo, ZoomInfo & LinkedIn exports",
                "24h delivery guarantee",
                "CRM auto-mapping",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="size-5 shrink-0 text-emerald" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/pricing"
              className="inline-flex w-full items-center justify-center rounded-xl bg-ink py-4 font-bold text-white transition-colors hover:bg-violet"
            >
              See all plans
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-card px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center font-display text-3xl font-bold">Frequently asked</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-xl border border-border bg-background p-5 open:shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between font-semibold">
                  {f.q}
                  <span className="ml-4 text-xl text-violet transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[3rem] bg-violet p-12 text-center md:p-24">
          <div className="pointer-events-none absolute inset-0 -z-10" />
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
            <Sparkles className="size-3" />
            Ready when you are
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
            Ready to scale your pipeline?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
            Join high-growth teams getting verified B2B leads delivered daily.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/store"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-violet shadow-xl transition-transform hover:-translate-y-0.5"
            >
              Get Started Now <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
