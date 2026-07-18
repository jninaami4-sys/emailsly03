import { useEffect, useState, useCallback } from "react";
import { checkApiHealth, type HealthResult } from "@/lib/api-client";

const DISMISS_KEY = "api-health-banner-dismissed-at";
const DISMISS_MS = 60 * 60 * 1000; // 1h

/**
 * Small top banner that pings the PHP backend at /api/health and shows
 * status + which base URL is being used. Dismissible for an hour.
 * When healthy, renders nothing (silent success).
 */
export function ApiHealthBanner() {
  const [result, setResult] = useState<HealthResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [hidden, setHidden] = useState(true);

  const run = useCallback(async () => {
    setChecking(true);
    const r = await checkApiHealth();
    setResult(r);
    setChecking(false);
  }, []);

  useEffect(() => {
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (Date.now() - at > DISMISS_MS) setHidden(false);
    } catch { setHidden(false); }
    run();
  }, [run]);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* noop */ }
    setHidden(true);
  };

  if (hidden || !result || result.ok) return null;

  const base = result.baseUrl || `${typeof window !== "undefined" ? window.location.origin : ""} (same-origin)`;

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-[100] bg-red-600 text-white text-sm shadow-lg"
    >
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold">PHP API unreachable</span>
        <span className="opacity-90 truncate">
          {result.message} — probed <code className="bg-black/20 px-1 rounded">{result.effectiveUrl}</code>
        </span>
        <span className="opacity-75 hidden sm:inline">base: <code className="bg-black/20 px-1 rounded">{base}</code></span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={run}
            disabled={checking}
            className="px-2 py-1 rounded bg-white/15 hover:bg-white/25 disabled:opacity-50"
          >
            {checking ? "Checking…" : "Retry"}
          </button>
          <button
            onClick={dismiss}
            className="px-2 py-1 rounded bg-white/15 hover:bg-white/25"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
