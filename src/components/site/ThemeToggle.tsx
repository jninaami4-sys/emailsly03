import { useTheme } from "@/hooks/use-theme";
import { haptic } from "@/lib/haptics";

/**
 * Header-fit dark/light toggle. Uiverse.io / Creatlydev-inspired pill
 * (originally 60×155). Scaled to a horizontal 44×22 to sit inside the
 * 48px header without breaking the pill shape.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      onClick={() => { haptic("select"); toggle(); }}
      className={`theme-toggle ${isLight ? "is-on" : ""} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
    >
      <span className="theme-toggle__circle" aria-hidden="true" />
      <span className="sr-only">{isLight ? "Light mode on" : "Dark mode on"}</span>
    </button>
  );
}
