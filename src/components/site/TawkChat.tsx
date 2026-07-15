import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteSettings, type TawkPosition } from "@/lib/site-settings.functions";

const TAWK_SRC = "https://embed.tawk.to/6a566ab7eb002a1d4cd41d0d/1jtgp1nlj";

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

function positionCss(pos: TawkPosition): { xside: "right" | "left"; yside: "bottom" | "top" } {
  return {
    xside: pos.endsWith("l") ? "left" : "right",
    yside: pos.startsWith("t") ? "top" : "bottom",
  };
}

export function TawkChat() {
  const getFn = useServerFn(getSiteSettings);
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getFn(),
    staleTime: 60_000,
    retry: false,
  });

  const enabled = data?.tawk_enabled ?? true;
  const position = (data?.tawk_position ?? "br") as TawkPosition;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) return;
    if (document.querySelector<HTMLScriptElement>(`script[src="${TAWK_SRC}"]`)) return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const s = document.createElement("script");
    s.async = true;
    s.src = TAWK_SRC;
    s.charset = "UTF-8";
    s.setAttribute("crossorigin", "*");
    const first = document.getElementsByTagName("script")[0];
    first?.parentNode?.insertBefore(s, first);
  }, [enabled]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "tawk-visibility-style";
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    const { xside, yside } = positionCss(position);
    const oppX = xside === "right" ? "left" : "right";
    const oppY = yside === "bottom" ? "top" : "bottom";
    const hide = !enabled
      ? `iframe[title*="chat" i], iframe[src*="tawk.to"], .widget-visible { display: none !important; visibility: hidden !important; }`
      : `iframe[title*="chat" i], iframe[src*="tawk.to"] {
           ${yside}: 16px !important; ${xside}: 16px !important;
           ${oppY}: auto !important; ${oppX}: auto !important;
         }`;
    el.textContent = hide;
  }, [enabled, position]);

  return null;
}
