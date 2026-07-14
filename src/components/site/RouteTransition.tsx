import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Wraps route content with a smooth fade+lift transition on pathname change.
 * Also scrolls to top smoothly and shows a subtle top progress bar during navigation.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoading = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });

  const [displayed, setDisplayed] = useState(children);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current === pathname) {
      setDisplayed(children);
      return;
    }
    // Start fade-out
    setPhase("out");
    const swap = window.setTimeout(() => {
      setDisplayed(children);
      prevPath.current = pathname;
      // Smooth scroll to top for the new page
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Fade back in on next frame after paint
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase("in"));
      });
    }, 180);
    return () => window.clearTimeout(swap);
  }, [pathname, children]);

  return (
    <>
      <TopProgressBar active={isLoading || phase === "out"} />
      <div
        className={`route-transition ${phase === "in" ? "route-transition-in" : "route-transition-out"}`}
      >
        {displayed}
      </div>
    </>
  );
}

function TopProgressBar({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[95] h-[2px] overflow-hidden transition-opacity duration-200 ${
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
