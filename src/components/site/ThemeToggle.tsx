import { useTheme } from "@/hooks/use-theme";
import { haptic } from "@/lib/haptics";

/**
 * Dark/light toggle — Uiverse.io by Creatlydev, used exactly as provided
 * (60×155 vertical pill). Styles are scoped via the `uiverse-theme-toggle`
 * wrapper so they don't leak globally.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <div className={`uiverse-theme-toggle ${className}`}>
      <style>{`
        .uiverse-theme-toggle #check { position: absolute; opacity: 0; pointer-events: none; }
        .uiverse-theme-toggle .toggle {
          width: 60px;
          height: 155px;
          background-color: hsl(0, 0%, 80%);
          border-radius: 1.7rem;
          padding: .25rem 0;
          cursor: pointer;
          display: flex;
          justify-content: center;
          transition: background-color 300ms 300ms;
        }
        .uiverse-theme-toggle .toggle__circle {
          width: 50px;
          height: 50px;
          background-color: hsl(0, 0%, 95%);
          border-radius: 50%;
          margin-top: calc(155px - (.25rem * 2) - 50px);
          transition: margin 500ms ease-in-out;
        }
        .uiverse-theme-toggle #check:checked + .toggle > .toggle__circle { margin-top: 0; }
        .uiverse-theme-toggle #check:checked + .toggle { background-color: #41a63c; }
        .uiverse-theme-toggle #check:focus-visible + .toggle {
          outline: 2px solid #7C3AED;
          outline-offset: 2px;
        }
      `}</style>
      <input
        id="check"
        type="checkbox"
        checked={isLight}
        onChange={() => { haptic("select"); toggle(); }}
        aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      />
      <label
        htmlFor="check"
        className="toggle"
        role="switch"
        aria-checked={isLight}
        title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      >
        <span className="toggle__circle" aria-hidden="true" />
      </label>
    </div>
  );
}
