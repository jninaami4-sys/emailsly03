import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Adds smooth fade+lift reveal transitions to every <section> on the page
 * as it enters the viewport. Applies a small stagger delay based on order
 * for a natural feel. Re-scans on every route change.
 */
export function SectionReveal() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let observer: IntersectionObserver | null = null;

    const scan = () => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>("section, [data-reveal]"),
      ).filter((el) => !el.dataset.revealBound);

      nodes.forEach((el, i) => {
        el.dataset.revealBound = "1";
        el.classList.add("section-reveal");
        // stagger only for the first cluster; scroll-triggered ones use their own
        const order = Math.min(i, 4);
        el.style.setProperty("--reveal-delay", `${order * 80}ms`);
      });

      if (!observer) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                (entry.target as HTMLElement).classList.add("is-visible");
                observer?.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
        );
      }
      nodes.forEach((el) => observer!.observe(el));
    };

    // Wait one frame for route content to mount
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(scan);
      (scan as unknown as { _raf?: number })._raf = raf2;
    });

    // Rescan when new content is added (lazy sections, tabs, etc.)
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf1);
      mo.disconnect();
      observer?.disconnect();
      // Clean up flags so next mount can re-scan cleanly
      document
        .querySelectorAll<HTMLElement>("[data-reveal-bound]")
        .forEach((el) => {
          delete el.dataset.revealBound;
          el.classList.remove("section-reveal", "is-visible");
          el.style.removeProperty("--reveal-delay");
        });
    };
  }, [pathname]);

  return null;
}
