import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Loader713Panel } from "@/components/site/Loader713";

/**
 * Route wrapper: no page-wipe animation. During in-flight navigation we
 * show a lightweight skeleton in place of the outgoing page so the switch
 * feels instant and doesn't flash. A slim top progress bar covers very
 * fast transitions.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const isLoading = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Only show the skeleton if navigation takes more than ~120ms — avoids
  // a flicker on cached/instant routes.
  const [showSkeleton, setShowSkeleton] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setShowSkeleton(true), 120);
    } else {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setShowSkeleton(false);
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isLoading]);

  // Reset scroll on committed route change.
  const prevPath = useRef(pathname);
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [pathname]);

  return (
    <>
      <TopProgressBar active={isLoading} />
      <div id="route-content" aria-busy={isLoading}>
        {showSkeleton ? <PageSkeleton /> : children}
      </div>
    </>
  );
}

function TopProgressBar({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[95] h-[3px] overflow-hidden transition-opacity duration-200 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`h-full bg-gradient-to-r from-transparent via-violet to-neon-orange ${
          active ? "route-progress-bar" : ""
        }`}
      />
      {active && (
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent route-progress-shimmer"
        />
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="relative min-h-[80vh] overflow-hidden bg-gradient-to-b from-background via-background to-violet-soft/25">
      {/* Premium aurora backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-8 size-[480px] rounded-full bg-violet/20 blur-[140px] animate-aurora-slow" />
        <div className="absolute right-[-12%] top-1/4 size-[420px] rounded-full bg-neon-orange/16 blur-[130px] animate-aurora-med" />
        <div className="absolute bottom-[-24%] left-1/3 size-[520px] rounded-full bg-emerald/12 blur-[150px] animate-aurora-fast" />
        <div className="absolute left-1/2 top-1/2 size-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo/10 blur-[120px] animate-pulse-slow" />

        {/* Subtle perspective grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 35%, transparent 72%)",
          }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          <span className="absolute left-[18%] top-[22%] size-1 rounded-full bg-violet/40 animate-float-1" />
          <span className="absolute left-[72%] top-[18%] size-1.5 rounded-full bg-neon-orange/35 animate-float-2" />
          <span className="absolute left-[62%] top-[62%] size-1 rounded-full bg-emerald/35 animate-float-3" />
          <span className="absolute left-[28%] top-[70%] size-1.5 rounded-full bg-indigo/30 animate-float-1" style={{ animationDelay: "1.2s" }} />
          <span className="absolute left-[84%] top-[44%] size-1 rounded-full bg-violet/30 animate-float-2" style={{ animationDelay: "0.6s" }} />
        </div>
      </div>

      <div className="relative">
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
