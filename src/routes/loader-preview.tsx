import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Preloader } from "@/components/site/Preloader";
import { Loader713, Loader713Panel } from "@/components/site/Loader713";
import { StoreSkeleton } from "@/components/site/StoreSkeleton";
import { InvoiceSkeleton } from "@/components/site/InvoiceSkeleton";
import { TrackOrderSkeleton } from "@/components/site/TrackOrderSkeleton";
import { TrackResultSkeleton } from "@/components/site/TrackResultSkeleton";

export const Route = createFileRoute("/loader-preview")({
  head: () => ({
    meta: [
      { title: "Loader preview — internal" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LoaderPreviewPage,
});

/**
 * Internal preview page. Renders every preloader / loading visual in the
 * project side by side so we can decide which to keep.
 *
 * Trick: a parent with `transform` becomes the containing block for any
 * `position: fixed` descendant, so components like <Preloader /> and the
 * route-transition skeleton get clipped to a card instead of covering
 * the whole viewport.
 */
function LoaderPreviewPage() {
  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-8">
      <header className="mx-auto max-w-7xl">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-violet">
          Internal · Comparison
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Loader &amp; preloader preview
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
          Every preloader, route-transition state, orb loader, and page skeleton
          currently used on the site. Each card is a live, isolated instance —
          not a screenshot. Pick which to keep.
        </p>
      </header>

      <div className="mx-auto mt-10 grid max-w-7xl gap-8 lg:grid-cols-2">
        <PreviewCard
          n={1}
          title="Preloader"
          path="src/components/site/Preloader.tsx"
          desc="First-load intro. Currently mounted once in SiteShell. Gold strings mark, animated wave canvas, letter-in reveal."
          height={520}
        >
          <SessionStorageReset keyName="lyra_preloader_seen">
            <Preloader />
          </SessionStorageReset>
        </PreviewCard>

        <PreviewCard
          n={2}
          title="RouteTransition — PageSkeleton"
          path="src/components/site/RouteTransition.tsx"
          desc="Shown when navigation takes >120ms. Deep-midnight aurora backdrop with the orb panel inside."
          height={520}
        >
          <InlinePageSkeleton />
        </PreviewCard>

        <PreviewCard
          n={3}
          title="Loader713 — orb only"
          path="src/components/site/Loader713.tsx"
          desc="Standalone spinner. Use for small in-card loading states."
          height={280}
        >
          <div className="flex h-full items-center justify-center bg-white">
            <Loader713 />
          </div>
        </PreviewCard>

        <PreviewCard
          n={4}
          title="Loader713Panel"
          path="src/components/site/Loader713.tsx"
          desc="Glass card with orb + rotating status text. Used for payment processing and full-screen pending states."
          height={520}
        >
          <div className="h-full overflow-auto bg-neutral-100">
            <Loader713Panel />
          </div>
        </PreviewCard>

        <PreviewCard
          n={5}
          title="StoreSkeleton"
          path="src/components/site/StoreSkeleton.tsx"
          desc="Placeholder for /store while product data loads."
          height={520}
        >
          <div className="h-full overflow-auto bg-background">
            <StoreSkeleton />
          </div>
        </PreviewCard>

        <PreviewCard
          n={6}
          title="InvoiceSkeleton"
          path="src/components/site/InvoiceSkeleton.tsx"
          desc="Placeholder for /invoice/:id while the order loads."
          height={520}
        >
          <div className="h-full overflow-auto bg-background">
            <InvoiceSkeleton />
          </div>
        </PreviewCard>

        <PreviewCard
          n={7}
          title="TrackOrderSkeleton"
          path="src/components/site/TrackOrderSkeleton.tsx"
          desc="Placeholder for /track-order form."
          height={520}
        >
          <div className="h-full overflow-auto bg-background">
            <TrackOrderSkeleton />
          </div>
        </PreviewCard>

        <PreviewCard
          n={8}
          title="TrackResultSkeleton"
          path="src/components/site/TrackResultSkeleton.tsx"
          desc="Placeholder for the tracked-order result panel."
          height={520}
        >
          <div className="h-full overflow-auto bg-background p-6">
            <TrackResultSkeleton />
          </div>
        </PreviewCard>
      </div>

      <footer className="mx-auto mt-16 max-w-7xl border-t border-neutral-200 pt-6 text-xs text-neutral-500">
        Route: <code className="font-mono">/loader-preview</code> ·{" "}
        <span className="font-mono">noindex,nofollow</span> · remove this file
        when the decision is made.
      </footer>
    </div>
  );
}

function PreviewCard({
  n,
  title,
  path,
  desc,
  height,
  children,
}: {
  n: number;
  title: string;
  path: string;
  desc: string;
  height: number;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_20px_60px_-40px_rgba(0,0,0,0.25)]">
      <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-full bg-violet/10 font-mono text-[10px] font-bold text-violet">
              {n}
            </span>
            <h2 className="font-display text-base font-semibold text-ink">
              {title}
            </h2>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
            {desc}
          </p>
          <code className="mt-1 block font-mono text-[10px] text-neutral-400">
            {path}
          </code>
        </div>
      </header>
      {/* transform on the wrapper makes it the containing block for any
          position:fixed descendant, so previews stay inside the card. */}
      <div
        className="relative w-full overflow-hidden bg-neutral-100"
        style={{ height, transform: "translateZ(0)" }}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * The real <Preloader /> only shows once per session (sessionStorage guard).
 * For the preview we clear the flag before mount and re-mount on demand.
 */
function SessionStorageReset({
  keyName,
  children,
}: {
  keyName: string;
  children: ReactNode;
}) {
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    try {
      window.sessionStorage.removeItem(keyName);
    } catch {
      /* ignore */
    }
  }, [keyName, nonce]);

  return (
    <div className="relative h-full w-full">
      <div key={nonce} className="absolute inset-0">
        {children}
      </div>
      <button
        type="button"
        onClick={() => {
          try {
            window.sessionStorage.removeItem(keyName);
          } catch {
            /* ignore */
          }
          setNonce((n) => n + 1);
        }}
        className="absolute right-3 top-3 z-[110] rounded-full border border-white/20 bg-black/40 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur hover:bg-black/60"
      >
        Replay
      </button>
    </div>
  );
}

/**
 * Copy of RouteTransition's internal PageSkeleton so we can render it
 * standalone without triggering an actual route navigation.
 */
function InlinePageSkeleton() {
  return (
    <div className="theme-midnight relative h-full overflow-hidden bg-midnight">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-midnight via-midnight-surface to-midnight"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[10%] -top-[10%] size-[60vw] max-w-[720px] rounded-full bg-violet/18 blur-[160px] animate-aurora-slow" />
        <div className="absolute -right-[12%] top-[12%] size-[55vw] max-w-[640px] rounded-full bg-indigo/14 blur-[150px] animate-aurora-med" />
        <div className="absolute bottom-[-18%] left-[20%] size-[65vw] max-w-[760px] rounded-full bg-neon-blue/10 blur-[180px] animate-aurora-fast" />
      </div>
      <div className="relative h-full overflow-auto">
        <Loader713Panel
          chip="Routing"
          title="Preparing your page"
          subtitle="One breath while we line things up."
          steps={[
            "Warming the cache",
            "Fetching fresh data",
            "Rendering components",
          ]}
        />
      </div>
    </div>
  );
}
