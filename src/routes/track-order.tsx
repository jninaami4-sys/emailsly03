import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Clock, ArrowRight, Mail } from "lucide-react";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Order tracking — coming soon | LyraData" },
      {
        name: "description",
        content:
          "Live order tracking is coming soon. In the meantime, your receipt is emailed and updates arrive as your dataset is prepared.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TrackOrderComingSoon,
});

function TrackOrderComingSoon() {
  return (
    <SiteShell>
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div className="pointer-events-none absolute right-0 top-20 -z-10 size-96 rounded-full bg-violet/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-10 -z-10 size-96 rounded-full bg-coral/10 blur-3xl" />

        <div className="relative mx-auto max-w-xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
            <Clock className="size-3" /> Coming soon
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Order tracking is <span className="text-violet">on the way</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
            We're polishing the live tracker. In the meantime, your receipt is
            emailed instantly and delivery updates land in your inbox within 24
            hours.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet/30 transition-transform hover:-translate-y-0.5"
            >
              Back to home <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold transition-colors hover:border-violet hover:text-violet"
            >
              <Mail className="size-4" /> Contact support
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
