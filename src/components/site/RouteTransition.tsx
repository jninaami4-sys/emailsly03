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
        className={`h-full bg-gradient-to-r from-transparent via-violet to-neon-blue ${
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
    <div className="theme-midnight relative min-h-screen overflow-hidden bg-midnight">
      {/* Deep base gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-midnight via-midnight-surface to-midnight"
      />

      {/* Cinematic vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 45%, oklch(0.08 0.04 275 / 0.72) 100%)",
        }}
      />

      {/* Premium aurora backdrop — deep violet / indigo / neon-blue */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[10%] -top-[10%] size-[60vw] max-w-[720px] rounded-full bg-violet/18 blur-[160px] animate-aurora-slow" />
        <div className="absolute -right-[12%] top-[12%] size-[55vw] max-w-[640px] rounded-full bg-indigo/14 blur-[150px] animate-aurora-med" />
        <div className="absolute bottom-[-18%] left-[20%] size-[65vw] max-w-[760px] rounded-full bg-neon-blue/10 blur-[180px] animate-aurora-fast" />
        <div className="absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/8 blur-[120px] animate-pulse-slow" />
      </div>

      {/* Subtle perspective grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at center, black 28%, transparent 70%)",
        }}
      />

      {/* Fine noise texture for cinematic grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute left-[14%] top-[18%] size-1 rounded-full bg-violet/45 animate-float-1" />
        <span className="absolute left-[76%] top-[14%] size-1.5 rounded-full bg-neon-blue/40 animate-float-2" />
        <span className="absolute left-[66%] top-[58%] size-1 rounded-full bg-indigo/40 animate-float-3" />
        <span className="absolute left-[24%] top-[68%] size-1.5 rounded-full bg-violet/35 animate-float-1" style={{ animationDelay: "1.4s" }} />
        <span className="absolute left-[88%] top-[42%] size-1 rounded-full bg-neon-blue/30 animate-float-2" style={{ animationDelay: "0.7s" }} />
        <span className="absolute left-[42%] top-[32%] size-0.5 rounded-full bg-white/25 animate-float-3" style={{ animationDelay: "2.1s" }} />
        <span className="absolute left-[58%] top-[78%] size-0.5 rounded-full bg-white/20 animate-float-1" style={{ animationDelay: "3.2s" }} />
      </div>

      {/* Central glow behind loader */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[45%] size-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/10 blur-[100px] animate-pulse-slow"
      />

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
