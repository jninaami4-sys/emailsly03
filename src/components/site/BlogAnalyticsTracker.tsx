import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { trackBlogEvent, type BlogEventType } from "@/lib/blog-analytics.functions";

const SESSION_KEY = "blog-analytics-session";

function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (crypto?.randomUUID?.() as string | undefined) ??
        `s_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Math.random().toString(36).slice(2)}`;
  }
}

export function BlogAnalyticsTracker({ slug }: { slug: string }) {
  const trackFn = useServerFn(trackBlogEvent);
  const trackRef = useRef(trackFn);
  trackRef.current = trackFn;

  useEffect(() => {
    const sessionId = getSessionId();
    const path = `/blog/${slug}`;
    const referrer = document.referrer || undefined;

    const send = (event_type: BlogEventType, meta?: Record<string, unknown>) => {
      trackRef
        .current({
          data: { slug, event_type, session_id: sessionId, path, referrer, meta },
        })
        .catch(() => {});
    };

    // View
    send("view");

    // Scroll milestones — fire once each
    const fired = new Set<BlogEventType>();
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
      const pct = Math.min(100, (window.scrollY / scrollable) * 100);
      const milestones: Array<[number, BlogEventType]> = [
        [25, "scroll_25"],
        [50, "scroll_50"],
        [75, "scroll_75"],
        [95, "scroll_100"],
      ];
      for (const [threshold, evt] of milestones) {
        if (pct >= threshold && !fired.has(evt)) {
          fired.add(evt);
          send(evt);
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // CTA clicks — any element with [data-blog-cta]
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.(
        "[data-blog-cta]",
      ) as HTMLElement | null;
      if (!target) return;
      const name = target.getAttribute("data-blog-cta") ?? "unknown";
      const href = (target as HTMLAnchorElement).href ?? undefined;
      send("cta_click", { name, href });
    };
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
    };
  }, [slug]);

  return null;
}