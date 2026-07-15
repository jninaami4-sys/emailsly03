import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { PremiumSparkles as Sparkles } from "@/components/site/PremiumIcons";

/**
 * Premium orb loader.
 * A pulsing gradient sphere with an orbiting ring of light —
 * matches the site's violet/indigo + neon-orange accent palette.
 */
export function Loader713({
  label = "LOADING",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative grid h-24 w-24 place-items-center ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* Outer glow rings */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-violet/10 blur-2xl animate-pulse-slow"
      />
      <span
        aria-hidden
        className="absolute inset-2 rounded-full bg-gradient-to-br from-violet/20 to-neon-orange/10 blur-xl animate-pulse-slow"
        style={{ animationDelay: "0.4s" }}
      />

      {/* Orbit ring */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full border border-violet/20"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0%, var(--violet) 20%, var(--neon-orange) 45%, transparent 60%)",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "2px",
          animation: "loader-orbit 2.8s linear infinite",
        }}
      />

      {/* Core orb */}
      <span
        aria-hidden
        className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet via-indigo to-neon-orange shadow-[0_0_40px_-6px_var(--violet)] animate-orb-pulse"
      >
        <Crown className="h-5 w-5 text-white/90" strokeWidth={2} />
      </span>

      {/* Monospace label */}
      <span className="absolute -bottom-5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

const DEFAULT_STEPS = [
  "Verifying contacts",
  "Fetching intent signals",
  "Enriching records",
];

/**
 * Loader713Panel — premium loading card for route transitions and
 * payment processing. Deep glass card, gradient border, orb loader,
 * rotating monospace micro-copy, and a refined system footer.
 */
export function Loader713Panel({
  title = "Optimizing your flow",
  subtitle = "Gathering intelligence…",
  chip = "System_Ready",
  steps = DEFAULT_STEPS,
  systemLabel = "LYRADATA_OS v2.4",
  label = "LOADING",
}: {
  title?: string;
  subtitle?: string;
  chip?: string;
  steps?: string[];
  systemLabel?: string;
  label?: string;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (steps.length <= 1) return;
    const t = window.setInterval(
      () => setI((v) => (v + 1) % steps.length),
      2200,
    );
    return () => window.clearInterval(t);
  }, [steps.length]);

  return (
    <div className="relative flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 p-10 shadow-[0_40px_100px_-40px_oklch(0.3_0.18_285/0.45)] backdrop-blur-xl">
        {/* Animated gradient border */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[2rem] p-[1px]"
          style={{
            background:
              "linear-gradient(var(--card), var(--card)) padding-box, conic-gradient(from var(--border-angle, 0deg), var(--violet), var(--neon-orange), var(--emerald), var(--violet)) border-box",
            border: "1px solid transparent",
            animation: "loader-border-rotate 4s linear infinite",
          }}
        />

        {/* Soft aurora blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-28 size-60 rounded-full bg-violet/12 blur-[80px] animate-aurora-slow"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 size-56 rounded-full bg-neon-orange/10 blur-[72px] animate-aurora-med"
        />

        <div className="relative flex flex-col items-center text-center">
          {/* Premium status chip */}
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/50 px-3 py-1.5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
            </span>
            <Sparkles className="h-3 w-3 text-neon-orange" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {chip}
            </span>
          </div>

          {/* Hero loader */}
          <div className="mb-12">
            <Loader713 label={label} />
          </div>

          {/* Title + subtitle + rotating step */}
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>

          <div
            className="relative mt-4 h-6 w-full overflow-hidden"
            aria-live="polite"
          >
            {steps.map((s, idx) => (
              <span
                key={s}
                className={`absolute inset-0 flex items-center justify-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-violet transition-all duration-500 ease-out ${
                  idx === i
                    ? "translate-y-0 opacity-100"
                    : idx === (i - 1 + steps.length) % steps.length
                      ? "-translate-y-3 opacity-0"
                      : "translate-y-3 opacity-0"
                }`}
              >
                {s}…
              </span>
            ))}
          </div>

          {/* Premium footer */}
          <div className="mt-12 flex w-full items-center justify-between border-t border-border/60 pt-6 opacity-70">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-muted-foreground/30" />
              <span className="size-1.5 rounded-full bg-muted-foreground/30" />
              <span className="size-1.5 rounded-full bg-violet/80" />
            </div>
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              {systemLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
