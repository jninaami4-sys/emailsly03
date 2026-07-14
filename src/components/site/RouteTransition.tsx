import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Wraps route content with a smooth fade+lift transition on pathname change.
 * Also scrolls to top smoothly, shows a subtle top progress bar during navigation,
 * and moves focus to the route container after navigation so screen-reader and
 * keyboard users land on the new page content.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoading = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });
  const reducedMotion = useReducedMotion();

  const [displayed, setDisplayed] = useState(children);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const prevPath = useRef(pathname);
  const contentRef = useRef<HTMLDivElement>(null);
  const initialMount = useRef(true);

  useEffect(() => {
    if (prevPath.current === pathname) {
      setDisplayed(children);
      return;
    }

    if (reducedMotion) {
      // Respect reduced motion: swap immediately, reset scroll without animation,
      // then move focus so the new content is announced.
      setDisplayed(children);
      prevPath.current = pathname;
      window.scrollTo({ top: 0, behavior: "auto" });
      contentRef.current?.focus({ preventScroll: true });
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
  }, [pathname, children, reducedMotion]);

  useEffect(() => {
    console.log("[RouteTransition] phase effect", phase, "initialMount", initialMount.current);
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    if (phase === "in" && contentRef.current) {
      // Move focus to the route container for screen-reader/keyboard users.
      // preventScroll avoids fighting the smooth scroll to top.
      console.log("[RouteTransition] focusing route-content", contentRef.current);
      contentRef.current.focus({ preventScroll: true });
    }
  }, [phase]);

  return (
    <>
      <TopProgressBar active={isLoading || phase === "out"} />
      <div
        id="route-content"
        ref={contentRef}
        tabIndex={-1}
        aria-label="Page content"
        aria-busy={phase === "out" || isLoading}
        className={`route-transition focus:outline-none ${
          phase === "in" ? "route-transition-in" : "route-transition-out"
        }`}
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
