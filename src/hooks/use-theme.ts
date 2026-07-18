import { useCallback, useEffect, useState } from "react";

export type SiteTheme = "dark" | "light";
const STORAGE_KEY = "emailsly:theme";

/** Read persisted theme; if unset, follow whatever the pre-hydration script
 *  applied (which itself honors prefers-color-scheme). */
function readInitial(): SiteTheme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return document.documentElement.classList.contains("site-light") ? "light" : "dark";
}

/** Brand colors used by mobile browser chrome (address bar, task switcher). */
const THEME_COLORS: Record<SiteTheme, string> = {
  light: "#fdfcff",
  dark: "#0a0b14",
};

function ensureMeta(name: string): HTMLMetaElement {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  return el;
}

/** iOS Safari only recognizes: default | black | black-translucent. */
const IOS_STATUS_STYLE: Record<SiteTheme, string> = {
  light: "default",
  dark: "black-translucent",
};

function apply(theme: SiteTheme) {
  const root = document.documentElement;
  root.classList.toggle("site-light", theme === "light");
  root.dataset.theme = theme;
  const color = THEME_COLORS[theme];
  ensureMeta("theme-color").setAttribute("content", color);
  ensureMeta("apple-mobile-web-app-status-bar-style").setAttribute("content", IOS_STATUS_STYLE[theme]);
  ensureMeta("apple-mobile-web-app-capable").setAttribute("content", "yes");
  ensureMeta("mobile-web-app-capable").setAttribute("content", "yes");
  ensureMeta("msapplication-navbutton-color").setAttribute("content", color);
  ensureMeta("color-scheme").setAttribute("content", theme === "light" ? "light" : "dark");
  retagThemedAssets(theme);
}

/** Append/replace a `?theme=<theme>` query on themed asset URLs so the
 *  browser re-requests favicons and share-preview images when the user
 *  toggles. If theme-variant files are later added (e.g. /favicon-light.png)
 *  the server can key off the query and return the matching asset. */
function withThemeParam(url: string, theme: SiteTheme): string {
  try {
    const u = new URL(url, window.location.origin);
    u.searchParams.set("theme", theme);
    // Preserve original form: absolute stays absolute, relative stays relative.
    return /^https?:\/\//i.test(url) ? u.toString() : u.pathname + u.search + u.hash;
  } catch {
    return url;
  }
}

function retagThemedAssets(theme: SiteTheme) {
  document
    .querySelectorAll<HTMLLinkElement>(
      'link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="mask-icon"]',
    )
    .forEach((link) => {
      const base = link.dataset.baseHref ?? link.getAttribute("href");
      if (!base) return;
      link.dataset.baseHref = base;
      link.setAttribute("href", withThemeParam(base, theme));
    });

  document
    .querySelectorAll<HTMLMetaElement>(
      'meta[property="og:image"], meta[name="twitter:image"], meta[property="og:image:secure_url"]',
    )
    .forEach((meta) => {
      const base = meta.dataset.baseContent ?? meta.getAttribute("content");
      if (!base) return;
      meta.dataset.baseContent = base;
      meta.setAttribute("content", withThemeParam(base, theme));
    });
}

export function useTheme() {
  const [theme, setThemeState] = useState<SiteTheme>("dark");

  useEffect(() => {
    setThemeState(readInitial());
  }, []);

  // Follow OS changes only while the user hasn't explicitly overridden.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (e: MediaQueryListEvent) => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") return; // override wins
      const next: SiteTheme = e.matches ? "light" : "dark";
      apply(next);
      setThemeState(next);
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const setTheme = useCallback((next: SiteTheme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota / privacy mode */
    }
    // Mirror to a cookie so subsequent SSR renders (shared links, hard
    // reloads) can bake the correct theme into HTML, meta tags, and
    // Open Graph asset URLs before hydration.
    try {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `${STORAGE_KEY}=${next}; Max-Age=${oneYear}; Path=/; SameSite=Lax${secure}`;
    } catch {
      /* ignore */
    }
    apply(next);
  }, []);


  const toggle = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  /** Drop the persisted override so the site follows the OS again. */
  const resetToSystem = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
    const next: SiteTheme = prefersLight ? "light" : "dark";
    // Also drop the cookie so SSR falls back to the OS scheme.
    try {
      document.cookie = `${STORAGE_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
    } catch {
      /* ignore */
    }
    apply(next);
    setThemeState(next);
  }, []);

  return { theme, setTheme, toggle, resetToSystem };
}

/** Inline <script> body: runs before hydration to avoid theme flash.
 *  Priority: URL ?theme override → localStorage override → cookie → prefers-color-scheme. */
export const themeBootScript = `
try {
  var k = 'emailsly:theme';
  var q = null;
  try {
    var sp = new URLSearchParams(window.location.search);
    var qv = sp.get('theme');
    if (qv === 'light' || qv === 'dark') q = qv;
  } catch (_) {}
  var ls = localStorage.getItem(k);
  var ck = (document.cookie.match(/(?:^|; )emailsly:theme=(light|dark)/) || [])[1] || null;
  var t;
  if (q) t = q;
  else if (ls === 'light' || ls === 'dark') t = ls;
  else if (ck) t = ck;
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) t = 'light';
  else t = 'dark';
  if (t === 'light') document.documentElement.classList.add('site-light');
  else document.documentElement.classList.remove('site-light');
  document.documentElement.dataset.theme = t;

  var c = t === 'light' ? '#fdfcff' : '#0a0b14';
  var ios = t === 'light' ? 'default' : 'black-translucent';
  function m(n, v){
    var el = document.querySelector('meta[name="'+n+'"]');
    if (!el) { el = document.createElement('meta'); el.setAttribute('name', n); document.head.appendChild(el); }
    el.setAttribute('content', v);
  }
  m('theme-color', c);
  m('apple-mobile-web-app-status-bar-style', ios);
  m('apple-mobile-web-app-capable', 'yes');
  m('mobile-web-app-capable', 'yes');
  m('msapplication-navbutton-color', c);
  m('color-scheme', t);
} catch (e) {}
`;
