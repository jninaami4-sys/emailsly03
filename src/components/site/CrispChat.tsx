import { useEffect } from "react";

const CRISP_WEBSITE_ID = "c75a197f-4be3-469d-aa0d-dfdd679b5abe";

declare global {
  interface Window {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

export function CrispChat() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("crisp-embed")) return;
    window.$crisp = window.$crisp || [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;
    const s = document.createElement("script");
    s.id = "crisp-embed";
    s.src = "https://client.crisp.chat/l.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);
  return null;
}
