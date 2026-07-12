import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { ProductCard } from "@/components/site/ProductCard";
import { PRODUCTS } from "@/lib/products";
import rawApollo from "@/lib/apollo-leads-raw.json";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Database,
  CheckCircle2,
  Star,
  Sparkles,
  Circle,
} from "lucide-react";
import { Testimonials } from "@/components/site/Testimonials";
import { OrderBuilder } from "@/components/site/OrderBuilder";

type RawApollo = {
  headers: string[];
  rows: Record<string, string | number | boolean>[];
};
const apolloData = rawApollo as RawApollo;
const previewRows = apolloData.rows.slice(0, 4);

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
              Verified data delivery
            </span>
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tighter text-foreground md:text-7xl">
            High-intent B2B leads,
            <br />
            delivered to your <span className="text-violet">CRM in 24h.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Clean, verified exports from Apollo, ZoomInfo, and LinkedIn Sales Navigator. No manual cleaning — just ready-to-close pipeline.
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

        {/* Product preview mock */}
        <div className="relative mx-auto mt-20 max-w-5xl">
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-violet-soft/60 blur-3xl" />
          <div className="overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-2xl">
            <div className="rounded-xl border border-border bg-secondary/40 p-6">
              {/* window chrome */}
              <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-muted-foreground/25" />
                  <span className="size-2.5 rounded-full bg-muted-foreground/25" />
                  <span className="size-2.5 rounded-full bg-muted-foreground/25" />
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  leads_export_q4_verified.csv
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-soft px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald">
                  <CheckCircle2 className="size-3" />
                  Ready
                </div>
              </div>

              {/* table */}
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="grid grid-cols-[1.4fr_1.2fr_0.9fr_0.9fr_0.8fr] gap-4 border-b border-border bg-secondary/60 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <div>Lead</div>
                  <div>Company</div>
                  <div>Source</div>
                  <div>Status</div>
                  <div className="text-right">Action</div>
                </div>
                {[
                  { name: "Aaron Marcus", role: "Tax Accountant", co: "Weiss & Company LLP", src: "Apollo", status: "verified" },
                  { name: "Vincent Cleary", role: "CPA", co: "MahoneySabol", src: "Apollo", status: "verified" },
                  { name: "Pat Pennecke", role: "Bookkeeper/accountant", co: "Janover LLC", src: "Apollo", status: "verified" },
                  { name: "Mary McWherter", role: "Tax Accountant", co: "APS Solutions", src: "Apollo", status: "verified" },
                ].map((r, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[1.4fr_1.2fr_0.9fr_0.9fr_0.8fr] items-center gap-4 px-5 py-4 text-sm ${i !== 3 ? "border-b border-border" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-foreground">{r.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{r.role}</div>
                    </div>
                    <div className="truncate text-muted-foreground">{r.co}</div>
                    <div className="font-mono text-xs text-muted-foreground">{r.src}</div>
                    <div>
                      {r.status === "verified" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-soft px-2 py-0.5 text-[11px] font-semibold text-emerald">
                          <span className="size-1.5 rounded-full bg-emerald" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-soft px-2 py-0.5 text-[11px] font-semibold text-violet">
                          <Circle className="size-2 animate-pulse fill-violet text-violet" />
                          Enriching…
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-violet">Sync →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Caption pointing to full sample */}
          <div className="mt-5 flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-3">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Preview shows 4 of 365 rows
            </span>
            <Link
              to="/sample-data"
              className="group inline-flex items-center gap-1.5 rounded-full bg-violet-soft px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-violet transition-colors hover:bg-violet hover:text-white"
            >
              See the full CSV (365 × 48)
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Full sample dataset banner */}
      <section className="border-y border-border bg-secondary/30 px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              Real Apollo scrape
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              See exactly what you'll receive — 365 sample leads, every column.
            </h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Not a mockup. This is a raw Apollo scrape with all 48 columns intact — emails, phones,
              LinkedIn URLs, funding, technologies, and everything else. Search it, scroll it, download the CSV.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/sample-data"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Open full sample <ArrowRight className="size-4" />
              </Link>
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                No signup · Free · CSV download
              </span>
            </div>
          </div>

          {/* Stats card */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            {[
              { label: "Rows", value: "365" },
              { label: "Columns", value: "48" },
              { label: "Source", value: "Apollo" },
              { label: "Format", value: "CSV" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-background p-4"
              >
                <div className="font-display text-3xl font-bold tracking-tight text-foreground">
                  {s.value}
                </div>
                <div className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
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
