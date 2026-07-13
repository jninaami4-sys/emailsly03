import { getConversionEvents, type ConversionEvent, type ParamMap } from "@/lib/conversion-events.functions";
import { conversionEventId, reserveEvent } from "@/lib/dedupe";

// Populated on the client by <TrackingScripts /> (see prime()).
let cache: ConversionEvent[] = [];
let ready = false;
let pending: Promise<void> | null = null;

async function loadOnce() {
  if (ready || pending) return pending ?? Promise.resolve();
  pending = (async () => {
    try {
      cache = await getConversionEvents();
    } catch (e) {
      console.error("[tracking] failed to load conversion events", e);
      cache = [];
    } finally {
      ready = true;
      pending = null;
    }
  })();
  return pending;
}

export function primeConversionEvents(events: ConversionEvent[]) {
  cache = events;
  ready = true;
}

function merge(base: ParamMap, overrides?: ParamMap): Record<string, unknown> {
  return { ...(base || {}), ...(overrides || {}) };
}

type DebugEntry = {
  ts: number;
  key: string;
  matched: boolean;
  fired: { provider: "GA4" | "Meta" | "TikTok" | "dataLayer"; name: string; params: Record<string, unknown> }[];
  overrides?: ParamMap;
  note?: string;
};

function emitDebug(entry: DebugEntry) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("tracking:debug", { detail: entry }));
}

/**
 * Fire a conversion event across every configured pixel.
 *
 * Call sites use a stable `key` (e.g. "purchase", "lead", "add_to_cart");
 * the mapping to GA4 / Meta / TikTok event names and payload defaults lives
 * in the admin panel.
 */
export async function trackConversion(key: string, overrides?: ParamMap): Promise<void> {
  if (typeof window === "undefined") return;
  if (!ready) await loadOnce();
  const evt = cache.find((e) => e.event_key === key);
  const fired: DebugEntry["fired"] = [];
  if (!evt) {
    emitDebug({ ts: Date.now(), key, matched: false, fired, overrides, note: "No matching conversion event" });
    return;
  }

  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    ttq?: { track?: (name: string, params?: unknown) => void };
  };

  if (evt.ga4_event_name) {
    const params = merge(evt.ga4_params, overrides);
    if (w.gtag) {
      w.gtag("event", evt.ga4_event_name, params);
      fired.push({ provider: "GA4", name: evt.ga4_event_name, params });
    }
    if (w.dataLayer) {
      w.dataLayer.push({ event: evt.ga4_event_name, ...params });
      fired.push({ provider: "dataLayer", name: evt.ga4_event_name, params });
    }
  }

  if (evt.meta_event_name && w.fbq) {
    const params = merge(evt.meta_params, overrides);
    const std = new Set([
      "AddPaymentInfo","AddToCart","AddToWishlist","CompleteRegistration","Contact",
      "CustomizeProduct","Donate","FindLocation","InitiateCheckout","Lead","Purchase",
      "Schedule","Search","StartTrial","SubmitApplication","Subscribe","ViewContent",
    ]);
    w.fbq(std.has(evt.meta_event_name) ? "track" : "trackCustom", evt.meta_event_name, params);
    fired.push({ provider: "Meta", name: evt.meta_event_name, params });
  }

  if (evt.tiktok_event_name && w.ttq?.track) {
    const params = merge(evt.tiktok_params, overrides);
    w.ttq.track(evt.tiktok_event_name, params);
    fired.push({ provider: "TikTok", name: evt.tiktok_event_name, params });
  }

  emitDebug({ ts: Date.now(), key, matched: true, fired, overrides });
}

// Expose for debugging / non-React call sites.
if (typeof window !== "undefined") {
  (window as unknown as { trackConversion?: typeof trackConversion }).trackConversion = trackConversion;
}
