import { useState } from "react";
import { PenSquare, Star, Sparkles, ShieldCheck, ArrowRight, Gem } from "lucide-react";
import { ReviewSubmitModal } from "@/components/site/ReviewSubmitModal";

type Variant = "footer" | "dashboard";

type Props = {
  variant?: Variant;
  className?: string;
};

/**
 * Premium call-to-action inviting customers to share a verified review.
 * Two visual variants:
 *  - `footer`   : dark editorial card for the marketing site footer
 *  - `dashboard`: compact violet card for the logged-in customer dashboard
 */
export function ShareExperienceCTA({ variant = "footer", className = "" }: Props) {
  const [open, setOpen] = useState(false);

  if (variant === "dashboard") {
    return (
      <>
        <div
          className={`group relative overflow-hidden rounded-2xl border border-violet/25 bg-gradient-to-br from-violet/10 via-card to-card p-5 shadow-sm transition-colors hover:border-violet/40 ${className}`}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-violet/25 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-10 size-32 rounded-full bg-neon-blue/20 blur-2xl" />

          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet/25 bg-violet/10 px-2.5 py-1">
              <Sparkles className="size-3 text-violet" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                Loved us?
              </span>
            </div>

            <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
              Share your experience
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your verified review helps other founders trust the process.
            </p>

            <div className="mt-3 flex items-center gap-1.5 text-violet">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-current" />
              ))}
              <span className="ml-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                60 sec · text or video
              </span>
            </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet to-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet/25 transition-transform hover:-translate-y-0.5"
            >
              <PenSquare className="size-4" /> Write a review
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>

            <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <ShieldCheck className="size-3 text-emerald" />
              Verified customer only
            </div>
          </div>
        </div>

        <ReviewSubmitModal open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  // Footer variant — editorial, magnetic composition
  return (
    <>
      <div
        className={`group/cta relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(139,92,246,0.18),transparent_55%),radial-gradient(120%_120%_at_100%_100%,rgba(59,130,246,0.16),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-8 backdrop-blur-md sm:p-12 ${className}`}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-violet/25 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-28 -right-20 size-72 rounded-full bg-neon-blue/20 blur-[120px]" />

        {/* Hairline gradient borders */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent" />

        {/* Subtle grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "3px 3px",
          }}
        />

        <div className="relative flex flex-col items-center gap-8 text-center md:flex-row md:items-stretch md:justify-between md:gap-10 md:text-left">
          {/* Left: story */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-violet" />
              </span>
              <Gem className="size-3 text-violet" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                Worked with us?
              </span>
            </div>

            <h3 className="mt-5 font-display text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-4xl">
              Share your experience —{" "}
              <span className="relative inline-block bg-gradient-to-r from-violet via-neon-blue to-violet bg-[length:200%_100%] bg-clip-text text-transparent [animation:shimmer_6s_linear_infinite]">
                get featured
              </span>
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65 sm:text-base">
              A 60-second text or video review helps other founders trust the process. Verified customers only — we hand-pick a few every week to spotlight.
            </p>

            {/* Stat pills */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                <div className="flex items-center gap-0.5 text-violet">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3 fill-current" />
                  ))}
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
                  4.9 avg
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                <ShieldCheck className="size-3 text-emerald" />
                Verified only
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                <Sparkles className="size-3 text-neon-blue" />
                60 seconds
              </div>
            </div>
          </div>

          {/* Right: medallion + CTA */}
          <div className="flex flex-col items-center gap-4 md:items-end md:justify-center">
            {/* Icon medallion with concentric glow */}
            <div className="relative hidden md:block">
              <div className="pointer-events-none absolute inset-0 -m-4 rounded-full bg-gradient-to-tr from-violet/40 via-transparent to-neon-blue/40 opacity-70 blur-xl" />
              <div className="relative grid size-16 place-items-center rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                <PenSquare className="size-6 text-white" />
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gradient-to-br from-violet to-neon-blue text-white shadow-md">
                  <Sparkles className="size-3" />
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group/btn relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-violet via-indigo to-violet bg-[length:200%_100%] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(139,92,246,0.55)] ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-right hover:shadow-[0_22px_50px_-12px_rgba(139,92,246,0.75)]"
            >
              {/* Sheen sweep */}
              <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 group-hover/btn:left-full group-hover/btn:opacity-100" />
              <PenSquare className="relative size-4" />
              <span className="relative">Share your experience</span>
              <ArrowRight className="relative size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </button>

            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Takes under a minute
            </p>
          </div>
        </div>
      </div>

      <ReviewSubmitModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
