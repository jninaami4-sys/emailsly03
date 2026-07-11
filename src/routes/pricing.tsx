import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PricingCalculator } from "@/components/site/PricingCalculator";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Pay per lead, no subscription | LyraData" },
      { name: "description", content: "Simple per-lead pricing for Apollo, LinkedIn, ZoomInfo, and manual research. No subscriptions, no minimums." },
      { property: "og:title", content: "Pricing — Pay per lead, no subscription" },
      { property: "og:description", content: "Simple per-lead pricing across four sourcing engines." },
    ],
  }),
  component: Pricing,
});

const TIERS = [
  { name: "Apollo Export", rate: "$0.12", min: "500 leads", features: ["Verified emails", "LinkedIn URLs", "Firmographics", "CSV / JSON export"], accent: "violet" as const },
  { name: "LinkedIn Sales Nav", rate: "$0.15", min: "500 leads", features: ["Verified emails", "Trigger events", "Sales-nav filters", "CSV / JSON export"], accent: "coral" as const, popular: true },
  { name: "ZoomInfo Verified", rate: "$0.25", min: "300 leads", features: ["Verified emails", "Direct-dial mobile", "Enterprise firmographics", "CSV / JSON export"], accent: "emerald" as const },
  { name: "Manual Research", rate: "$1.50", min: "100 leads", features: ["Human-verified", "Custom criteria", "48h delivery", "Any data field"], accent: "violet" as const },
];

const accentBg: Record<"violet" | "coral" | "emerald", string> = {
  violet: "bg-violet-soft text-violet",
  coral: "bg-coral-soft text-coral",
  emerald: "bg-emerald-soft text-emerald",
};

function Pricing() {
  return (
    <SiteShell>
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-4xl font-bold lg:text-5xl">Pay per lead. Not per month.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            No subscription. No credits to burn. Just verified B2B contacts at transparent per-lead rates.
          </p>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                t.popular ? "border-violet shadow-xl shadow-violet/10" : "border-border"
              } bg-card`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-violet px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                  Most popular
                </span>
              )}
              <span className={`inline-flex w-fit rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${accentBg[t.accent]}`}>
                {t.name}
              </span>
              <div className="mt-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold">{t.rate}</span>
                  <span className="text-sm text-muted-foreground">/ lead</span>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">Min {t.min}</p>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className="mt-6 w-full rounded-xl bg-ink py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet">
                Get started
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-display text-3xl font-bold">Estimate your batch</h2>
          <PricingCalculator />
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center font-display text-3xl font-bold">How we compare</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/60">
                <tr>
                  <th className="p-5 font-display font-bold">&nbsp;</th>
                  <th className="p-5 font-display font-bold text-muted-foreground">Apollo (direct)</th>
                  <th className="p-5 font-display font-bold text-muted-foreground">ZoomInfo (direct)</th>
                  <th className="bg-violet-soft p-5 font-display font-bold text-violet">LyraData</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Monthly minimum", "$99", "$15,000", "$0"],
                  ["Pay-per-lead", "No", "No", "Yes"],
                  ["Free replacements", "No", "Limited", "Yes"],
                  ["Verified within 24h", "No", "No", "Yes"],
                  ["Manual research", "No", "Enterprise only", "Yes"],
                ].map(([f, a, b, c]) => (
                  <tr key={f} className="border-t border-border">
                    <td className="p-5 font-medium">{f}</td>
                    <td className="p-5 text-muted-foreground"><Cell v={a} /></td>
                    <td className="p-5 text-muted-foreground"><Cell v={b} /></td>
                    <td className="bg-violet-soft/40 p-5 font-semibold"><Cell v={c} good /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function Cell({ v, good }: { v: string; good?: boolean }) {
  if (v === "Yes") return <span className="inline-flex items-center gap-1"><Check className={`size-4 ${good ? "text-emerald" : ""}`} /> Yes</span>;
  if (v === "No") return <span className="inline-flex items-center gap-1 text-muted-foreground"><X className="size-4" /> No</span>;
  return <>{v}</>;
}
