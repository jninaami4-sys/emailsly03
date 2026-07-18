import { useTheme } from "@/hooks/use-theme";

/**
 * Premium light/dark theme toggle for the site header.
 * Uses the .theme-toggle pill styles defined in src/styles.css so the
 * motion / states stay consistent everywhere it appears.
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
      onClick={toggle}
      className={`theme-toggle ${isLight ? "is-on" : ""} ${className}`.trim()}
    >
      <span className="theme-toggle__circle" aria-hidden="true">
        <svg
          viewBox="0 0 20 20"
          className="theme-toggle__icon"
          aria-hidden="true"
          focusable="false"
        >
          {isLight ? (
            // Sun
            <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="10" cy="10" r="3.2" fill="currentColor" stroke="none" />
              <path d="M10 2.5v1.6M10 15.9v1.6M2.5 10h1.6M15.9 10h1.6M4.6 4.6l1.1 1.1M14.3 14.3l1.1 1.1M4.6 15.4l1.1-1.1M14.3 5.7l1.1-1.1" />
            </g>
          ) : (
            // Moon
            <path
              d="M14.5 12.5A6 6 0 0 1 7.5 5.5c0-.6.1-1.2.2-1.7A6.5 6.5 0 1 0 16.2 12.3c-.5.1-1.1.2-1.7.2Z"
              fill="currentColor"
            />
          )}
        </svg>
      </span>
    </button>
  );
}
