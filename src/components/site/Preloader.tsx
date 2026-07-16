import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useHydrated } from "@/hooks/use-hydrated";

const NAVY = "#0F0F1A";
const VIOLET = "#7C3AED";
const EASE = [0.16, 1, 0.3, 1] as const;

export interface PreloaderProps {
  /** Force show (ignores session-seen guard). */
  force?: boolean;
  /** Auto-dismiss max duration in ms. Default 2500. */
  maxDurationMs?: number;
  /** Sequence duration in ms (before hold + exit). Default 2200. */
  sequenceMs?: number;
  /** Called after exit animation finishes. */
  onDone?: () => void;
  /** Skip the once-per-session guard. */
  everyLoad?: boolean;
}

/**
 * Premium EmailsLy preloader.
 * - Inline SVG logo, path-stroke drawn in sequence
 * - Ambient violet glow + faint grain for depth
 * - Respects prefers-reduced-motion (fade-only)
 * - Locks body scroll while active
 * - Auto-dismisses when window `load` fires OR after maxDurationMs
 */
export function Preloader({
  force = false,
  maxDurationMs = 2500,
  sequenceMs = 2200,
  onDone,
  everyLoad = false,
}: PreloaderProps) {
  const hydrated = useHydrated();
  const reduced = useReducedMotion() ?? false;
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [alreadySeen, setAlreadySeen] = useState(false);

  // Session guard
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (force || everyLoad) return;
    if (window.sessionStorage.getItem("emailsly_preloader_seen") === "true") {
      setAlreadySeen(true);
      setVisible(false);
    }
  }, [force, everyLoad]);

  // Progress + auto-dismiss
  useEffect(() => {
    if (alreadySeen || !visible) return;
    const start = performance.now();

    let raf = 0;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / maxDurationMs) * 100);
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const dismiss = () => {
      setVisible(false);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("emailsly_preloader_seen", "true");
      }
    };

    const maxT = window.setTimeout(dismiss, maxDurationMs);
    let loadT: number | undefined;
    const onLoad = () => {
      const elapsed = performance.now() - start;
      const wait = Math.max(0, Math.min(sequenceMs, maxDurationMs) - elapsed);
      loadT = window.setTimeout(dismiss, wait);
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(maxT);
      if (loadT) clearTimeout(loadT);
      window.removeEventListener("load", onLoad);
    };
  }, [alreadySeen, visible, maxDurationMs, sequenceMs]);

  // Scroll lock
  useEffect(() => {
    if (!visible || alreadySeen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible, alreadySeen]);

  if (!hydrated || alreadySeen) return null;

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="emailsly-preloader"
          role="status"
          aria-label="Loading EmailsLy"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          style={{
            background:
              "radial-gradient(1200px 800px at 50% 50%, #14101f 0%, #0a0812 55%, #05040a 100%)",
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 1.2, ease: EASE }}
        >
          {/* Ambient violet glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(600px 600px at 50% 50%, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0.05) 40%, transparent 70%)",
            }}
          />
          {/* Faint grain */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/></svg>\")",
            }}
          />

          <motion.div
            className="relative z-10 flex flex-col items-center px-6"
            initial={{ scale: 1 }}
            animate={reduced ? {} : { scale: [1, 1, 1.03] }}
            transition={{
              duration: (sequenceMs + 200) / 1000,
              times: [0, 0.9, 1],
              ease: EASE,
            }}
          >
            <EmailslyLogoMark reduced={reduced} sequenceMs={sequenceMs} />
            <EmailslyWordmark reduced={reduced} />

            {/* Progress line */}
            <div className="mt-10 h-px w-[220px] overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full origin-left"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #7C3AED 40%, #a78bfa 60%, transparent)",
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: progress / 100 }}
                transition={{ ease: "linear", duration: 0.1 }}
              />
            </div>
            <div
              className="mt-3 font-mono text-[10px] uppercase tracking-[0.4em]"
              style={{ color: "rgba(167,139,250,0.55)" }}
            >
              {String(Math.floor(progress)).padStart(3, "0")}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Inline SVG logo mark: envelope + check + arrow + sparkle           */
/* ------------------------------------------------------------------ */
function EmailslyLogoMark({
  reduced,
  sequenceMs,
}: {
  reduced: boolean;
  sequenceMs: number;
}) {
  const s = sequenceMs / 1000;
  // Timing budget within the sequence (fractions of s)
  const T = {
    envelope: 0.7 * s,
    check: 0.45 * s,
    checkDelay: 0.55 * s,
    arrow: 0.55 * s,
    arrowDelay: 0.85 * s,
    sparkle: 0.5 * s,
    sparkleDelay: 1.15 * s,
  };

  if (reduced) {
    return (
      <motion.svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        aria-hidden
      >
        <StaticMark />
      </motion.svg>
    );
  }

  return (
    <svg
      width="128"
      height="128"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
      className="drop-shadow-[0_0_40px_rgba(124,58,237,0.25)]"
    >
      <defs>
        <linearGradient id="arrow-trail" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="mark-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={VIOLET} stopOpacity="0.35" />
          <stop offset="100%" stopColor={VIOLET} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Envelope body — stroke draws in */}
      <motion.rect
        x="18"
        y="34"
        width="70"
        height="52"
        rx="8"
        stroke="#e6e2f2"
        strokeWidth="2.4"
        strokeLinejoin="round"
        fill="rgba(255,255,255,0.02)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: T.envelope, ease: EASE }}
      />
      {/* Envelope flap */}
      <motion.path
        d="M18 40 L53 66 L88 40"
        stroke="#e6e2f2"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: T.envelope * 0.9, delay: T.envelope * 0.35, ease: EASE }}
      />

      {/* Checkmark inside envelope */}
      <motion.path
        d="M38 60 L50 71 L70 51"
        stroke={VIOLET}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0, filter: "drop-shadow(0 0 0px rgba(124,58,237,0))" }}
        animate={{
          pathLength: 1,
          opacity: 1,
          filter: [
            "drop-shadow(0 0 0px rgba(124,58,237,0))",
            "drop-shadow(0 0 6px rgba(124,58,237,0.65))",
            "drop-shadow(0 0 2px rgba(124,58,237,0.3))",
          ],
        }}
        transition={{
          pathLength: { duration: T.check, delay: T.checkDelay, ease: EASE },
          opacity: { duration: 0.2, delay: T.checkDelay },
          filter: { duration: 0.6, delay: T.checkDelay + T.check * 0.7, ease: EASE },
        }}
      />

      {/* Arrow trail (faint gradient behind arrow) */}
      <motion.line
        x1="70"
        y1="60"
        x2="102"
        y2="28"
        stroke="url(#arrow-trail)"
        strokeWidth="6"
        strokeLinecap="round"
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ opacity: [0, 0.7, 0.2], pathLength: 1 }}
        transition={{
          duration: T.arrow * 1.2,
          delay: T.arrowDelay,
          ease: EASE,
          times: [0, 0.5, 1],
        }}
      />

      {/* Arrow (up-right) */}
      <motion.g
        initial={{ opacity: 0, x: -10, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 140,
          damping: 18,
          mass: 0.6,
          delay: T.arrowDelay,
        }}
      >
        <path
          d="M74 56 L104 26 M104 26 L104 44 M104 26 L86 26"
          stroke={VIOLET}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </motion.g>

      {/* Sparkle */}
      <motion.g
        style={{ transformOrigin: "104px 22px" }}
        initial={{ opacity: 0, scale: 0, rotate: -45 }}
        animate={{ opacity: [0, 1, 0.9], scale: [0, 1.2, 1], rotate: 0 }}
        transition={{ duration: T.sparkle, delay: T.sparkleDelay, ease: EASE }}
      >
        <path
          d="M104 14 L106 22 L114 24 L106 26 L104 34 L102 26 L94 24 L102 22 Z"
          fill={VIOLET}
        />
        <circle cx="104" cy="24" r="10" fill="url(#mark-glow)" />
      </motion.g>
    </svg>
  );
}

function StaticMark() {
  return (
    <>
      <rect
        x="18"
        y="34"
        width="70"
        height="52"
        rx="8"
        stroke="#e6e2f2"
        strokeWidth="2.4"
        fill="none"
      />
      <path
        d="M18 40 L53 66 L88 40"
        stroke="#e6e2f2"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M38 60 L50 71 L70 51"
        stroke={VIOLET}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M74 56 L104 26 M104 26 L104 44 M104 26 L86 26"
        stroke={VIOLET}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M104 14 L106 22 L114 24 L106 26 L104 34 L102 26 L94 24 L102 22 Z" fill={VIOLET} />
    </>
  );
}

function EmailslyWordmark({ reduced }: { reduced: boolean }) {
  const letters = ["E", "m", "a", "i", "l", "s"];
  const accent = ["L", "y"];
  const baseDelay = 1.35;

  if (reduced) {
    return (
      <motion.div
        className="mt-5 font-display text-[clamp(1.6rem,4vw,2.4rem)] font-semibold tracking-tight"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
        style={{ color: "#e6e2f2" }}
      >
        Emails<span style={{ color: VIOLET }}>Ly</span>
      </motion.div>
    );
  }

  return (
    <div
      className="mt-6 flex font-display text-[clamp(1.75rem,4.5vw,2.6rem)] font-semibold tracking-tight"
      style={{ color: "#efeaff" }}
    >
      {letters.map((l, i) => (
        <motion.span
          key={`n-${i}`}
          className="inline-block"
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: baseDelay + i * 0.05, ease: EASE }}
          style={{ color: NAVY === NAVY ? "#efeaff" : NAVY }}
        >
          {l}
        </motion.span>
      ))}
      {accent.map((l, i) => (
        <motion.span
          key={`a-${i}`}
          className="inline-block"
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.65,
            delay: baseDelay + letters.length * 0.05 + 0.1 + i * 0.06,
            ease: EASE,
          }}
          style={{ color: VIOLET, textShadow: "0 0 24px rgba(124,58,237,0.35)" }}
        >
          {l}
        </motion.span>
      ))}
    </div>
  );
}
