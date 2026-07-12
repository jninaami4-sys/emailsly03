import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PricingCalculator } from "@/components/site/PricingCalculator";
import { ProductCard } from "@/components/site/ProductCard";
import { PRODUCTS } from "@/lib/products";
import { ArrowRight, Zap, Phone, Linkedin, ShieldCheck, Lock, Clock, BadgeCheck, ServerCog, Check } from "lucide-react";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LyraData — Verified B2B leads from Apollo, ZoomInfo & LinkedIn" },
      { name: "description", content: "Precision-targeted, 99% accurate B2B leads delivered in 24 hours. Pay per lead, no subscription." },
      { property: "og:title", content: "LyraData — Verified B2B Data Platform" },
      { property: "og:description", content: "99% accurate leads from Apollo, ZoomInfo, and LinkedIn — delivered to your CRM." },
    ],
  }),
  component: Home,
});

const flagship = [
  {
    key: "apollo",
    icon: Zap,
    name: "Apollo Export",
    price: "$20 / 5k leads",
    desc: "Standard bulk export directly from your Apollo search filters. $35 for 10K+.",
    color: "violet" as const,
    to: "/apollo-leads-export" as const,
    badges: ["Work & Personal Emails", "Fast CSV Delivery", "Real-Time Data", "Current Job Titles"],
  },
  {
    key: "zoominfo",
    icon: Phone,
    name: "ZoomInfo Data",
    price: "$20 / 1k leads",
    desc: "Premium direct dials and HQ numbers for cold calling.",
    color: "emerald" as const,
    to: "/zoominfo-leads" as const,
    badges: ["Real-Time Data", "Current Job Titles"],
  },
  {
    key: "linkedin",
    icon: Linkedin,
    name: "LinkedIn B2B",
    price: "$50 / 5k leads",
    desc: "Real-time fresh scraping from Sales Navigator searches.",
    color: "coral" as const,
    to: "/linkedin-sales-navigator-leads" as const,
    badges: ["Real-Time Data", "Current Job Titles"],
    disclaimer: "On average, ~70% of LinkedIn scraping data contains emails. It may be slightly lower or higher.",
  },
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

const trust = [
  { icon: BadgeCheck, label: "99% Data Accuracy" },
  { icon: ShieldCheck, label: "GDPR Compliant" },
  { icon: Lock, label: "256-bit Encrypted" },
  { icon: Clock, label: "24h Delivery" },
  { icon: Check, label: "Verified Contacts" },
  { icon: ServerCog, label: "Secure Infrastructure" },
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
    a: "We guarantee 99% data accuracy. Emails are validated in real-time before delivery. If any leads bounce, we replace them free of charge.",
  },
  {
    q: "Do you offer custom ICP / niche research?",
    a: "Yes — our Manual Lead Research service ($0.15/lead) is 100% human-verified and perfect for complex ICPs that automated tools miss.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept secure payments via card, bank transfer, and crypto. Payment links are sent after order confirmation. We do NOT use Wise.",
  },
  {
    q: "Can I track my order status?",
    a: "Absolutely. Use our Track Order page with your order ID or email, or create a free account to see all your orders in one dashboard.",
  },
  {
    q: "Can I install LyraData as an app on my phone?",
    a: "Yes! LyraData works as an installable app on both iPhone and Android — no App Store needed. On iPhone (Safari): tap the Share button → 'Add to Home Screen'. On Android (Chrome): tap the menu (⋮) → 'Install app' or 'Add to Home Screen'. Once installed, it opens like a native app with 1-tap access to live chat, instant order notifications, and works smoothly even on slow connections.",
  },
];

function Home() {
  const featured = PRODUCTS.filter((p) => p.featured).concat(PRODUCTS.filter((p) => !p.featured)).slice(0, 6);

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-20 lg:py-24">
        <div className="pointer-events-none absolute -left-32 -top-24 size-[28rem] rounded-full bg-violet-soft blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-32 size-[22rem] rounded-full bg-coral-soft blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 size-64 rounded-full bg-emerald-soft blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-violet-soft px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-violet">
              <span className="size-1.5 animate-pulse rounded-full bg-violet" />
              Premium B2B Data Platform
            </div>
            <h1 className="text-balance font-display text-5xl font-bold leading-[1.05] tracking-tight lg:text-6xl">
              Drive Revenue
              <br />
              With <span className="relative inline-block">
                <span className="relative z-10 italic">Verified</span>
                <span className="absolute -bottom-1 left-0 h-4 w-full -rotate-1 bg-coral-soft" />
              </span>
              <br />
              B2B Data
            </h1>
            <p className="mt-6 max-w-[48ch] text-pretty text-lg text-muted-foreground">
              Precision-targeted, 99% accurate leads from Apollo, ZoomInfo, and LinkedIn — delivered to your CRM.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/track-order"
                className="inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-3 font-semibold text-white shadow-lg shadow-violet/25 transition-transform hover:scale-[1.02]"
              >
                Start Your Order <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Explore Solutions
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-8">
              {trust.map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-muted-foreground">
                  <t.icon className="size-3.5 text-emerald" />
                  {t.label}
                </span>
              ))}
            </div>
          </div>
          <div className="animate-fade-up [animation-delay:150ms]">
            <PricingCalculator />
          </div>
        </div>
      </section>

      {/* Flagship Services */}
      <section className="border-y border-border bg-card py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold lg:text-4xl">Our flagship data services</h2>
              <p className="mt-2 max-w-lg text-muted-foreground">
                Three purpose-built sourcing engines. Add-ons and website services live on the pricing page.
              </p>
            </div>
            <Link to="/pricing" className="inline-flex items-center gap-1 font-semibold text-violet hover:underline">
              See all services <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {flagship.map((s) => (
              <Link
                key={s.key}
                to={s.to}
                className={`group flex flex-col rounded-2xl border bg-gradient-to-br ${cardTint[s.color]} p-6 transition-all hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className={`mb-5 grid size-11 place-items-center rounded-xl ${chipTint[s.color]}`}>
                  <s.icon className="size-5" />
                </div>
                <h3 className="font-display text-lg font-bold">{s.name}</h3>
                <div className="mt-1 font-mono text-sm font-bold text-foreground">{s.price}</div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {s.badges.map((b) => (
                    <li key={b} className="rounded-full bg-background px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                      {b}
                    </li>
                  ))}
                </ul>
                {s.disclaimer && (
                  <p className="mt-3 font-mono text-[10px] italic text-muted-foreground">{s.disclaimer}</p>
                )}
                <div className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                  Learn more <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>

          {/* Apollo notice */}
          <div className="mt-8 rounded-xl border border-violet/20 bg-violet-soft/40 p-4 text-sm text-foreground">
            <span className="font-bold">Apollo Pricing & Delivery Notice — </span>
            Apollo bulk export pricing: $20 for up to 5K leads, $35 for 10K+ leads. Delivery typically within 24 hours.
            For orders above 50K leads, <Link to="/contact" className="font-semibold text-violet underline">contact us</Link> for custom pricing.
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="px-6 py-24">
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
          <p className="mt-8 rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">Data Retention Policy — </span>
            We retain your order data and delivered files for 30 days after completion, then permanently delete them from our servers.
            This protects your privacy and ensures GDPR compliance.{" "}
            <Link to="/contact" className="font-semibold text-violet underline">
              Want longer access to your order history?
            </Link>
          </p>
        </div>
      </section>

      {/* Trust CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-gradient-to-br from-violet-soft via-background to-coral-soft p-12 text-center">
          <h2 className="font-display text-3xl font-bold lg:text-4xl">Ready to fill your pipeline?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Get your first batch delivered in under 24 hours. No subscription, no minimum.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/store"
              className="inline-flex items-center gap-2 rounded-xl bg-violet px-6 py-3 font-semibold text-white shadow-lg shadow-violet/25"
            >
              Start Your Order <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-semibold hover:bg-secondary"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
