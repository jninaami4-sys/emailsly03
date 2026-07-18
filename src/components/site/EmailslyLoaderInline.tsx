import { motion, useReducedMotion } from "framer-motion";

const VIOLET = "#418df1";
const EASE = [0.16, 1, 0.3, 1] as const;

export interface EmailslyLoaderInlineProps {
  /** Compact = smaller mark for in-card use. Default false (full centered panel). */
  compact?: boolean;
  /** Optional caption below the mark. */
  label?: string;
  /** Fills parent height and centers. Default true. */
  fill?: boolean;
  /** Override className on the wrapper. */
  className?: string;
}

/**
 * Inline / non-fixed variant of the EmailsLy preloader visual.
 * Same brand mark and wordmark as <Preloader />, but rendered in the
 * normal flow — safe to use as a route pending state or in-card loader.
 */
export function EmailslyLoaderInline({
  compact = false,
  label,
  fill = true,
  className = "",
}: EmailslyLoaderInlineProps) {
  const reduced = useReducedMotion() ?? false;
  const size = compact ? 72 : 112;

  return (
    <div
      role="status"
      aria-label="Loading"
      className={[
        "relative flex flex-col items-center justify-center gap-5 px-6",
        fill ? "min-h-[50vh] w-full" : "",
        className,
      ].join(" ")}
    >
      {/* Soft violet halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: size * 4,
          height: size * 4,
          background:
            "radial-gradient(circle at center, rgba(124,58,237,0.12) 0%, transparent 65%)",
          filter: "blur(30px)",
        }}
      />

      <Mark size={size} reduced={reduced} />

      {!compact && (
        <div
          className="font-display text-[clamp(1.25rem,2.4vw,1.6rem)] font-semibold tracking-tight text-foreground"
          aria-hidden
        >
          Emails<span style={{ color: VIOLET }}>Ly</span>
        </div>
      )}

      {/* Progress shimmer */}
      <div className="relative h-px w-[180px] overflow-hidden rounded-full bg-foreground/[0.08]">
        <motion.div
          className="absolute inset-y-0 w-1/3"
          style={{
            background:
              "linear-gradient(90deg, transparent, #418df1 40%, #7fb0f5 60%, transparent)",
          }}
          initial={{ x: "-100%" }}
          animate={reduced ? { x: "0%" } : { x: ["-100%", "300%"] }}
          transition={{
            duration: 1.6,
            ease: "linear",
            repeat: Infinity,
          }}
        />
      </div>

      {label && (
        <div
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground"
          aria-live="polite"
        >
          {label}
        </div>
      )}
    </div>
  );
}

function Mark({ size, reduced }: { size: number; reduced: boolean }) {
  if (reduced) {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden>
        <StaticMark />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
      className="drop-shadow-[0_0_28px_rgba(124,58,237,0.28)]"
    >
      <motion.rect
        x="18"
        y="34"
        width="70"
        height="52"
        rx="8"
        stroke="currentColor"
        className="text-foreground/85"
        strokeWidth="2.4"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: EASE, repeat: Infinity, repeatDelay: 1.2 }}
      />
      <motion.path
        d="M18 40 L53 66 L88 40"
        stroke="currentColor"
        className="text-foreground/85"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          duration: 1,
          delay: 0.35,
          ease: EASE,
          repeat: Infinity,
          repeatDelay: 1.3,
        }}
      />
      <motion.path
        d="M38 60 L50 71 L70 51"
        stroke={VIOLET}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          duration: 0.75,
          delay: 0.9,
          ease: EASE,
          repeat: Infinity,
          repeatDelay: 1.55,
        }}
      />
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
        stroke="currentColor"
        className="text-foreground/85"
        strokeWidth="2.4"
        fill="none"
      />
      <path
        d="M18 40 L53 66 L88 40"
        stroke="currentColor"
        className="text-foreground/85"
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
    </>
  );
}
