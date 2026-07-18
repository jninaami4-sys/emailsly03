import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

type SiteTheme = "light" | "dark";
const THEME_COOKIE = "emailsly:theme";

function parseTheme(v: string | null | undefined): SiteTheme | null {
  return v === "light" || v === "dark" ? v : null;
}

function readThemeFromRequest(request: Request): SiteTheme | null {
  try {
    const url = new URL(request.url);
    const q = parseTheme(url.searchParams.get("theme"));
    if (q) return q;
    const cookie = request.headers.get("cookie") ?? "";
    const m = cookie.match(/(?:^|;\s*)emailsly:theme=(light|dark)(?:;|$)/);
    if (m) return m[1] as SiteTheme;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Rewrite the SSR HTML so that `<html>`, theme-color, and og:image /
 * twitter:image reflect the incoming request's theme. TanStack calls
 * route `head()` BEFORE loaders resolve, so we can't rely on
 * `loaderData` inside head — the request-scope rewrite is authoritative.
 */
async function applySSRTheme(response: Response, request: Request): Promise<Response> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;

  const theme = readThemeFromRequest(request);
  if (!theme) return response;

  const html = await response.text();
  const themeColor = theme === "light" ? "#fdfcff" : "#0a0b14";
  const iosStyle = theme === "light" ? "default" : "black-translucent";

  let out = html;

  // Stamp <html> with the theme class + data-theme attribute for SSR.
  out = out.replace(/<html\b([^>]*)>/i, (_m, attrs: string) => {
    let a = attrs;
    // class attribute
    if (/\sclass="/i.test(a)) {
      a = a.replace(/class="([^"]*)"/i, (_mm, cls) => {
        const set = new Set(cls.split(/\s+/).filter(Boolean));
        if (theme === "light") set.add("site-light");
        else set.delete("site-light");
        return `class="${Array.from(set).join(" ")}"`;
      });
    } else if (theme === "light") {
      a += ` class="site-light"`;
    }
    // data-theme
    if (/\sdata-theme="/i.test(a)) {
      a = a.replace(/data-theme="[^"]*"/i, `data-theme="${theme}"`);
    } else {
      a += ` data-theme="${theme}"`;
    }
    return `<html${a}>`;
  });

  // theme-color meta
  out = out.replace(
    /<meta\s+name="theme-color"\s+content="[^"]*"\s*\/?>(?=\s*)/i,
    `<meta name="theme-color" content="${themeColor}"/>`,
  );
  // iOS status-bar-style
  out = out.replace(
    /<meta\s+name="apple-mobile-web-app-status-bar-style"\s+content="[^"]*"\s*\/?>(?=\s*)/i,
    `<meta name="apple-mobile-web-app-status-bar-style" content="${iosStyle}"/>`,
  );
  // color-scheme
  out = out.replace(
    /<meta\s+name="color-scheme"\s+content="[^"]*"\s*\/?>(?=\s*)/i,
    `<meta name="color-scheme" content="${theme}"/>`,
  );

  // Append ?theme=<theme> to social preview asset URLs.
  const addThemeParam = (u: string): string => {
    try {
      const parsed = new URL(u);
      parsed.searchParams.set("theme", theme);
      return parsed.toString();
    } catch {
      const sep = u.includes("?") ? "&" : "?";
      return `${u}${sep}theme=${theme}`;
    }
  };
  out = out.replace(
    /(<meta\s+property="og:image"\s+content=")([^"]+)("\s*\/?>)/gi,
    (_m, p, url, s) => `${p}${addThemeParam(url)}${s}`,
  );
  out = out.replace(
    /(<meta\s+property="og:image:secure_url"\s+content=")([^"]+)("\s*\/?>)/gi,
    (_m, p, url, s) => `${p}${addThemeParam(url)}${s}`,
  );
  out = out.replace(
    /(<meta\s+name="twitter:image"\s+content=")([^"]+)("\s*\/?>)/gi,
    (_m, p, url, s) => `${p}${addThemeParam(url)}${s}`,
  );

  // Preserve status + headers (drop content-length since body changed).
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("x-ssr-theme", theme);
  return new Response(out, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return await applySSRTheme(normalized, request);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

