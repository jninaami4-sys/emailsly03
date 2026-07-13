import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { ProductCard } from "@/components/site/ProductCard";
import { PRODUCTS } from "@/lib/products";
import rawApollo from "@/lib/apollo-leads-raw.json";
import rawLinkedin from "@/lib/linkedin-leads-raw.json";
import rawZoominfo from "@/lib/zoominfo-leads-raw.json";
import { openOrderDrawer } from "@/components/site/OrderDrawer";

import {
  PremiumArrowRight,
  PremiumArrowUpRight,
  PremiumShieldCheck,
  PremiumZap,
  PremiumStar,
  PremiumSparkles,
  PremiumLayers,
  PremiumTimer,
  PremiumTarget,
  PremiumGlobe,
} from "@/components/site/PremiumIcons";
import { Testimonials } from "@/components/site/Testimonials";

type RawData = {
  headers: string[];
  rows: Record<string, string | number | boolean>[];
};
const apolloData = rawApollo as RawData;
const linkedinData = rawLinkedin as RawData;
const zoominfoData = rawZoominfo as RawData;
const totalRows = apolloData.rows.length + linkedinData.rows.length + zoominfoData.rows.length;

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
  { k: "500+", v: "clients served" },
  { k: "100M+", v: "leads delivered" },
  { k: "24h", v: "avg. delivery" },
];

const faqs = [
  { q: "How fast will I receive my data?", a: "Most orders are delivered within 24 hours. Larger or custom research orders may take 48–72 hours. You'll get an email update at every step." },
  { q: "What format will the data be in?", a: "All data is delivered as a clean, ready-to-import CSV file with verified work emails, job titles, company info, and LinkedIn URLs (where available)." },
  { q: "How accurate is the data?", a: "Data is sourced from pre-built, verified databases and cleaned/formatted for your ICP before delivery." },
  { q: "Do you offer custom ICP / niche research?", a: "Yes — our Manual Lead Research service is 100% human-verified and perfect for complex ICPs that automated tools miss." },
  { q: "What payment methods do you accept?", a: "We accept secure payments via card, bank transfer, and crypto. Payment links are sent after order confirmation." },
  { q: "Can I track my order status?", a: "Absolutely. Use our Track Order page with your order ID or email, or create a free account to see all your orders in one dashboard." },
];

function Home() {
  const featured = PRODUCTS.filter((p) => p.featured).concat(PRODUCTS.filter((p) => !p.featured)).slice(0, 3);

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
                  Premium B2B intelligence · verified leads, real growth
                </span>
              </div>

              <h1 className="font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-foreground md:text-7xl lg:text-[88px]">
                Prospect data that
                <br />
                <span className="bg-gradient-to-r from-indigo via-violet to-coral bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(124,58,237,0.25)]">
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
                  <PremiumArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
                <Link
                  to="/store"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-8 py-4 text-base font-semibold text-foreground backdrop-blur transition-colors hover:bg-white/[0.08] sm:w-auto"
                >
                  Prebuilt lead store
                  <PremiumArrowRight className="size-4" />
                </Link>
              </div>

              {/* Stat strip */}
              <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur sm:grid-cols-3">
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

        {/* WHY LYRADATA */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-indigo">Why LyraData</p>
                <h2 className="mt-2 font-display text-3xl font-bold lg:text-5xl">Built for operators who ship.</h2>
              </div>
              <Link
                to="/sample-data"
                className="inline-flex items-center gap-1.5 font-semibold text-indigo hover:underline"
              >
                Preview live sample data <PremiumArrowRight className="size-4" />
              </Link>
            </div>

            {/* Sample data teaser card */}
            <Link
              to="/sample-data"
              className="group relative mb-6 flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0c1b]/80 to-indigo/10 p-8 transition-all hover:-translate-y-0.5 hover:border-indigo/40 md:flex-row md:items-center md:gap-8"
            >
              <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-indigo/15 blur-[100px]" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald/60 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald" />
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/60">
                    {totalRows.toLocaleString()} live rows · 3 sources
                  </span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold leading-tight md:text-3xl">
                  Explore real Apollo, LinkedIn & ZoomInfo samples
                </h3>
                <p className="mt-2 max-w-xl text-sm text-foreground/60">
                  Search verified rows, download CSVs, and see the exact format we deliver — before you order.
                </p>
              </div>
              <div className="relative mt-6 flex items-center gap-4 md:mt-0">
                <div className="flex -space-x-2">
                  <span className="grid size-9 place-items-center rounded-full border border-white/10 bg-blue-500/20 font-mono text-[10px] font-bold text-blue-300">AP</span>
                  <span className="grid size-9 place-items-center rounded-full border border-white/10 bg-indigo-500/20 font-mono text-[10px] font-bold text-indigo-300">LI</span>
                  <span className="grid size-9 place-items-center rounded-full border border-white/10 bg-orange-500/20 font-mono text-[10px] font-bold text-orange-300">ZI</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(79,70,229,0.8)] transition-transform group-hover:translate-x-0.5">
                  Open sample <PremiumArrowUpRight className="size-4" />
                </span>
              </div>
            </Link>

            {/* Feature grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="grid size-10 place-items-center rounded-xl bg-emerald/15 text-emerald">
                  <PremiumShieldCheck className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">Pre-built verified database</h3>
                <p className="mt-1 text-sm text-foreground/60">Sourced from verified databases and formatted for your exact ICP — no stale exports.</p>
              </article>

              <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="grid size-10 place-items-center rounded-xl bg-indigo/15 text-indigo">
                  <PremiumTimer className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">24h turnaround</h3>
                <p className="mt-1 text-sm text-foreground/60">Requirements in, cleaned dataset out — under a business day.</p>
              </article>

              <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="grid size-10 place-items-center rounded-xl bg-coral/15 text-coral">
                  <PremiumLayers className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">CRM-native format</h3>
                <p className="mt-1 text-sm text-foreground/60">Mapped for HubSpot, Salesforce, Pipedrive. Single-click import.</p>
              </article>

              <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="grid size-10 place-items-center rounded-xl bg-indigo/15 text-indigo">
                  <PremiumTarget className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">Precise ICP targeting</h3>
                <p className="mt-1 text-sm text-foreground/60">Filter by title, seniority, tech-stack, funding, geo.</p>
              </article>

              <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="grid size-10 place-items-center rounded-xl bg-emerald/15 text-emerald">
                  <PremiumGlobe className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">Global coverage</h3>
                <p className="mt-1 text-sm text-foreground/60">250M+ contacts across 180+ countries, GDPR &amp; CCPA compliant.</p>
              </article>

              <button
                onClick={openOrderDrawer}
                className="group relative overflow-hidden rounded-3xl border border-indigo/40 bg-gradient-to-br from-indigo to-[oklch(0.42_0.22_275)] p-6 text-left text-white transition-transform hover:-translate-y-0.5"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/15 blur-2xl" />
                <div className="relative">
                  <PremiumSparkles className="size-6" />
                  <h3 className="mt-4 font-display text-lg font-bold">Get your price in 30 seconds</h3>
                  <p className="mt-1 text-sm text-white/80">Slide out the builder, pick a service, see the exact cost.</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest">
                    Open builder <PremiumArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </button>
            </div>
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
                Browse full store <PremiumArrowRight className="size-4" />
              </Link>
            </div>
            {featured.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
                <p className="font-display text-2xl font-bold">Fresh lists dropping soon.</p>
                <p className="mx-auto mt-2 max-w-md text-foreground/60">
                  Our prebuilt catalog is being restocked. Browse the full store or build a custom list tailored to your ICP.
                </p>
                <Link
                  to="/store"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo px-5 py-2.5 font-semibold text-white hover:bg-indigo/90"
                >
                  Go to prebuilt lists <PremiumArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Testimonial band */}
        <section className="relative overflow-hidden border-y border-white/10 px-6 py-24">
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-indigo/20 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-coral/10 blur-[100px]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center gap-1 text-indigo">
              {Array.from({ length: 5 }).map((_, i) => (
                <PremiumStar key={i} className="size-5" />
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
                Build your order <PremiumArrowUpRight className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 open:bg-white/[0.06]">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-foreground">
                    {f.q}
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo/20 text-indigo transition-transform group-open:rotate-45">
                      <PremiumZap className="size-3.5" />
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
                <PremiumZap className="size-3 text-indigo" /> Delivered in under 24 hours
              </div>
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
                Stop scraping. <br className="hidden md:block" />Start closing.
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/70">
                Tell us your ICP, pick your volume, and wake up to a verified, ready-to-send lead list — no calls, no contracts, no cleanup.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <button
                  onClick={openOrderDrawer}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-indigo shadow-xl transition-transform hover:-translate-y-0.5"
                >
                  Build your order <PremiumArrowUpRight className="size-4" />
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
