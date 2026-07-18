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

function ensureThemeColorMeta(): HTMLMetaElement {
  let el = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!el) {
    el = document.createElement("meta");
    el.name = "theme-color";
    document.head.appendChild(el);
  }
  return el;
}

function apply(theme: SiteTheme) {
  const root = document.documentElement;
  root.classList.toggle("site-light", theme === "light");
  root.dataset.theme = theme;
  ensureThemeColorMeta().setAttribute("content", THEME_COLORS[theme]);
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
    apply(next);
    setThemeState(next);
  }, []);

  return { theme, setTheme, toggle, resetToSystem };
}

/** Inline <script> body: runs before hydration to avoid theme flash.
 *  Priority: localStorage override → prefers-color-scheme → dark fallback. */
export const themeBootScript = `
try {
  var k = 'emailsly:theme';
  var s = localStorage.getItem(k);
  var t;
  if (s === 'light' || s === 'dark') {
    t = s;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    t = 'light';
  } else {
    t = 'dark';
  }
  if (t === 'light') document.documentElement.classList.add('site-light');
  else document.documentElement.classList.remove('site-light');
  document.documentElement.dataset.theme = t;
  var c = t === 'light' ? '#fdfcff' : '#0a0b14';
  var m = document.querySelector('meta[name="theme-color"]');
  if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'theme-color'); document.head.appendChild(m); }
  m.setAttribute('content', c);
} catch (e) {}
`;
