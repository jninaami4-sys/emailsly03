import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PricingCalculator } from "@/components/site/PricingCalculator";
import { Zap, Phone, Linkedin, Smartphone, MousePointerClick, LineChart, Server, PenTool, Globe2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Simple, Honest Pricing | LyraData" },
      { name: "description", content: "Transparent per-lead and flat-rate pricing. No hidden fees, no monthly subscriptions. Pay only for what you need." },
      { property: "og:title", content: "Simple, Honest Pricing — LyraData" },
      { property: "og:description", content: "B2B leads at a fraction of the cost. Pay per lead, no subscription." },
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
  color: "violet" | "emerald" | "coral";
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
    color: "violet",
    popular: true,
    features: ["Work & Personal Emails", "Fast CSV Delivery", "Real-Time Data", "Current Job Titles"],
    disclaimer: "$35 for 10K+ leads. Contact us for 50K+.",
  },
  {
    id: "zoominfo",
    name: "ZoomInfo Data",
    price: "$20",
    per: "/ 1k leads",
    min: "$0.02 per lead · min 1,000",
    desc: "Premium direct dials and HQ numbers for cold calling.",
    icon: Phone,
    color: "emerald",
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
    color: "coral",
    features: ["Sales-Nav filters", "Trigger events", "Real-Time Data", "Current Job Titles"],
    disclaimer: "~70% of records include emails.",
  },
  {
    id: "manual",
    name: "Manual Research",
    price: "$0.15",
    per: "/ lead",
    min: "Min 134 leads · $20 min order",
    desc: "100% human-verified research for niche or complex ICPs.",
    icon: PenTool,
    color: "violet",
    features: ["Human-verified", "Custom criteria", "48h delivery", "Any data field"],
  },
];

const ADD_ONS = [
  { id: "mobile", name: "Apollo Mobiles", icon: Smartphone, price: "$0.10/record", desc: "Mobile number enrichment for existing lists.", color: "violet" as const },
  { id: "pixel", name: "Facebook Pixel", icon: MousePointerClick, price: "$100 flat", desc: "Expert Pixel & CAPI setup for conversion tracking.", color: "emerald" as const },
  { id: "ads", name: "Google Ads Setup", icon: LineChart, price: "$100 flat", desc: "High-ROAS campaign structure with tracking.", color: "coral" as const },
  { id: "tracking", name: "Server-Side Tracking", icon: Server, price: "$150 flat", desc: "Bypass ad blockers with Stape.io & GTM Server.", color: "violet" as const },
  { id: "logo", name: "Logo Design", icon: PenTool, price: "$50 flat", desc: "Professional brand identity design.", color: "coral" as const },
  { id: "webdesign", name: "AI Website Design", icon: Globe2, price: "starting at $200", desc: "Modern, conversion-focused websites in days.", color: "emerald" as const, link: "/website-design" as const },
];

const cardTint: Record<"violet" | "coral" | "emerald", string> = {
  violet: "from-violet-soft/60 to-transparent border-violet/20",
  coral: "from-coral-soft/60 to-transparent border-coral/20",
  emerald: "from-emerald-soft/60 to-transparent border-emerald/20",
};
const chipTint: Record<"violet" | "coral" | "emerald", string> = {
  violet: "bg-violet-soft text-violet",
  coral: "bg-coral-soft text-coral",
  emerald: "bg-emerald-soft text-emerald",
};

function Pricing() {
  return (
    <SiteShell>
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-soft px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-violet">
            Transparent Pricing
          </div>
          <h1 className="font-display text-4xl font-bold lg:text-5xl">Simple, Honest Pricing</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            B2B leads at a fraction of the cost. No hidden fees. No monthly subscriptions. Pay only for what you need.
          </p>
          <a href="#calculator" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-3 font-semibold text-white shadow-lg shadow-violet/20">
            Calculate Your Price <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* Flagship data pricing */}
      <section className="px-6 pb-16">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {DATA_TIERS.map((t) => (
            <div
              key={t.id}
              className={`relative flex flex-col rounded-2xl border bg-gradient-to-br ${cardTint[t.color]} p-6 ${
                t.popular ? "shadow-xl shadow-violet/10 ring-1 ring-violet/30" : ""
              }`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-violet px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                  Most popular
                </span>
              )}
              <div className={`mb-4 grid size-10 place-items-center rounded-xl ${chipTint[t.color]}`}>
                <t.icon className="size-5" />
              </div>
              <h3 className="font-display text-lg font-bold">{t.name}</h3>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold">{t.price}</span>
                  <span className="text-sm text-muted-foreground">{t.per}</span>
                </div>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">{t.min}</p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{t.desc}</p>
              <ul className="mt-4 flex-1 space-y-1.5 text-xs">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <span className="mt-1 size-1 shrink-0 rounded-full bg-foreground" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {t.disclaimer && (
                <p className="mt-3 font-mono text-[10px] italic text-muted-foreground">{t.disclaimer}</p>
              )}
              <a href="#calculator" className="mt-5 w-full rounded-xl bg-ink py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-violet">
                Get started
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Add-ons grid */}
      <section className="border-t border-border bg-card px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold">Add-ons & utility services</h2>
            <p className="mt-2 text-muted-foreground">Enrichment, tracking, branding, and websites — flat-rate pricing.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ADD_ONS.map((a) => {
              const inner = (
                <>
                  <div className={`mb-4 grid size-10 place-items-center rounded-xl ${chipTint[a.color]}`}>
                    <a.icon className="size-5" />
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display font-bold">{a.name}</h3>
                    <span className="whitespace-nowrap font-mono text-xs font-bold">{a.price}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{a.desc}</p>
                </>
              );
              const cls = `flex flex-col rounded-2xl border bg-gradient-to-br ${cardTint[a.color]} p-5 transition-all hover:-translate-y-1 hover:shadow-md`;
              return a.link ? (
                <Link key={a.id} to={a.link} className={cls}>{inner}</Link>
              ) : (
                <div key={a.id} className={cls}>{inner}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-display text-3xl font-bold">Calculate your price</h2>
          <PricingCalculator />
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="border-t border-border bg-card px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold">Unbeatable pricing vs. the competition</h2>
            <p className="mt-2 text-muted-foreground">
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
              accent="amber"
            />
            <ComparisonCard
              competitor="LinkedIn Sales Navigator"
              tagline="Professional Network Data"
              theirRate="~$0.10"
              ourRate="$0.01"
              ourLabel="LyraData LinkedIn B2B"
              accent="blue"
            />
          </div>
          <p className="mt-6 text-center font-mono text-[11px] text-muted-foreground">
            Competitor pricing is approximate and based on publicly available information.
          </p>
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
  accent,
}: {
  competitor: string;
  tagline: string;
  theirRate: string;
  ourRate: string;
  ourLabel: string;
  accent: "amber" | "blue";
}) {
  const theirClr =
    accent === "amber"
      ? "border-[hsl(38_92%_50%/0.25)] bg-[hsl(38_92%_50%/0.06)]"
      : "border-[hsl(215_90%_55%/0.25)] bg-[hsl(215_90%_55%/0.06)]";
  const savings = Math.round(
    ((parseFloat(theirRate.replace(/[^0-9.]/g, "")) - parseFloat(ourRate.replace(/[^0-9.]/g, ""))) /
      parseFloat(theirRate.replace(/[^0-9.]/g, ""))) *
      100,
  );
  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-display font-bold">{competitor}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{tagline}</div>
        </div>
        <span className="rounded-full bg-emerald-soft px-2.5 py-1 font-mono text-[10px] font-bold text-emerald">
          Save {savings}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl border p-4 ${theirClr}`}>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Their rate</div>
          <div className="mt-1 font-display text-2xl font-bold line-through decoration-muted-foreground/50">{theirRate}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">per lead / credit</div>
        </div>
        <div className="rounded-xl border border-violet/25 bg-violet-soft/50 p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-violet">Our rate</div>
          <div className="mt-1 font-display text-2xl font-bold text-violet">{ourRate}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{ourLabel}</div>
        </div>
      </div>
    </div>
  );
}
