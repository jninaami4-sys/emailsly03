import { useCallback, useEffect, useState } from "react";

export type SiteTheme = "dark" | "light";
const STORAGE_KEY = "emailsly:theme";

/** Read persisted theme (light default for a premium bright feel; falls back to dark). */
function readInitial(): SiteTheme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  // Respect the class the pre-hydration script already applied
  return document.documentElement.classList.contains("site-light") ? "light" : "dark";
}

function apply(theme: SiteTheme) {
  const root = document.documentElement;
  root.classList.toggle("site-light", theme === "light");
  root.dataset.theme = theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<SiteTheme>("dark");

  // Hydrate from storage / current DOM class once mounted
  useEffect(() => {
    setThemeState(readInitial());
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

  return { theme, setTheme, toggle };
}

/** Inline <script> body: applied before hydration to avoid theme flash. */
export const themeBootScript = `
try {
  var k = 'emailsly:theme';
  var s = localStorage.getItem(k);
  var t = (s === 'light' || s === 'dark') ? s : 'light';
  if (t === 'light') document.documentElement.classList.add('site-light');
  document.documentElement.dataset.theme = t;
} catch (e) {}
`;
