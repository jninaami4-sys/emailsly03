import { Link } from "@tanstack/react-router";
import { SiteShell } from "./SiteShell";
import { PricingCalculator } from "./PricingCalculator";
import { Check, ArrowRight } from "lucide-react";

export type ServicePageProps = {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  bullets: string[];
  priceFrom: string;
  accent: "violet" | "coral" | "emerald";
  useCases: { title: string; desc: string }[];
};

const accentBg: Record<ServicePageProps["accent"], string> = {
  violet: "bg-violet-soft text-violet",
  coral: "bg-coral-soft text-coral",
  emerald: "bg-emerald-soft text-emerald",
};
const accentSolid: Record<ServicePageProps["accent"], string> = {
  violet: "bg-violet",
  coral: "bg-coral",
  emerald: "bg-emerald",
};

export function ServiceLanding(p: ServicePageProps) {
  return (
    <SiteShell>
      <section className="px-6 py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-start gap-16 lg:grid-cols-2">
          <div>
            <span className={`inline-flex rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${accentBg[p.accent]}`}>
              {p.eyebrow}
            </span>
            <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.05] lg:text-5xl">
              {p.title}{" "}
              <span className="relative inline-block">
                <span className="relative z-10 italic">{p.highlight}</span>
                <span className={`absolute -bottom-1 left-0 h-3 w-full -rotate-1 ${accentSolid[p.accent]} opacity-15`} />
              </span>
            </h1>
            <p className="mt-6 max-w-[52ch] text-lg text-muted-foreground">{p.subtitle}</p>
            <ul className="mt-8 space-y-3">
              {p.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-5 shrink-0 text-emerald" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-3 font-semibold text-white shadow-lg shadow-violet/20"
              >
                Get a quote <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/store"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 font-semibold hover:bg-secondary"
              >
                Browse prebuilt lists
              </Link>
            </div>
            <p className="mt-4 font-mono text-xs text-muted-foreground">Starts from {p.priceFrom}</p>
          </div>
          <div className="lg:sticky lg:top-24">
            <PricingCalculator />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-display text-3xl font-bold">Common use cases</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {p.useCases.map((u) => (
              <div key={u.title} className="rounded-2xl border border-border bg-background p-6">
                <h3 className="font-display font-bold">{u.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
