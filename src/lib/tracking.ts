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

  // Stable id so the same logical event never fires twice — across
  // re-renders, effect re-runs, or a same-tab refresh — and downstream
  // (Meta CAPI, GA4 measurement protocol) can dedupe against the client.
  const eventId = conversionEventId(key, overrides as Record<string, unknown> | undefined);
  if (!reserveEvent(eventId)) {
    emitDebug({ ts: Date.now(), key, matched: true, fired, overrides, note: `Deduped (${eventId})` });
    return;
  }

  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    ttq?: { track?: (name: string, params?: unknown) => void };
  };

  if (evt.ga4_event_name) {
    // GA4 uses `event_id` for its own dedupe on the server side.
    const params = { ...merge(evt.ga4_params, overrides), event_id: eventId };
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
    // Meta browser+CAPI dedupe on `eventID` (third argument).
    w.fbq(std.has(evt.meta_event_name) ? "track" : "trackCustom", evt.meta_event_name, params, {
      eventID: eventId,
    });
    fired.push({ provider: "Meta", name: evt.meta_event_name, params: { ...params, eventID: eventId } });
  }

  if (evt.tiktok_event_name && w.ttq?.track) {
    // TikTok dedupes on `event_id` in the options bag.
    const params = merge(evt.tiktok_params, overrides);
    (w.ttq.track as (n: string, p?: unknown, o?: unknown) => void)(
      evt.tiktok_event_name,
      params,
      { event_id: eventId },
    );
    fired.push({ provider: "TikTok", name: evt.tiktok_event_name, params: { ...params, event_id: eventId } });
  }

  emitDebug({ ts: Date.now(), key, matched: true, fired, overrides, note: `id=${eventId}` });
}

// Expose for debugging / non-React call sites.
if (typeof window !== "undefined") {
  (window as unknown as { trackConversion?: typeof trackConversion }).trackConversion = trackConversion;
}
