import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PricingCalculator } from "@/components/site/PricingCalculator";
import {
  Zap,
  Phone,
  Linkedin,
  Smartphone,
  MousePointerClick,
  LineChart,
  Server,
  PenTool,
  Globe2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Simple, Honest Pricing | LyraData" },
      {
        name: "description",
        content:
          "Transparent per-lead and flat-rate pricing. No hidden fees, no monthly subscriptions. Pay only for what you need.",
      },
      { property: "og:title", content: "Simple, Honest Pricing — LyraData" },
      {
        property: "og:description",
        content: "B2B leads at a fraction of the cost. Pay per lead, no subscription.",
      },
    ],
  }),
  component: Pricing,
});

type Tier = {
  id: string;
  name: string;
  price: string;
  per: string;
  min: string;
  desc: string;
  icon: typeof Zap;
  popular?: boolean;
  features: string[];
  disclaimer?: string;
};

const DATA_TIERS: Tier[] = [
  {
    id: "apollo",
    name: "Apollo Export",
    price: "$20",
    per: "/ 5k leads",
    min: "$0.0035 per lead · min 5,000",
    desc: "Standard bulk export directly from your Apollo search filters.",
    icon: Zap,
    popular: true,
    features: ["Work & Personal Emails", "Fast CSV Delivery", "Real-Time Data", "Current Job Titles"],
    disclaimer: "Price changes to $35 from 10,000 leads. Contact us for 50K+.",
  },
  {
    id: "zoominfo",
    name: "ZoomInfo Data",
    price: "$20",
    per: "/ 1k leads",
    min: "$0.02 per lead · min 1,000",
    desc: "Premium direct dials and HQ numbers for cold calling.",
    icon: Phone,
    features: ["Direct-dial mobiles", "HQ phone numbers", "Real-Time Data", "Current Job Titles"],
  },
  {
    id: "linkedin",
    name: "LinkedIn B2B",
    price: "$50",
    per: "/ 5k leads",
    min: "$0.01 per lead · min 5,000",
    desc: "Real-time fresh scraping from Sales Navigator searches.",
    icon: Linkedin,
    features: ["Sales-Nav filters", "Trigger events", "Real-Time Data", "Current Job Titles"],
    disclaimer: "~70% of records include emails.",
  },
  {
    id: "manual",
    name: "Manual Research",
    price: "$35",
    per: "/ 100 leads",
    min: "100 leads · $0.35 per lead",
    desc: "100% human-verified research for niche or complex ICPs.",
    icon: PenTool,
    features: ["Human-verified", "Custom criteria", "48h delivery", "Any data field"],
  },
];

const ADD_ONS = [
  { id: "mobile", name: "Apollo Mobiles", icon: Smartphone, price: "$0.35/record", desc: "Mobile number enrichment for existing lists." },
  { id: "pixel", name: "Facebook Pixel", icon: MousePointerClick, price: "$100 flat", desc: "Expert Pixel & CAPI setup for conversion tracking." },
  { id: "ads", name: "Google Ads Setup", icon: LineChart, price: "$100 flat", desc: "High-ROAS campaign structure with tracking." },
  { id: "tracking", name: "Server-Side Tracking", icon: Server, price: "$150 flat", desc: "Bypass ad blockers with Stape.io & GTM Server." },
  { id: "logo", name: "Logo Design", icon: PenTool, price: "$50 flat", desc: "Professional brand identity design." },
  { id: "webdesign", name: "AI Website Design", icon: Globe2, price: "starting at $200", desc: "Modern, conversion-focused websites in days.", link: "/website-design" as const },
];

function Pricing() {
  return (
    <SiteShell>
      {/* Hero — light panel on md+, dark on mobile, buttery gradient into next */}
      <section className="relative px-4 pt-14 pb-24 md:px-6 md:pt-20 md:pb-32">
        {/* Mobile ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,var(--violet-soft),transparent_70%)] opacity-70 md:hidden" />

        {/* Desktop / tablet light panel */}
        <div className="relative mx-auto max-w-6xl md:overflow-hidden md:rounded-[2.5rem] md:border md:border-white/10 md:bg-gradient-to-br md:from-white md:via-[oklch(0.985_0.005_285)] md:to-[oklch(0.96_0.03_285)] md:px-10 md:py-24 md:shadow-[0_30px_80px_-30px_rgba(79,70,229,0.35)] lg:px-16 lg:py-28">
          {/* Decorative light-mode auras (md+) */}
          <div className="pointer-events-none absolute inset-0 hidden md:block">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.25),transparent_70%)] blur-2xl" />
            <div className="absolute -right-32 -bottom-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.18),transparent_70%)] blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(1200px_400px_at_50%_-10%,rgba(255,255,255,0.9),transparent_60%)]" />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft px-3 py-1 md:border-violet/30 md:bg-white/70 md:backdrop-blur">
              <Sparkles className="size-3 text-violet" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                Transparent Pricing
              </span>
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tighter text-foreground md:text-6xl md:text-[oklch(0.18_0.02_260)] lg:text-7xl">
              Simple, honest pricing.
              <br />
              <span className="text-violet">Pay only for what you need.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl md:text-[oklch(0.38_0.02_260)]">
              B2B leads at a fraction of the cost. No hidden fees, no monthly subscriptions — just verified data delivered to your CRM.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <a
                href="#calculator"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet px-8 py-4 text-base font-semibold text-white shadow-lg shadow-violet/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet/40 sm:w-auto"
              >
                Calculate Your Price <ArrowRight className="size-4" />
              </a>
              <a
                href="#tiers"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary md:border-[oklch(0.18_0.02_260/0.15)] md:bg-white/80 md:text-[oklch(0.18_0.02_260)] md:backdrop-blur md:hover:bg-white sm:w-auto"
              >
                Compare Plans
              </a>
            </div>
          </div>
        </div>

        {/* Buttery gradient bleed into next section */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-background md:h-56" />
      </section>

      {/* Data tiers — editorial cards */}
      <section id="tiers" className="px-6 py-24 md:pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              Data Services
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Pick your source. Pay per lead.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Four core data services. All verified, all delivered as ready-to-import CSV.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {DATA_TIERS.map((t) => (
              <div
                key={t.id}
                className={`relative flex flex-col rounded-2xl border p-7 transition-all hover:-translate-y-0.5 ${
                  t.popular
                    ? "border-violet/30 bg-card shadow-xl shadow-violet/10 ring-1 ring-violet/20"
                    : "border-border bg-secondary/30 hover:border-violet/20 hover:bg-card"
                }`}
              >
                {t.popular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-violet px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-md shadow-violet/25">
                    Most popular
                  </span>
                )}
                <div className="mb-6 inline-grid size-12 place-items-center rounded-xl bg-violet-soft text-violet">
                  <t.icon className="size-6" />
                </div>
                <h3 className="font-display text-xl font-bold">{t.name}</h3>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-bold tracking-tight">{t.price}</span>
                    <span className="text-sm text-muted-foreground">{t.per}</span>
                  </div>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t.min}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t.desc}</p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                {t.disclaimer && (
                  <p className="mt-4 font-mono text-[10px] italic text-muted-foreground">{t.disclaimer}</p>
                )}
                <a
                  href="#calculator"
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-colors ${
                    t.popular
                      ? "bg-violet text-white shadow-md shadow-violet/20 hover:bg-violet/90"
                      : "bg-ink text-white hover:bg-violet"
                  }`}
                >
                  Get started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator — matches homepage editorial framing */}
      <section
        id="calculator"
        className="relative overflow-hidden border-t border-border bg-card px-6 py-32"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[900px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,var(--violet-soft),transparent_70%)] opacity-60" />
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                Instant Quote
              </span>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
                Calculate your price
                <br />
                in seconds.
              </h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
                Pick a service, drag the slider, and see the price update live. No sales calls, no fine print.
              </p>
              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "Live pricing — no waiting for a quote",
                  "Volume discounts baked in",
                  "Minimum order clearly stated upfront",
                  "Checkout the moment you're ready",
                ].map((line) => (
                  <li key={line} className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 shrink-0 text-emerald" />
                    <span className="text-foreground">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] bg-violet-soft/60 blur-3xl" />
              <div className="rounded-2xl border border-border bg-background p-2 shadow-2xl">
                <PricingCalculator compact />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add-ons grid */}
      <section className="border-t border-border px-6 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              Add-ons
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Utility services, flat-rate.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Enrichment, tracking, branding, and websites — no subscriptions.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ADD_ONS.map((a) => {
              const inner = (
                <>
                  <div className="mb-6 inline-grid size-12 place-items-center rounded-xl bg-violet-soft text-violet">
                    <a.icon className="size-6" />
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-bold">{a.name}</h3>
                    <span className="whitespace-nowrap font-mono text-[11px] font-bold text-violet">
                      {a.price}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
                </>
              );
              const cls =
                "flex flex-col rounded-2xl border border-border bg-secondary/30 p-7 transition-all hover:-translate-y-0.5 hover:border-violet/30 hover:bg-card";
              return a.link ? (
                <Link key={a.id} to={a.link} className={cls}>
                  {inner}
                </Link>
              ) : (
                <div key={a.id} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="border-t border-border bg-card px-6 py-32">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              vs. Competition
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Unbeatable per-lead pricing.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Our per-lead cost compared to going direct with the biggest data platforms.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <ComparisonCard
              competitor="Apollo.io"
              tagline="Sales Engagement Platform"
              theirRate="~$0.20"
              ourRate="$0.0035"
              ourLabel="LyraData Apollo Export"
            />
            <ComparisonCard
              competitor="LinkedIn Sales Navigator"
              tagline="Professional Network Data"
              theirRate="~$0.10"
              ourRate="$0.01"
              ourLabel="LyraData LinkedIn B2B"
            />
          </div>
          <p className="mt-8 text-center font-mono text-[11px] text-muted-foreground">
            Competitor pricing is approximate and based on publicly available information.
          </p>
        </div>
      </section>

      {/* Final CTA — matches homepage */}
      <section className="px-6 py-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem] bg-violet p-12 text-center md:p-24">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
            <Sparkles className="size-3" />
            Ready when you are
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
            Skip the guesswork.
            <br />
            Get your quote now.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
            Verified B2B leads in your CRM in 24 hours — priced by the lead, not the seat.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href="#calculator"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-violet shadow-xl transition-transform hover:-translate-y-0.5"
            >
              Calculate Now <ArrowRight className="size-4" />
            </a>
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

function ComparisonCard({
  competitor,
  tagline,
  theirRate,
  ourRate,
  ourLabel,
}: {
  competitor: string;
  tagline: string;
  theirRate: string;
  ourRate: string;
  ourLabel: string;
}) {
  const savings = Math.round(
    ((parseFloat(theirRate.replace(/[^0-9.]/g, "")) - parseFloat(ourRate.replace(/[^0-9.]/g, ""))) /
      parseFloat(theirRate.replace(/[^0-9.]/g, ""))) *
      100,
  );
  return (
    <div className="rounded-2xl border border-border bg-background p-7 transition-all hover:-translate-y-0.5 hover:border-violet/30">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="font-display text-lg font-bold">{competitor}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {tagline}
          </div>
        </div>
        <span className="rounded-full bg-emerald-soft px-2.5 py-1 font-mono text-[10px] font-bold text-emerald">
          Save {savings}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-secondary/40 p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Their rate
          </div>
          <div className="mt-2 font-display text-3xl font-bold tracking-tight line-through decoration-muted-foreground/50">
            {theirRate}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">per lead / credit</div>
        </div>
        <div className="rounded-xl border border-violet/25 bg-violet-soft/60 p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-violet">Our rate</div>
          <div className="mt-2 font-display text-3xl font-bold tracking-tight text-violet">{ourRate}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{ourLabel}</div>
        </div>
      </div>
    </div>
  );
}
