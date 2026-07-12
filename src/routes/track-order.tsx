import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { OrderForm } from "@/components/site/OrderForm";
import { PricingCalculator } from "@/components/site/PricingCalculator";
import { TrackOrderSkeleton } from "@/components/site/TrackOrderSkeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { Calculator, Sparkles } from "lucide-react";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Place your order | LyraData" },
      { name: "description", content: "Start a new LyraData order — verified B2B lead data delivered within 24 hours." },
      { property: "og:title", content: "Place your order | LyraData" },
      { property: "og:description", content: "Start a new LyraData order — verified B2B lead data delivered within 24 hours." },
    ],
  }),
  pendingComponent: TrackOrderSkeleton,
  component: OrderPage,
});


function OrderPage() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <SiteShell>
        <TrackOrderSkeleton />
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <OrderForm />


      {/* Pricing calculator section */}
      <section className="relative overflow-hidden border-t border-border bg-gradient-to-b from-background to-violet-soft/30 px-6 py-24">
        <div className="pointer-events-none absolute right-0 top-20 size-96 rounded-full bg-violet/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-10 size-96 rounded-full bg-coral/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            {/* Left: pitch */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet/20 bg-white/70 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-violet backdrop-blur">
                <Calculator className="size-3" /> Instant pricing
              </div>
              <h2 className="font-display text-4xl font-bold leading-tight lg:text-5xl">
                Not sure what to order?{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 italic text-violet">Price it</span>
                  <span className="absolute -bottom-1 left-0 h-3 w-full -rotate-1 bg-coral-soft" />
                </span>{" "}
                first.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Drag the slider, pick a service, and see the exact total in real time —
                no hidden fees, no surprises at checkout.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  { k: "From $0.0035", v: "per verified Apollo lead" },
                  { k: "24h delivery", v: "on every data order" },
                  { k: "99% accuracy", v: "or we refill for free" },
                ].map((r) => (
                  <li key={r.k} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold text-black shadow-md shadow-gold/25">
                      <Sparkles className="size-4" />
                    </div>
                    <div>
                      <div className="font-display font-bold">{r.k}</div>
                      <div className="text-sm text-muted-foreground">{r.v}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/pricing"
                  className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors hover:border-violet hover:text-violet"
                >
                  See full pricing →
                </Link>
                <Link
                  to="/contact"
                  className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
                >
                  Talk to sales
                </Link>
              </div>
            </div>

            {/* Right: calculator with layered glow */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-violet/30 via-coral/20 to-transparent blur-2xl" />
              <div className="relative rounded-[1.75rem] bg-gradient-to-br from-violet to-coral p-[2px] shadow-2xl shadow-violet/20">
                <div className="rounded-[1.65rem] bg-card">
                  <PricingCalculator compact />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
