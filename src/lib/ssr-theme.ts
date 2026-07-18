import { getRequestUrl, getCookie } from "@tanstack/react-start/server";

/**
 * SSR-side theme resolution for shareable Open Graph tags.
 *
 * Priority (SSR):
 *   1. `?theme=light|dark` on the request URL — lets a shared link force
 *      a theme so crawlers pick up the right OG variant.
 *   2. `emailsly:theme` cookie — the persisted user override, written by
 *      the client hook so future SSR renders match the browser.
 *
 * Client-side calls return `null`; the browser hook rewrites tags in place.
 */
export type SiteTheme = "dark" | "light";
export const THEME_COOKIE = "emailsly:theme";

function parseTheme(v: string | null | undefined): SiteTheme | null {
  return v === "light" || v === "dark" ? v : null;
}

/** Returns the request's declared theme during SSR, or null. Safe on client. */
export function readSSRTheme(): SiteTheme | null {
  if (typeof window !== "undefined") return null;
  try {
    const url = getRequestUrl();
    const fromQuery = parseTheme(url?.searchParams.get("theme"));
    if (fromQuery) return fromQuery;
    const fromCookie = parseTheme(getCookie(THEME_COOKIE));
    if (fromCookie) return fromCookie;
  } catch {
    // No active request scope (build-time prerender). Fall through.
  }
  return null;
}

/** Append/replace `?theme=<theme>` on an asset URL. */
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
