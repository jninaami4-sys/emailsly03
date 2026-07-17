import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type SiteTheme = "dark" | "light";
const STORAGE_KEY = "site-theme";

type Ctx = { theme: SiteTheme; setTheme: (t: SiteTheme) => void; toggle: () => void };
const ThemeContext = createContext<Ctx | null>(null);

function readInitial(): SiteTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch { /* ignore */ }
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<SiteTheme>("dark");

  // Hydrate after mount to avoid SSR mismatch
  useEffect(() => {
    setThemeState(readInitial());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("site-light", theme === "light");
    root.classList.toggle("site-dark", theme === "dark");
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const setTheme = useCallback((t: SiteTheme) => setThemeState(t), []);
  const toggle = useCallback(() => setThemeState((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "dark", setTheme: () => {}, toggle: () => {} };
  return ctx;
}
