import { useEffect } from "react";

/**
 * Standard Tawk.to live chat embed.
 *
 * Loads the official Tawk.to widget script client-side and lets Tawk.to render
 * its own default launcher icon (no custom overlay or CSS hiding).
 */

const TAWK_SRC = "https://embed.tawk.to/6a566ab7eb002a1d4cd41d0d/1jtgp1nlj";

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

export function TawkChat() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.querySelector<HTMLScriptElement>(`script[src="${TAWK_SRC}"]`)) {
      return;
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const s = document.createElement("script");
    s.async = true;
    s.src = TAWK_SRC;
    s.charset = "UTF-8";
    s.setAttribute("crossorigin", "*");
    const first = document.getElementsByTagName("script")[0];
    first?.parentNode?.insertBefore(s, first);
  }, []);

  return null;
}
