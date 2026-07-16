import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PromoAccent =
  | "violet"
  | "magenta"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "coral";

export type PromoImageStyle = "none" | "cover" | "thumbnail";

export interface PremiumPromoCardProps {
  title: string;
  description?: string;
  badge?: string;
  accent?: PromoAccent;
  imageUrl?: string;
  imageStyle?: PromoImageStyle;
  imageAlt?: string;
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryCta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  children?: ReactNode;
  /** Loading state replaces content with a skeleton shimmer. */
  isLoading?: boolean;
}

interface AccentPalette {
  text: string;
  ring: string;
  soft: string;
  bg: string;
  shadow: string;
  glowFrom: string;
  glowTo: string;
  hairline: string;
  dot: string;
}

const PALETTE: Record<PromoAccent, AccentPalette> = {
  violet: {
    text: "text-violet",
    ring: "border-violet/30",
    soft: "bg-violet/10",
    bg: "bg-gradient-to-b from-violet to-[oklch(0.45_0.22_293)]",
    shadow: "shadow-[0_20px_60px_-20px_oklch(0.52_0.24_293/0.55)]",
    glowFrom: "from-violet/40",
    glowTo: "to-[oklch(0.55_0.22_310)]/25",
    hairline: "before:from-violet/60",
    dot: "bg-violet",
  },
  magenta: {
    text: "text-magenta",
    ring: "border-magenta/30",
    soft: "bg-magenta/10",
    bg: "bg-gradient-to-b from-magenta to-[oklch(0.58_0.24_328)]",
    shadow: "shadow-[0_20px_60px_-20px_oklch(0.66_0.28_328/0.55)]",
    glowFrom: "from-magenta/40",
    glowTo: "to-[oklch(0.7_0.22_340)]/25",
    hairline: "before:from-magenta/60",
    dot: "bg-magenta",
  },
  emerald: {
    text: "text-emerald",
    ring: "border-emerald/30",
    soft: "bg-emerald/10",
    bg: "bg-gradient-to-b from-emerald to-[oklch(0.55_0.15_165)]",
    shadow: "shadow-[0_20px_60px_-20px_oklch(0.66_0.16_165/0.5)]",
    glowFrom: "from-emerald/40",
    glowTo: "to-[oklch(0.7_0.18_190)]/25",
    hairline: "before:from-emerald/60",
    dot: "bg-emerald",
  },
  amber: {
    text: "text-amber-600",
    ring: "border-amber-500/30",
    soft: "bg-amber-500/10",
    bg: "bg-gradient-to-b from-amber-500 to-amber-600",
    shadow: "shadow-[0_20px_60px_-20px_oklch(0.75_0.16_75/0.5)]",
    glowFrom: "from-amber-400/40",
    glowTo: "to-rose-500/20",
    hairline: "before:from-amber-500/60",
    dot: "bg-amber-500",
  },
  rose: {
    text: "text-rose-600",
    ring: "border-rose-500/30",
    soft: "bg-rose-500/10",
    bg: "bg-gradient-to-b from-rose-500 to-rose-600",
    shadow: "shadow-[0_20px_60px_-20px_oklch(0.65_0.22_15/0.5)]",
    glowFrom: "from-rose-500/40",
    glowTo: "to-violet/25",
    hairline: "before:from-rose-500/60",
    dot: "bg-rose-500",
  },
  sky: {
    text: "text-sky-600",
    ring: "border-sky-500/30",
    soft: "bg-sky-500/10",
    bg: "bg-gradient-to-b from-sky-500 to-sky-600",
    shadow: "shadow-[0_20px_60px_-20px_oklch(0.7_0.16_235/0.5)]",
    glowFrom: "from-sky-500/40",
    glowTo: "to-violet/25",
    hairline: "before:from-sky-500/60",
    dot: "bg-sky-500",
  },
  coral: {
    text: "text-coral",
    ring: "border-coral/30",
    soft: "bg-coral/10",
    bg: "bg-gradient-to-b from-coral to-[oklch(0.58_0.24_328)]",
    shadow: "shadow-[0_20px_60px_-20px_oklch(0.66_0.28_328/0.55)]",
    glowFrom: "from-coral/40",
    glowTo: "to-[oklch(0.7_0.22_340)]/25",
    hairline: "before:from-coral/60",
    dot: "bg-coral",
  },
};

function ActionButton({
  cta,
  variant,
  accent,
}: {
  cta: NonNullable<
    PremiumPromoCardProps["cta"] | PremiumPromoCardProps["secondaryCta"]
  >;
  variant: "primary" | "secondary";
  accent: AccentPalette;
}) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring motion-reduce:transition-none";

  const primaryClasses = cn(
    baseClasses,
    "relative overflow-hidden text-white ring-1 ring-white/20 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-lg active:translate-y-0 active:brightness-95",
    accent.bg,
    accent.shadow
  );

  const secondaryClasses = cn(
    baseClasses,
    "border border-white/10 bg-white/[0.03] text-foreground backdrop-blur hover:border-white/25 hover:bg-white/[0.08] hover:text-foreground active:bg-white/[0.05]"
  );

  const children = (
    <>
      {variant === "primary" && (
        <span className="absolute inset-x-0 top-0 h-px bg-white/50" />
      )}
      <span className="relative">{cta.label}</span>
    </>
  );

  if (cta.href) {
    return (
      <a
        href={cta.href}
        onClick={cta.onClick}
        className={variant === "primary" ? primaryClasses : secondaryClasses}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={cta.onClick}
      className={variant === "primary" ? primaryClasses : secondaryClasses}
    >
      {children}
    </button>
  );
}

function Skeleton({ accent }: { accent: AccentPalette }) {
  const gradientId = useId().replace(/:/g, "");
  return (
    <div
      className="relative space-y-4 p-6 sm:p-8"
      aria-busy="true"
      aria-label="Loading promotion"
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-block h-6 w-20 rounded-full motion-reduce:animate-none",
            accent.soft
          )}
        />
      </div>
      <span className="block h-8 w-3/4 rounded-lg bg-secondary" />
      <div className="space-y-2">
        <span className="block h-4 w-full rounded bg-secondary" />
        <span className="block h-4 w-5/6 rounded bg-secondary" />
      </div>
      <div className="flex gap-2.5 pt-2">
        <span className="inline-block h-10 w-28 rounded-xl bg-secondary" />
        <span className="inline-block h-10 w-24 rounded-xl bg-secondary" />
      </div>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden rounded-[28px]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.08" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={`url(#${gradientId})`}
          className={cn("animate-shimmer motion-reduce:animate-none", accent.text)}
        />
      </svg>
    </div>
  );
}

export function PremiumPromoCard({
  title,
  description,
  badge,
  accent = "violet",
  imageUrl,
  imageStyle = "none",
  imageAlt = "",
  cta,
  secondaryCta,
  className,
  children,
  isLoading = false,
}: PremiumPromoCardProps) {
  const p = PALETTE[accent];
  const resolvedImageStyle: PromoImageStyle = imageUrl ? imageStyle : "none";
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-card to-[oklch(0.13_0.01_260)] ring-1 ring-white/5",
        "transition-all duration-300 ease-out motion-reduce:transition-none",
        "hover:-translate-y-1 hover:border-white/15 hover:shadow-xl hover:ring-white/10",
        "focus-within:border-white/20 focus-within:ring-2 focus-within:ring-ring",
        p.shadow,
        className
      )}
    >
      {/* Top accent hairline */}
      <span
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          p.text
        )}
        aria-hidden="true"
      />

      {resolvedImageStyle === "cover" && imageUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-secondary">
          <img
            src={imageUrl}
            alt={imageAlt}
            className={cn(
              "h-full w-full object-cover transition-all duration-500 ease-out motion-reduce:transition-none",
              imageLoaded ? "scale-100 opacity-100 blur-0" : "scale-105 opacity-0 blur-sm"
            )}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <div
            className={cn(
              "pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[140%] -translate-x-1/2 rounded-full bg-gradient-to-t blur-3xl opacity-70 transition-opacity duration-300 group-hover:opacity-90",
              p.glowFrom,
              p.glowTo
            )}
          />
        </div>
      )}

      {resolvedImageStyle !== "cover" && !isLoading && (
        <div className="relative h-32 w-full overflow-hidden">
          <div
            className={cn(
              "absolute -top-20 left-1/2 size-72 -translate-x-1/2 rounded-full bg-gradient-to-br blur-3xl transition-all duration-500 group-hover:scale-110 motion-reduce:transition-none",
              p.glowFrom,
              p.glowTo
            )}
          />
          <div
            className={cn(
              "absolute -bottom-24 right-0 size-56 rounded-full bg-gradient-to-tr to-transparent blur-3xl opacity-70 transition-all duration-500 group-hover:scale-110 motion-reduce:transition-none",
              p.glowFrom
            )}
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
        </div>
      )}

      {isLoading ? (
        <Skeleton accent={p} />
      ) : (
        <div className="relative -mt-6 p-6 sm:p-8">
          {resolvedImageStyle === "thumbnail" && imageUrl && (
            <div
              className={cn(
                "mb-4 inline-flex size-20 overflow-hidden rounded-2xl border bg-secondary shadow-lg transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none",
                p.ring
              )}
            >
              <img
                src={imageUrl}
                alt={imageAlt}
                className={cn(
                  "h-full w-full object-cover transition-all duration-500 motion-reduce:transition-none",
                  imageLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"
                )}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          )}

          {badge && (
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur",
                p.ring,
                p.soft,
                p.text
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full shadow-[0_0_8px_currentColor]",
                  p.dot
                )}
              />
              {badge}
            </span>
          )}

          <h3 className="mt-4 font-display text-[26px] font-bold leading-[1.1] tracking-tight text-foreground sm:text-[32px]">
            {title}
          </h3>

          {description && (
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}

          {children}

          {(cta || secondaryCta) && (
            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              {cta && <ActionButton cta={cta} variant="primary" accent={p} />}
              {secondaryCta && (
                <ActionButton cta={secondaryCta} variant="secondary" accent={p} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
