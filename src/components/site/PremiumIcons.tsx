import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

function Icon({
  className,
  children,
  viewBox = "0 0 24 24",
}: IconProps & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("", className)}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function PremiumDatabase({ className }: IconProps) {
  return (
    <Icon className={className}>
      {/* Body fill for depth */}
      <path
        d="M3 5v14c0 2.2 4.03 4 9 4s9-1.8 9-4V5"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="none"
      />
      {/* Outer disks */}
      <ellipse cx="12" cy="5" rx="9" ry="3.2" />
      <ellipse cx="12" cy="5" rx="9" ry="3.2" fill="currentColor" fillOpacity="0.25" stroke="none" />
      <path d="M3 5v6c0 2 4.03 3.6 9 3.6s9-1.6 9-3.6V5" />
      <path d="M3 11v6c0 2 4.03 3.6 9 3.6s9-1.6 9-3.6v-6" />
      {/* Inner highlight */}
      <ellipse cx="12" cy="5" rx="5.5" ry="1.6" strokeOpacity="0.55" />
      {/* Data dots */}
      <circle cx="7" cy="11" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17" r="0.7" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function PremiumSparkles({ className }: IconProps) {
  return (
    <Icon className={className} viewBox="0 0 24 24">
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      <path
        d="M12 7c-2 3.5-4 5.5-7 7 3 1.5 5 3.5 7 7 2-3.5 4-5.5 7-7-3-1.5-5-3.5-7-7Z"
        fill="currentColor"
        fillOpacity="0.18"
      />
    </Icon>
  );
}

export function PremiumShieldCheck({ className }: IconProps) {
  return (
    <Icon className={className}>
      {/* Shield fill */}
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      {/* Inner shield ring */}
      <path
        d="M12 19.4s5.6-2.8 5.6-7V6.4L12 4.3 6.4 6.4V12.4c0 4.2 5.6 7 5.6 7Z"
        strokeOpacity="0.45"
      />
      {/* Outer shield */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      {/* Check */}
      <path d="m8.5 12.2 2.4 2.3 4.6-4.8" strokeWidth="1.8" />
    </Icon>
  );
}

export function PremiumTimer({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.12" />
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="6" strokeOpacity="0.4" />
      <path d="M12 7v5l3.5 2" strokeWidth="1.8" />
      <path d="M12 2v2M17 3l-1 2M7 3l1 2" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function PremiumLayers({ className }: IconProps) {
  return (
    <Icon className={className}>
      {/* Back layer */}
      <path
        d="M3 13.5c0 1.1.55 2 1.3 2.6l6.7 4.2c.7.4 1.5.4 2.2 0l6.5-4.2c.85-.55 1.3-1.5 1.3-2.6"
        strokeOpacity="0.5"
      />
      {/* Mid layer */}
      <path
        d="M3 8.5c0 1.1.55 2 1.3 2.6l6.7 4.2c.7.4 1.5.4 2.2 0l6.5-4.2c.85-.55 1.3-1.5 1.3-2.6"
        strokeOpacity="0.75"
      />
      {/* Front diamond with fill */}
      <path
        d="m12.83 2.18 7.53 4.32a1 1 0 0 1 0 1.74l-7.53 4.32a2 2 0 0 1-1.66 0L3.63 8.24a1 1 0 0 1 0-1.74L11.17 2.18a2 2 0 0 1 1.66 0Z"
        fill="currentColor"
        fillOpacity="0.22"
      />
      <path d="m12.83 2.18 7.53 4.32a1 1 0 0 1 0 1.74l-7.53 4.32a2 2 0 0 1-1.66 0L3.63 8.24a1 1 0 0 1 0-1.74L11.17 2.18a2 2 0 0 1 1.66 0Z" />
      {/* Highlight */}
      <path d="M8 5.5 12 3.5l4 2" strokeOpacity="0.7" strokeWidth="1" />
    </Icon>
  );
}

export function PremiumTarget({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6.5" strokeOpacity="0.55" />
      <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.35" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      {/* Crosshair ticks */}
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" strokeWidth="1.6" />
      {/* Arrow */}
      <path d="m18 6-4.5 4.5" strokeWidth="1.6" />
      <path d="M15 6h3v3" strokeWidth="1.6" />
    </Icon>
  );
}

export function PremiumGlobe({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </Icon>
  );
}

export function PremiumArrowUpRight({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </Icon>
  );
}

export function PremiumArrowRight({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Icon>
  );
}

export function PremiumSearch({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  );
}

export function PremiumDownload({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </Icon>
  );
}

export function PremiumStar({ className }: IconProps) {
  return (
    <Icon className={className} viewBox="0 0 24 24">
      <path
        d="M12 2l2.9 5.9L22 9.3l-4.7 4.6L18.2 22 12 18.5 5.8 22l.9-8.1L2 9.3l7.1-.4L12 2Z"
        fill="currentColor"
        stroke="none"
      />
    </Icon>
  );
}

export function PremiumZap({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
    </Icon>
  );
}

export function PremiumImageIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5-6 6-3-3-4 4" />
    </Icon>
  );
}

export function PremiumUpload({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 16V3" />
      <path d="M5 10 12 3l7 7" />
      <path d="M21 21v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6" />
    </Icon>
  );
}

export function PremiumShoppingCart({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M6 6h15l-1.5 9h-12Z" />
      <circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <path d="M3 3h2l2.5 12" />
    </Icon>
  );
}

export function PremiumMenu({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </Icon>
  );
}

export function PremiumUser({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3 4-5 8-5s8 2 8 5" />
    </Icon>
  );
}

export function PremiumLogOut({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </Icon>
  );
}

export function PremiumX({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="m18 6-12 12" />
      <path d="m6 6 12 12" />
    </Icon>
  );
}

export function PremiumFileText({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </Icon>
  );
}

export function PremiumLogoMark({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="url(#logoGradient)" />
      <circle cx="16" cy="16" r="4" fill="white" />
      <defs>
        <linearGradient id="logoGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--violet)" />
          <stop offset="1" stopColor="var(--indigo)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
