import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * Tawk.to integration with a custom, brand-matched launcher.
 *
 * - Injects the Tawk.to embed script once (client-only).
 * - Hides Tawk's default bubble so our creative orb is the only visible launcher.
 * - Clicking the orb opens the Tawk widget; when Tawk closes, we show our orb again.
 */

const TAWK_SRC = "https://embed.tawk.to/6a566ab7eb002a1d4cd41d0d/1jtgp1nlj";

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

export function TawkChat() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const [hovered, setHovered] = useState(false);

  // Inject a global CSS block that fully hides Tawk.to's default launcher /
  // branding bubble (their "tawk.to" logo pill) regardless of what
  // hideWidget() does. The maximized chat panel itself is opted back in.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const STYLE_ID = "tawk-brand-hide";
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* Kill every Tawk.to iframe/container by default (launcher, brand pill, greetings) */
      iframe[src*="tawk.to"],
      iframe[title*="tawk" i],
      iframe[id*="tawk" i],
      div[id*="tawk" i],
      div[class*="tawk" i],
      #tawkchat-container,
      #tawkchat-minified-wrapper,
      #tawkchat-minified-iframe-element,
      .tawk-min-container,
      .tawk-branding,
      [class*="tawk-branding"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      /* Re-enable ONLY the maximized chat window when the user opens it */
      html.tawk-open iframe[title*="chat" i],
      html.tawk-open iframe[id*="tawkchat-iframe" i],
      html.tawk-open #tawkchat-container.tawk-max-container,
      html.tawk-open div[class*="tawk-max"] {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      /* On mobile keep the chat panel compact so it doesn't cover the whole screen */
      @media (max-width: 640px) {
        html.tawk-open iframe[title*="chat" i],
        html.tawk-open iframe[id*="tawkchat-iframe" i],
        html.tawk-open #tawkchat-container.tawk-max-container,
        html.tawk-open div[class*="tawk-max"] {
          position: fixed !important;
          width: calc(100vw - 1.5rem) !important;
          max-width: calc(100vw - 1.5rem) !important;
          height: 70vh !important;
          max-height: 70vh !important;
          right: 0.75rem !important;
          bottom: 0.75rem !important;
          left: auto !important;
          top: auto !important;
          border-radius: 1rem !important;
          overflow: hidden !important;
          box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.45) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Inject the Tawk.to script once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.querySelector<HTMLScriptElement>(`script[src="${TAWK_SRC}"]`)) {
      setReady(!!window.Tawk_API);
      return;
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Hide the default launcher — we render our own
    window.Tawk_API.onLoad = function () {
      try {
        window.Tawk_API.hideWidget?.();
        setReady(true);
      } catch {
        /* noop */
      }
    };
    window.Tawk_API.onChatMaximized = function () {
      document.documentElement.classList.add("tawk-open");
    };
    window.Tawk_API.onChatMinimized = function () {
      document.documentElement.classList.remove("tawk-open");
      setVisible(true);
    };
    window.Tawk_API.onChatHidden = function () {
      document.documentElement.classList.remove("tawk-open");
      setVisible(true);
    };

    const s = document.createElement("script");
    s.async = true;
    s.src = TAWK_SRC;
    s.charset = "UTF-8";
    s.setAttribute("crossorigin", "*");
    const first = document.getElementsByTagName("script")[0];
    first?.parentNode?.insertBefore(s, first);
  }, []);

  function openChat() {
    const api = window.Tawk_API;
    if (!api) return;
    try {
      document.documentElement.classList.add("tawk-open");
      api.showWidget?.();
      api.maximize?.();
      setVisible(false);
    } catch {
      /* noop */
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="tawk-launcher"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="fixed bottom-4 right-4 z-[70] md:bottom-6 md:right-6"
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
        >
          {/* Ambient blur glow behind the orb */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-violet via-indigo to-neon-orange blur-2xl"
            animate={{ opacity: [0.45, 0.75, 0.45], scale: [1, 1.15, 1] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Expanding rings */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border border-white/40"
            style={{ animation: "tawk-ring 2.6s ease-out infinite" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border border-white/25"
            style={{ animation: "tawk-ring 2.6s ease-out 1.3s infinite" }}
          />

          <button
            type="button"
            onClick={openChat}
            disabled={!ready}
            aria-label="Open live chat"
            className="group relative grid size-10 place-items-center overflow-hidden rounded-full text-white shadow-[0_10px_40px_-8px_rgba(124,58,237,0.55)] transition-transform hover:scale-[1.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-progress sm:size-11 md:size-12 lg:size-14"
            style={{
              background:
                "conic-gradient(from 220deg at 50% 50%, #7C3AED, #4F46E5, #FF6B4A, #7C3AED)",
            }}
          >
            {/* Rotating conic sheen */}
            <span
              aria-hidden
              className="absolute inset-[2px] rounded-full bg-ink/85 backdrop-blur"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full opacity-70 mix-blend-overlay"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.7) 60deg, transparent 120deg)",
                animation: "tawk-spin 4.5s linear infinite",
              }}
            />

            {/* Icon (chat-bubble made of two orbiting sparks) */}
            <svg
              viewBox="0 0 32 32"
              className="relative z-10 size-4 sm:size-5 md:size-5 lg:size-6"
              fill="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="tawkFill" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#F3E8FF" />
                </linearGradient>
              </defs>
              <path
                d="M8 6h16a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-6l-5 4v-4H8a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4Z"
                fill="url(#tawkFill)"
              />
              <circle cx="12" cy="14.5" r="1.6" fill="#7C3AED" />
              <circle cx="16" cy="14.5" r="1.6" fill="#4F46E5" />
              <circle cx="20" cy="14.5" r="1.6" fill="#FF6B4A" />
            </svg>

            {/* Live "online" dot */}
            <span className="absolute right-1 top-1 z-20 grid size-3 place-items-center rounded-full bg-background sm:size-3.5">
              <span className="relative grid size-2 place-items-center rounded-full bg-emerald sm:size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald opacity-70" />
              </span>
            </span>

            {/* Sparkle accent */}
            <Sparkles
              className="absolute -bottom-0.5 -left-0.5 z-20 size-2.5 text-neon-orange drop-shadow sm:size-3"
              aria-hidden
            />
          </button>

          {/* Hover label pill */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, x: 8, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 8, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-none absolute right-full top-1/2 mr-3 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-ink px-3 py-1.5 text-xs font-semibold text-white shadow-xl"
              >
                <span className="grid size-1.5 place-items-center rounded-full bg-emerald">
                  <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-emerald/80" />
                </span>
                Chat with the team
              </motion.div>
            )}
          </AnimatePresence>

          {/* Local keyframes */}
          <style>{`
            @keyframes tawk-ring {
              0% { transform: scale(1); opacity: 0.65; }
              80% { transform: scale(1.9); opacity: 0; }
              100% { transform: scale(1.9); opacity: 0; }
            }
            @keyframes tawk-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
