import { useEffect, useState } from "react";
import { Bug } from "@/components/admin/AdminIcons";
import { DEBUG_KEY, setDebugEnabled } from "@/components/site/TrackingDebugPanel";

export function DebugModeAdmin() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    try { setOn(localStorage.getItem(DEBUG_KEY) === "1"); } catch { /* ignore */ }
    const sync = () => {
      try { setOn(localStorage.getItem(DEBUG_KEY) === "1"); } catch { /* ignore */ }
    };
    window.addEventListener("tracking:debug-toggle", sync);
    return () => window.removeEventListener("tracking:debug-toggle", sync);
  }, []);

  const toggle = () => {
    const next = !on;
    setDebugEnabled(next);
    setOn(next);
  };

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
          <Bug className="size-4" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-lg font-bold">Debug mode</h2>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Live event log · injected script status
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          role="switch"
          aria-checked={on}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            on ? "bg-emerald-500" : "bg-muted-foreground/30"
          }`}
        >
          <span
            className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
              on ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </header>
      <div className="p-4 sm:p-6">
        <p className="text-xs text-muted-foreground">
          {on ? (
            <>
              Debug overlay is <span className="font-semibold text-emerald-500">ON</span> for
              this browser. A floating panel in the bottom-right of every page shows GTM /
              GA4 / Meta / TikTok load status and every <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[11px]">trackConversion</code> call
              live. Only visible to you — nothing is stored server-side.
            </>
          ) : (
            <>
              Enable to open a floating overlay on the site that reports which pixels are
              loaded and streams every fired conversion event in real time. Useful for
              verifying pixel setup, GTM triggers, and event payloads.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
