import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

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
      className={`pointer-events-none fixed inset-x-0 top-0 z-[95] h-[2px] overflow-hidden transition-opacity duration-150 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`h-full bg-gradient-to-r from-transparent via-indigo to-neon-orange ${
          active ? "route-progress-bar" : ""
        }`}
      />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden px-4 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/10 blur-3xl animate-aurora-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(oklch(0.6_0.12_280/0.05)_1px,transparent_1px)] [background-size:22px_22px] opacity-60" />
      </div>
      <div className="relative flex flex-col items-center text-center">
        <div className="rounded-2xl border border-violet/15 bg-card/70 px-5 py-4 shadow-[0_20px_60px_-25px_oklch(0.52_0.24_293/0.35)] backdrop-blur">
          <Loader713 label="LOADING" />
        </div>
        <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Preparing your page
        </p>
      </div>
    </div>
  );
}
