import { useState } from "react";
import { PenSquare, Star, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
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

  // Footer variant — dark editorial card
  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-8 backdrop-blur-sm sm:p-10 ${className}`}
      >
        <div className="pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-violet/25 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 size-64 rounded-full bg-neon-blue/20 blur-[110px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet/60 to-transparent" />

        <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <Sparkles className="size-3 text-violet" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                Worked with us?
              </span>
            </div>

            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Share your experience —{" "}
              <span className="bg-gradient-to-r from-violet via-neon-blue to-violet bg-clip-text text-transparent">
                get featured
              </span>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60 sm:text-base">
              A 60-second text or video review helps other founders trust the process. Verified customers only.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start">
              <div className="flex items-center gap-1 text-violet">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
                <span className="ml-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white/70">
                  4.9 / 5 avg rating
                </span>
              </div>
              <div className="hidden h-3 w-px bg-white/15 md:block" />
              <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white/60">
                <ShieldCheck className="size-3 text-emerald" />
                Verified only
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet via-indigo to-violet bg-[length:200%_100%] px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet/30 transition-all hover:-translate-y-0.5 hover:bg-right hover:shadow-2xl hover:shadow-violet/40"
          >
            <PenSquare className="size-4" />
            Share your experience
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      <ReviewSubmitModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
