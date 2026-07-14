import { useEffect, useState } from "react";

/**
 * Loader713 — animated "LOADING" pill loader.
 * Sourced/adapted from Uiverse.io (alexruix), themed to project tokens.
 */
export function Loader713({
  label = "LOADING",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`loader-713 ${className}`} role="status" aria-live="polite">
      <p className="loader-713-text">{label}</p>
      <span className="loader-713-load" />
    </div>
  );
}

const DEFAULT_STEPS = [
  "Verifying contacts",
  "Fetching intent signals",
  "Enriching records",
];

/**
 * Loader713Panel — on-brand loading card used for route transitions and
 * payment processing. Compact card, top gradient hairline, status chip,
 * pill loader hero, rotating monospace micro-copy, and a tiny system
 * footer. Copy is configurable so route/payment contexts read naturally.
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
      2000,
    );
    return () => window.clearInterval(t);
  }, [steps.length]);

  return (
    <div className="relative flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border/70 bg-card/95 p-10 shadow-[0_32px_64px_-24px_oklch(0.52_0.24_293/0.18)] backdrop-blur">
        {/* Top brand hairline */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet via-neon-orange to-emerald opacity-90"
        />
        {/* Soft aurora blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-52 rounded-full bg-violet/15 blur-3xl"
        />

        <div className="relative flex flex-col items-center text-center">
          {/* Status chip */}
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet/60" />
              <span className="relative inline-flex size-2 rounded-full bg-violet" />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {chip}
            </span>
          </div>

          {/* Hero loader */}
          <div className="mb-10">
            <Loader713 label={label} />
          </div>

          {/* Title + subtitle + rotating step */}
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <div
            className="relative mt-3 h-5 w-full overflow-hidden"
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

          {/* Footer */}
          <div className="mt-10 flex w-full items-center justify-between border-t border-border/60 pt-6 opacity-60">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-muted-foreground/30" />
              <span className="size-1.5 rounded-full bg-muted-foreground/30" />
              <span className="size-1.5 rounded-full bg-violet/70" />
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
