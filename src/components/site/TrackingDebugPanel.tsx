import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bug, X, Zap, ChevronDown, ChevronUp, Trash2, Play } from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { getConversionEvents } from "@/lib/conversion-events.functions";
import { trackConversion } from "@/lib/tracking";

export const DEBUG_KEY = "tracking-debug";

type DebugEntry = {
  ts: number;
  key: string;
  matched: boolean;
  fired: { provider: string; name: string; params: Record<string, unknown> }[];
  overrides?: Record<string, unknown>;
  note?: string;
};

function useDebugEnabled() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try { setOn(localStorage.getItem(DEBUG_KEY) === "1"); } catch { /* ignore */ }
    const onStorage = (e: StorageEvent) => {
      if (e.key === DEBUG_KEY) setOn(e.newValue === "1");
    };
    const onLocal = () => {
      try { setOn(localStorage.getItem(DEBUG_KEY) === "1"); } catch { /* ignore */ }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("tracking:debug-toggle", onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("tracking:debug-toggle", onLocal);
    };
  }, []);
  return on;
}

export function setDebugEnabled(v: boolean) {
  try {
    if (v) localStorage.setItem(DEBUG_KEY, "1");
    else localStorage.removeItem(DEBUG_KEY);
    window.dispatchEvent(new Event("tracking:debug-toggle"));
  } catch { /* ignore */ }
}

export function TrackingDebugPanel() {
  const enabled = useDebugEnabled();
  const [open, setOpen] = useState(true);
  const [log, setLog] = useState<DebugEntry[]>([]);
  const [status, setStatus] = useState({
    gtm: false, ga4: false, meta: false, tiktok: false, dataLayer: false,
  });

  const settingsFn = useServerFn(getSiteSettings);
  const eventsFn = useServerFn(getConversionEvents);
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => settingsFn(),
    enabled,
    retry: false,
  });
  const { data: events } = useQuery({
    queryKey: ["conversion-events"],
    queryFn: () => eventsFn(),
    enabled,
    retry: false,
  });

  useEffect(() => {
    if (!enabled) return;
    const onEvt = (e: Event) => {
      const detail = (e as CustomEvent<DebugEntry>).detail;
      setLog((prev) => [detail, ...prev].slice(0, 100));
    };
    window.addEventListener("tracking:debug", onEvt as EventListener);
    const check = () => {
      const w = window as unknown as {
        gtag?: unknown; fbq?: unknown; ttq?: unknown; dataLayer?: unknown[];
        google_tag_manager?: unknown;
      };
      setStatus({
        gtm: !!w.google_tag_manager,
        ga4: typeof w.gtag === "function",
        meta: typeof w.fbq === "function",
        tiktok: !!w.ttq,
        dataLayer: Array.isArray(w.dataLayer),
      });
    };
    check();
    const iv = window.setInterval(check, 1500);
    return () => {
      window.removeEventListener("tracking:debug", onEvt as EventListener);
      window.clearInterval(iv);
    };
  }, [enabled]);

  const expected = useMemo(
    () => ({
      gtm: !!settings?.gtm_id,
      ga4: !!settings?.ga4_id,
      meta: !!settings?.fb_pixel_id,
      tiktok: !!settings?.tiktok_pixel_id,
    }),
    [settings],
  );

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Bug className="size-4 text-amber-500" />
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
          Tracking debug
        </span>
        <span className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-md p-1 hover:bg-secondary"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setDebugEnabled(false)}
            className="rounded-md p-1 hover:bg-secondary"
            aria-label="Close debug"
          >
            <X className="size-3.5" />
          </button>
        </span>
      </header>

      {open && (
        <div className="max-h-[65vh] space-y-3 overflow-y-auto p-3 text-xs">
          <section>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Injected scripts
            </p>
            <ul className="grid grid-cols-2 gap-1.5">
              <StatusRow label="GTM" expected={expected.gtm} loaded={status.gtm} />
              <StatusRow label="GA4 (gtag)" expected={expected.ga4} loaded={status.ga4} />
              <StatusRow label="Meta Pixel" expected={expected.meta} loaded={status.meta} />
              <StatusRow label="TikTok Pixel" expected={expected.tiktok} loaded={status.tiktok} />
              <StatusRow label="dataLayer" expected={expected.gtm || expected.ga4} loaded={status.dataLayer} />
            </ul>
          </section>

          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Test fire ({events?.length ?? 0} events)
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(events ?? []).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => trackConversion(e.event_key, { debug: true })}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/40 px-2 py-1 font-mono text-[10px] hover:bg-secondary"
                >
                  <Play className="size-3" />
                  {e.event_key}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Event log ({log.length})
              </p>
              {log.length > 0 && (
                <button
                  type="button"
                  onClick={() => setLog([])}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-secondary"
                >
                  <Trash2 className="size-3" />
                  Clear
                </button>
              )}
            </div>
            {log.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
                Waiting for events…
              </p>
            ) : (
              <ul className="grid gap-1.5">
                {log.map((entry, i) => (
                  <li key={i} className="rounded-lg border border-border bg-card p-2">
                    <div className="flex items-center gap-2">
                      <Zap className={`size-3 ${entry.matched ? "text-emerald-500" : "text-rose-500"}`} />
                      <span className="font-mono text-[11px] font-semibold">{entry.key}</span>
                      <span className="ml-auto font-mono text-[9px] text-muted-foreground">
                        {new Date(entry.ts).toLocaleTimeString()}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="mt-1 text-[10px] text-rose-500">{entry.note}</p>
                    )}
                    {entry.fired.length > 0 && (
                      <ul className="mt-1 grid gap-0.5">
                        {entry.fired.map((f, j) => (
                          <li key={j} className="font-mono text-[10px] text-muted-foreground">
                            <span className="mr-1 rounded bg-secondary px-1 py-0.5 text-foreground">
                              {f.provider}
                            </span>
                            {f.name} → {JSON.stringify(f.params)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function StatusRow({ label, expected, loaded }: { label: string; expected: boolean; loaded: boolean }) {
  const state = !expected ? "off" : loaded ? "ok" : "pending";
  const color =
    state === "ok"
      ? "bg-emerald-500"
      : state === "pending"
      ? "bg-amber-500 animate-pulse"
      : "bg-muted-foreground/30";
  const text =
    state === "ok" ? "loaded" : state === "pending" ? "not loaded" : "off";
  return (
    <li className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
      <span className={`size-2 rounded-full ${color}`} aria-hidden />
      <span className="font-mono text-[10px] font-semibold">{label}</span>
      <span className="ml-auto font-mono text-[9px] uppercase text-muted-foreground">{text}</span>
    </li>
  );
}
