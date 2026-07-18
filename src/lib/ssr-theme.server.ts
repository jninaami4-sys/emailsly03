// SERVER-ONLY: reads the current request scope. Never import from client
// modules — the *.server.ts suffix keeps this out of the client bundle.
import { getRequestUrl, getCookie } from "@tanstack/react-start/server";

export type SiteTheme = "dark" | "light";
export const THEME_COOKIE = "emailsly:theme";

function parseTheme(v: string | null | undefined): SiteTheme | null {
  return v === "light" || v === "dark" ? v : null;
}

/**
 * Resolve the theme for the incoming SSR request:
 *   1. `?theme=light|dark` query — an explicit override, ideal for
 *      forcing a variant when re-scraping social previews.
 *   2. `emailsly:theme` cookie — the persisted user override mirrored
 *      by the client hook so SSR matches what the browser will show.
 * Returns null when no request scope is active (build-time prerender).
 */
export function readSSRTheme(): SiteTheme | null {
  try {
    const url = getRequestUrl();
    const fromQuery = parseTheme(url?.searchParams.get("theme"));
    if (fromQuery) return fromQuery;
    const fromCookie = parseTheme(getCookie(THEME_COOKIE));
    if (fromCookie) return fromCookie;
  } catch {
    /* no active request scope */
  }
  return null;
}
