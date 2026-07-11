import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PricingCalculator } from "@/components/site/PricingCalculator";
import { ProductCard } from "@/components/site/ProductCard";
import { PRODUCTS } from "@/lib/products";
import { ArrowRight, Check, Zap, Shield, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

const services = [
  { key: "AP", name: "Apollo Data Export", desc: "Real-time intelligence from the world's largest B2B database.", color: "violet" as const, to: "/apollo-leads-export" as const, from: "$0.12/lead" },
  { key: "LI", name: "LinkedIn Sales Navigator", desc: "Custom filtered scrapes including trigger events and intent.", color: "coral" as const, to: "/linkedin-sales-navigator-leads" as const, from: "$0.15/lead" },
  { key: "ZI", name: "ZoomInfo Verified", desc: "Deep firmographic data and direct-dial mobile phone numbers.", color: "emerald" as const, to: "/zoominfo-leads" as const, from: "$0.25/lead" },
  { key: "MR", name: "Manual Research", desc: "Bespoke human research for niche industries and unique parameters.", color: "violet" as const, to: "/manual-lead-research" as const, from: "$1.50/lead" },
];

const chipService: Record<"violet" | "coral" | "emerald", string> = {
  violet: "group-hover:bg-violet-soft group-hover:border-violet/20",
  coral: "group-hover:bg-coral-soft group-hover:border-coral/20",
  emerald: "group-hover:bg-emerald-soft group-hover:border-emerald/20",
};

function Home() {
  const featured = PRODUCTS.slice(0, 6);

  return (
    <SiteShell>
      {/* Hero */}
      <section className="px-6 py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-soft px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald" />
              Live data feeds active
            </div>
            <h1 className="text-balance font-display text-5xl font-bold leading-[1.05] tracking-tight lg:text-6xl">
              The surgical{" "}
              <span className="relative inline-block">
                <span className="relative z-10 italic">precision</span>
                <span className="absolute -bottom-1 left-0 h-4 w-full -rotate-1 bg-violet-soft" />
              </span>{" "}
              source for B2B leads.
            </h1>
            <p className="mt-6 max-w-[48ch] text-pretty text-lg text-muted-foreground">
              Eliminate bounce rates with human-verified datasets, refreshed every 24 hours. Stop
              buying databases; start buying growth.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/store"
                className="inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-3 font-semibold text-white shadow-lg shadow-violet/20 transition-transform hover:scale-[1.02]"
              >
                Browse lead store <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                See pricing
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-10 border-t border-border pt-8">
              <Stat value="10k+" label="Leads / day" />
              <Stat value="99%" label="Accuracy" accent="emerald" />
              <Stat value="24h" label="Delivery" />
            </div>
          </div>
          <div className="animate-fade-up [animation-delay:150ms]">
            <PricingCalculator />
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-y border-border bg-card py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold lg:text-4xl">Data orchestration</h2>
              <p className="mt-2 max-w-lg text-muted-foreground">
                Four purpose-built sourcing engines. Pick the one that fits your workflow.
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <Link
                key={s.key}
                to={s.to}
                className="group flex flex-col rounded-2xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className={`mb-6 grid size-11 place-items-center rounded-xl border border-border bg-secondary transition-all ${chipService[s.color]}`}
                >
                  <span className="font-mono text-xs font-bold">{s.key}</span>
                </div>
                <h3 className="font-display font-bold">{s.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                <div className="mt-6 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-foreground">FROM {s.from}</span>
                  <span className="text-muted-foreground transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold lg:text-4xl">Prebuilt lead lists</h2>
              <p className="mt-2 text-muted-foreground">Verified and ready to deploy in one click.</p>
            </div>
            <Link
              to="/store"
              className="inline-flex items-center gap-1 font-semibold text-violet hover:underline"
            >
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

      {/* How it works */}
      <section className="border-t border-border bg-card px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-16 text-center font-display text-3xl font-bold lg:text-4xl">
            From filter to inbox in 3 steps
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { n: "01", icon: Zap, title: "Configure", desc: "Pick a source and specify your ICP: industry, title, geography, headcount." },
              { n: "02", icon: Shield, title: "We verify", desc: "Multi-pass validation. Emails re-verified at the moment you order." },
              { n: "03", icon: Clock, title: "Delivered in 24h", desc: "CSV or JSON delivered via secure download link — under 24 hours." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-background p-8">
                <div className="mb-6 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-violet">{s.n}</span>
                  <s.icon className="size-5 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold lg:text-4xl">The precision difference</h2>
            <p className="mt-2 text-muted-foreground">Stop paying subscription rent on credits you'll never use.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left">
              <thead className="bg-secondary/60">
                <tr>
                  <th className="p-5 font-display font-bold">Feature</th>
                  <th className="p-5 font-display font-bold text-muted-foreground">Mass markets</th>
                  <th className="bg-violet-soft p-5 font-display font-bold text-violet">LyraData</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ["Data age", "Up to 6 months", "Verified within 24h"],
                  ["Verification method", "Algorithmic guess", "Multi-pass validation"],
                  ["Bounce rate guarantee", "None", "Under 2% or credit back"],
                  ["Minimum cost", "$99/mo subscription", "$0 — pay per lead"],
                  ["Custom requests", "Enterprise only", "Available for all"],
                ].map(([f, a, b]) => (
                  <tr key={f} className="border-t border-border">
                    <td className="p-5 font-medium">{f}</td>
                    <td className="p-5 text-muted-foreground">{a}</td>
                    <td className="bg-violet-soft/40 p-5 font-semibold">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-card px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center font-display text-3xl font-bold">Common inquiries</h2>
          <div className="space-y-3">
            {[
              { q: "How do you verify the data accuracy?", a: "Every list goes through a multi-pass validation: SMTP checks, catch-all detection, and role-based filtering. Enterprise records get a human verification pass." },
              { q: "What format do the lists come in?", a: "CSV and JSON by default. Google Sheets, Airtable, HubSpot, and Salesforce direct-imports available on request." },
              { q: "What happens if leads bounce?", a: "If your bounce rate exceeds 2% we replace every failed lead for free and credit 10% toward your next order." },
              { q: "Can I request a custom niche?", a: "Yes — manual research starts at 100 leads. Provide your ICP and we deliver within 48 hours." },
            ].map((f) => (
              <details key={f.q} className="group rounded-xl border border-border bg-background p-5 open:shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between font-semibold">
                  {f.q}
                  <span className="ml-4 text-xl text-violet transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
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
              Browse store <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-semibold hover:bg-secondary"
            >
              <Check className="size-4" /> Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: "emerald" | "coral" | "violet" }) {
  const color =
    accent === "emerald" ? "text-emerald" : accent === "coral" ? "text-coral" : accent === "violet" ? "text-violet" : "text-foreground";
  return (
    <div>
      <div className={`font-display text-3xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
