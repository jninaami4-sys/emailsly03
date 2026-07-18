import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { getConversionEvents } from "@/lib/conversion-events.functions";
import { primeConversionEvents } from "@/lib/tracking";
import {
  CONSENT_EVENT,
  DEFAULT_CONSENT,
  readConsent,
  type ConsentCategories,
} from "@/lib/consent";
import { pageviewId, reserveEvent } from "@/lib/dedupe";

/**
 * Injects tracking scripts (GTM, GA4, Meta Pixel, TikTok Pixel, custom head HTML)
 * on the client based on IDs stored in site_settings. Runs once per unique ID —
 * SPA navigations fire virtual pageviews below.
 */
export function TrackingScripts() {
  const fn = getSiteSettings;
  const eventsFn = (getConversionEvents);
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const { data: events } = useQuery({
    queryKey: ["conversion-events"],
    queryFn: () => eventsFn(),
    staleTime: 5 * 60_000,
    retry: false,
  });

  useEffect(() => {
    if (events) primeConversionEvents(events);
  }, [events]);

  const [consent, setConsent] = useState<ConsentCategories>(() => {
    if (typeof window === "undefined") return { ...DEFAULT_CONSENT };
    return readConsent()?.categories ?? { ...DEFAULT_CONSENT };
  });
  useEffect(() => {
    const sync = () => {
      setConsent(readConsent()?.categories ?? { ...DEFAULT_CONSENT });
    };
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const injectedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!data || typeof window === "undefined") return;
    const injected = injectedRef.current;

    // Google Tag Manager — analytics consent
    if (consent.analytics && data.gtm_id && /^GTM-[A-Z0-9]+$/i.test(data.gtm_id) && !injected.has(`gtm:${data.gtm_id}`)) {
      injected.add(`gtm:${data.gtm_id}`);
      const w = window as unknown as { dataLayer?: unknown[] };
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(data.gtm_id)}`;
      document.head.appendChild(s);
      const ns = document.createElement("noscript");
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(data.gtm_id)}`;
      iframe.height = "0";
      iframe.width = "0";
      iframe.style.display = "none";
      iframe.style.visibility = "hidden";
      ns.appendChild(iframe);
      document.body.insertBefore(ns, document.body.firstChild);
    }

    // Google Analytics 4 (direct gtag) — analytics consent
    if (consent.analytics && data.ga4_id && /^G-[A-Z0-9]+$/i.test(data.ga4_id) && !injected.has(`ga4:${data.ga4_id}`)) {
      injected.add(`ga4:${data.ga4_id}`);
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(data.ga4_id)}`;
      document.head.appendChild(s);
      const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
      w.dataLayer = w.dataLayer || [];
      w.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments);
      };
      w.gtag("js", new Date());
      // Suppress the auto page_view — our deduped fire() below owns pageviews.
      w.gtag("config", data.ga4_id, { send_page_view: false });
    }

    // Meta / Facebook Pixel — marketing consent
    if (consent.marketing && data.fb_pixel_id && /^\d{6,20}$/.test(data.fb_pixel_id) && !injected.has(`fb:${data.fb_pixel_id}`)) {
      injected.add(`fb:${data.fb_pixel_id}`);
      // Standard Meta Pixel snippet
      const w = window as unknown as { fbq?: { (...args: unknown[]): void; callMethod?: unknown; queue?: unknown[]; push?: unknown; loaded?: boolean; version?: string } };
      if (!w.fbq) {
        const n = function (...args: unknown[]) {
          const nn = n as unknown as { callMethod?: (...a: unknown[]) => void; queue: unknown[] };
          if (nn.callMethod) nn.callMethod.apply(n, args);
          else nn.queue.push(args);
        } as unknown as NonNullable<typeof w.fbq>;
        const na = n as unknown as Record<string, unknown>;
        na.push = n;
        na.loaded = true;
        na.version = "2.0";
        na.queue = [];
        w.fbq = n;
        const t = document.createElement("script");
        t.async = true;
        t.src = "https://connect.facebook.net/en_US/fbevents.js";
        document.head.appendChild(t);
      }
      w.fbq!("init", data.fb_pixel_id);
      // PageView is fired by our deduped fire() so it carries an eventID.
    }

    // TikTok Pixel — marketing consent
    if (consent.marketing && data.tiktok_pixel_id && /^[A-Z0-9]{10,40}$/i.test(data.tiktok_pixel_id) && !injected.has(`tt:${data.tiktok_pixel_id}`)) {
      injected.add(`tt:${data.tiktok_pixel_id}`);
      const w = window as unknown as { ttq?: unknown; TiktokAnalyticsObject?: string };
      if (!w.ttq) {
        // Minimal TikTok Pixel bootstrap (matches TikTok's official snippet shape)
        const src = `!function (w, d, t) {
          w.TiktokAnalyticsObject=t;
          var ttq=w[t]=w[t]||[];
          ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
          ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
          for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
          ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
          ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
            ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;
            ttq._t=ttq._t||{};ttq._t[e]=+new Date;
            ttq._o=ttq._o||{};ttq._o[e]=n||{};
            var s=document.createElement("script");s.type="text/javascript";s.async=!0;
            s.src=r+"?sdkid="+e+"&lib="+t;
            var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(s,a)
          };
          ttq.load(${JSON.stringify(data.tiktok_pixel_id)});
          // ttq.page() is fired by our deduped fire() so it carries event_id.
        }(window, document, 'ttq');`;
        const s = document.createElement("script");
        s.text = src;
        document.head.appendChild(s);
      }
    }

    // Custom head HTML (raw snippet supplied by admin) — marketing consent
    if (consent.marketing && data.custom_head_html && !injected.has(`custom:${data.updated_at}`)) {
      injected.add(`custom:${data.updated_at}`);
      const container = document.createElement("div");
      container.innerHTML = data.custom_head_html;
      // Move <script> nodes so they actually execute
      Array.from(container.childNodes).forEach((node) => {
        if (node.nodeName === "SCRIPT") {
          const orig = node as HTMLScriptElement;
          const s = document.createElement("script");
          for (const attr of Array.from(orig.attributes)) s.setAttribute(attr.name, attr.value);
          s.text = orig.textContent ?? "";
          document.head.appendChild(s);
        } else {
          document.head.appendChild(node);
        }
      });
    }
  }, [data, consent]);

  // Fire pageview on SPA navigation for GA4, Meta, TikTok.
  // Deduped via a stable per-path id shared with the injected snippets'
  // initial pageview, so React re-mounts, `pushState` doubles, and
  // same-tab refreshes never double-count.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const fire = () => {
      const path = window.location.pathname + window.location.search;
      const id = pageviewId(path);
      if (!reserveEvent(id, 4_000)) return;
      const w = window as unknown as {
        gtag?: (...args: unknown[]) => void;
        fbq?: (...args: unknown[]) => void;
        ttq?: { page?: (params?: unknown) => void };
        dataLayer?: unknown[];
      };
      w.dataLayer?.push({ event: "pageview", page_path: path, event_id: id });
      w.gtag?.("event", "page_view", { page_path: path, event_id: id });
      w.fbq?.("track", "PageView", {}, { eventID: id });
      w.ttq?.page?.({ event_id: id });
    };

    // Fire once on mount so hard refreshes count exactly one pageview.
    fire();

    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (...args) {
      const r = origPush.apply(this, args as Parameters<typeof origPush>);
      setTimeout(fire, 0);
      return r;
    };
    history.replaceState = function (...args) {
      const r = origReplace.apply(this, args as Parameters<typeof origReplace>);
      setTimeout(fire, 0);
      return r;
    };
    window.addEventListener("popstate", fire);
    return () => {
      history.pushState = origPush;
      history.replaceState = origReplace;
      window.removeEventListener("popstate", fire);
    };
  }, []);

  return null;
}
