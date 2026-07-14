import { Link } from "@tanstack/react-router";
import { SiteShell } from "./SiteShell";
import { AddOns } from "./AddOns";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Star,
  ShieldCheck,
  Zap,
  Database,
  Rocket,
  Headphones,
  Lock,
  TrendingUp,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type ServicePageProps = {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  bullets: string[];
  priceFrom: string;
  /** Kept for backward compatibility. All service pages now render in the
   *  unified violet editorial system regardless of accent. */
  accent?: "violet" | "coral" | "emerald";
  useCases: { title: string; desc: string }[];
  /** Optional overrides — sensible defaults are used when omitted. */
  benefits?: { icon: ComponentType<SVGProps<SVGSVGElement>>; title: string; desc: string }[];
  process?: { step: string; title: string; desc: string }[];
  testimonials?: { quote: string; author: string; role: string; initials: string }[];
  faqs?: { q: string; a: string }[];
  /** Whether to show the PricingCalculator section. Default true. */
  showCalculator?: boolean;
  /** Optional service id to preselect in the calculator. */
  calculatorServiceId?: string;
};

const DEFAULT_BENEFITS: NonNullable<ServicePageProps["benefits"]> = [
  {
    icon: ShieldCheck,
    title: "Verified in real-time",
    desc: "Every email is pinged before delivery so your outreach lands in the inbox.",
  },
  {
    icon: Zap,
    title: "24h turnaround",
    desc: "Submit your criteria today, receive your file tomorrow — no back-and-forth.",
  },
  {
    icon: Database,
    title: "CRM-native format",
    desc: "Import into HubSpot, Salesforce, or Pipedrive with a single click.",
  },
];

const DEFAULT_PROCESS: NonNullable<ServicePageProps["process"]> = [
  { step: "01", title: "Share criteria", desc: "Tell us your ICP, filters, and target volume in a short form." },
  { step: "02", title: "We build the list", desc: "Our team pulls, enriches, and verifies each record end to end." },
  { step: "03", title: "Delivered to your CRM", desc: "Receive a clean CSV or direct sync — ready to sequence." },
];

const DEFAULT_TESTIMONIALS: NonNullable<ServicePageProps["testimonials"]> = [
  {
    quote:
      "LyraData cut our prospecting time in half. We no longer spend hours cleaning exports — we just receive the verified file and start selling.",
    author: "Marcus Thorne",
    role: "VP Sales, VelocityGrowth",
    initials: "MT",
  },
];

const DEFAULT_FAQS: NonNullable<ServicePageProps["faqs"]> = [
  {
    q: "How fast will I receive my data?",
    a: "Most orders are delivered within 24 hours. Larger or custom research orders may take 48–72 hours.",
  },
  {
    q: "What format will the data be in?",
    a: "A clean, ready-to-import CSV with verified emails, job titles, company info, and LinkedIn URLs (where available).",
  },
  {
    q: "How accurate is the data?",
    a: "Data is sourced from pre-built, verified databases and cleaned/formatted for your ICP before delivery.",
  },
  {
    q: "Do you offer custom or niche research?",
    a: "Yes — our Manual Research service is 100% human-verified and perfect for complex ICPs automated tools miss.",
  },
];

export function ServiceLanding(p: ServicePageProps) {
  const benefits = p.benefits ?? DEFAULT_BENEFITS;
  const process = p.process ?? DEFAULT_PROCESS;
  const testimonials = p.testimonials ?? DEFAULT_TESTIMONIALS;
  const faqs = p.faqs ?? DEFAULT_FAQS;
  const showCalculator = p.showCalculator ?? true;

  return (
    <SiteShell>
      {/* Hero — editorial, matches homepage */}
      <section className="relative overflow-hidden px-6 pt-20 pb-20 lg:pt-24">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,var(--violet-soft),transparent_70%)] opacity-70" />
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft px-3 py-1">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet/60 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-violet" />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              {p.eyebrow}
            </span>
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tighter text-foreground md:text-6xl">
            {p.title} <span className="text-violet">{p.highlight}</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {p.subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              to="/contact"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet px-8 py-4 text-base font-semibold text-white shadow-lg shadow-violet/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet/30 sm:w-auto"
            >
              Get a Quote <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/store"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary sm:w-auto"
            >
              Browse Prebuilt Lists
            </Link>
          </div>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Starts from {p.priceFrom}
          </p>
        </div>

        {/* What's included — inline bullet card */}
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] bg-violet-soft/60 blur-3xl" />
          <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl md:p-10">
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                What's included
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-soft px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald">
                <CheckCircle2 className="size-3" />
                Verified
              </span>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {p.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald" />
                  <span className="text-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-border px-6 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              Why teams choose us
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Engineered for accuracy
            </h2>
            <p className="mt-4 text-muted-foreground">
              We don't just scrape — we enrich, verify, and format data to fit your workflow perfectly.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-border bg-secondary/30 p-8 transition-all hover:-translate-y-0.5 hover:border-violet/30 hover:bg-card"
              >
                <div className="mb-6 inline-grid size-12 place-items-center rounded-xl bg-violet-soft text-violet">
                  <b.icon className="size-6" />
                </div>
                <h3 className="font-display text-xl font-bold">{b.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-t border-border bg-card px-6 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              How it works
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Three steps to a verified list
            </h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {process.map((s) => (
              <div
                key={s.step}
                className="relative rounded-2xl border border-border bg-background p-8 transition-all hover:-translate-y-0.5 hover:border-violet/30"
              >
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-violet">
                  Step {s.step}
                </span>
                <h3 className="mt-3 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      {p.useCases.length > 0 && (
        <section className="border-t border-border px-6 py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                Use cases
              </span>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
                Built for the way you go to market
              </h2>
            </div>
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {p.useCases.map((u) => (
                <div
                  key={u.title}
                  className="rounded-2xl border border-border bg-secondary/30 p-8 transition-all hover:-translate-y-0.5 hover:border-violet/30 hover:bg-card"
                >
                  <h3 className="font-display text-lg font-bold">{u.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Calculator */}
      {showCalculator && (
        <section className="relative overflow-hidden border-t border-border bg-card px-6 py-32">
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[900px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,var(--violet-soft),transparent_70%)] opacity-60" />
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr] lg:items-center">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                  Instant quote
                </span>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
                  See your price in seconds.
                </h2>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
                  Drag the slider, pick a service, and get a live quote — no sales call required.
                </p>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] bg-violet-soft/60 blur-3xl" />
                <div className="rounded-2xl border border-border bg-background p-2 shadow-2xl">
                  <PricingCalculator compact defaultId={p.calculatorServiceId} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonial band — matches homepage */}
      {testimonials.length > 0 && (
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
              &ldquo;{testimonials[0].quote}&rdquo;
            </blockquote>
            <div className="mt-10 flex items-center justify-center gap-3">
              <div className="grid size-12 place-items-center rounded-full bg-violet font-bold text-white">
                {testimonials[0].initials}
              </div>
              <div className="text-left">
                <p className="font-bold text-white">{testimonials[0].author}</p>
                <p className="text-sm text-white/60">{testimonials[0].role}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="border-t border-border bg-card px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <div className="mb-12 text-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                FAQ
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Frequently asked
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-xl border border-border bg-background p-5 open:shadow-sm">
                  <summary className="flex cursor-pointer items-center justify-between font-semibold">
                    {f.q}
                    <span className="ml-4 text-xl text-violet transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA — matches homepage */}
      <section className="px-6 py-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem] bg-violet p-12 text-center md:p-24">
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
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-violet shadow-xl transition-transform hover:-translate-y-0.5"
            >
              Get a Quote <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/store"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              Browse the store
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
