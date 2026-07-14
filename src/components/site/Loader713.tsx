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

export function Loader713Panel({
  title = "Processing your payment",
  subtitle = "Securely confirming your transaction — please don't close this window.",
  label = "LOADING",
}: {
  title?: string;
  subtitle?: string;
  label?: string;
}) {
  return (
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden px-4 py-16">
      {/* Soft violet aurora backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/15 blur-3xl animate-aurora-slow" />
        <div className="absolute left-1/3 top-1/3 size-[360px] rounded-full bg-indigo-soft blur-3xl animate-aurora-med" />
        <div className="absolute inset-0 bg-[radial-gradient(oklch(0.6_0.12_280/0.05)_1px,transparent_1px)] [background-size:22px_22px] opacity-60" />
      </div>

      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        <div className="relative flex size-32 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-violet/25 [animation:preloader-pop_2.4s_ease-in-out_infinite]" />
          <span className="absolute inset-3 rounded-full border border-violet/15 [animation:preloader-pop_2.4s_ease-in-out_.4s_infinite]" />
          <span className="absolute inset-0 rounded-full bg-violet/20 blur-2xl" />
          <div className="relative rounded-2xl border border-violet/20 bg-card/70 px-5 py-4 shadow-[0_20px_60px_-25px_oklch(0.52_0.24_293/0.5)] backdrop-blur">
            <Loader713 label={label} />
          </div>
        </div>
        <h2 className="mt-8 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">{subtitle}</p>

        <div className="mt-6 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald" />
          256-bit encrypted · PCI-DSS
        </div>
      </div>
    </div>
  );
}
