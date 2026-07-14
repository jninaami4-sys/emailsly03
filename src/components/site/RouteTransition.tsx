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
  );
}
