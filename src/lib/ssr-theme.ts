/**
 * SSR-side theme resolution for shareable Open Graph tags.
 *
 * Reads (in order):
 *   1. `?theme=light|dark` on the current request URL — lets a link
 *      explicitly force a theme for crawlers or link-preview refresh.
 *   2. `emailsly:theme` cookie — the persisted user override, mirrored
 *      into a cookie by the client `useTheme` hook so subsequent SSR
 *      renders match what the browser will show post-hydration.
 *
 * When called in a client context (post-hydration navigation, module
 * evaluation in the browser), returns `null` — the client-side
 * `retagThemedAssets` handles the swap in-place.
 */
export type SiteTheme = "dark" | "light";
export const THEME_COOKIE = "emailsly:theme";

function parseTheme(v: string | null | undefined): SiteTheme | null {
  return v === "light" || v === "dark" ? v : null;
}

/** Server-only. Returns the request's declared theme, or null. */
export function readSSRTheme(): SiteTheme | null {
  if (typeof window !== "undefined") return null;
  try {
    // Lazy import so this module stays safe to import from client code.
    // The require path is only resolved server-side; the isomorphic
    // guard above short-circuits before we reach here in the browser.
    const server = require("@tanstack/react-start/server") as {
      getRequestUrl?: () => URL;
      getCookie?: (name: string) => string | undefined;
    };
    const url = server.getRequestUrl?.();
    const fromQuery = parseTheme(url?.searchParams.get("theme"));
    if (fromQuery) return fromQuery;
    const fromCookie = parseTheme(server.getCookie?.(THEME_COOKIE));
    if (fromCookie) return fromCookie;
  } catch {
    // No active request context (e.g. build-time prerender without a
    // request scope). Fall through to null and let the client resolve.
  }
  return null;
}

/** Append/replace a `?theme=<theme>` query on a themed asset URL. */
export function withThemeQuery(url: string, theme: SiteTheme): string {
  try {
    const base = typeof window === "undefined" ? "https://emailsly.com" : window.location.origin;
    const u = new URL(url, base);
    u.searchParams.set("theme", theme);
    return /^https?:\/\//i.test(url) ? u.toString() : u.pathname + u.search + u.hash;
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}theme=${theme}`;
  }
}
