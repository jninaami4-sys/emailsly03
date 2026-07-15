// Premium admin icon set — drop-in replacements for lucide-react icons used
// across the admin panel. Same named exports, same props (className, size), so
// existing call sites don't change. Style: 1.5 stroke, rounded, subtle fills
// to match the storefront's PremiumIcons.
import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
  size?: number | string;
  strokeWidth?: number | string;
};

function I({
  className,
  size,
  strokeWidth = 1.5,
  children,
  viewBox = "0 0 24 24",
  spin = false,
}: IconProps & {
  children: React.ReactNode;
  viewBox?: string;
  spin?: boolean;
}) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(spin && "animate-spin", className)}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* ---------- basic controls ---------- */

export const X = (p: IconProps) => (
  <I {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </I>
);

export const Plus = (p: IconProps) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);

export const Check = (p: IconProps) => (
  <I {...p}>
    <path d="m5 12 5 5 9-11" strokeWidth={1.8} />
  </I>
);

export const ChevronDown = (p: IconProps) => (
  <I {...p}>
    <path d="m6 9 6 6 6-6" />
  </I>
);

export const ChevronUp = (p: IconProps) => (
  <I {...p}>
    <path d="m6 15 6-6 6 6" />
  </I>
);

export const ChevronRight = (p: IconProps) => (
  <I {...p}>
    <path d="m9 6 6 6-6 6" />
  </I>
);

export const ArrowRight = (p: IconProps) => (
  <I {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </I>
);

export const ArrowUpDown = (p: IconProps) => (
  <I {...p}>
    <path d="m7 4-3 3 3 3" />
    <path d="M4 7h12" />
    <path d="m17 20 3-3-3-3" />
    <path d="M20 17H8" />
  </I>
);

export const Search = (p: IconProps) => (
  <I {...p}>
    <circle cx="11" cy="11" r="7.5" />
    <path d="m21 21-4.3-4.3" />
  </I>
);

export const Loader2 = (p: IconProps) => (
  <I {...p} spin>
    <path d="M21 12a9 9 0 1 1-6.2-8.55" strokeWidth={2} />
  </I>
);

export const RefreshCw = (p: IconProps) => (
  <I {...p}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66" />
    <path d="M20 4v5h-5" />
  </I>
);

export const RefreshCcw = (p: IconProps) => (
  <I {...p}>
    <path d="M4 12a8 8 0 0 1 13.66-5.66" />
    <path d="M20 4v5h-5" />
    <path d="M20 12a8 8 0 0 1-13.66 5.66" />
    <path d="M4 20v-5h5" />
  </I>
);

/* ---------- status ---------- */

export const CheckCircle2 = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.12" />
    <circle cx="12" cy="12" r="10" />
    <path d="m8 12.5 2.5 2.5 5.5-6" strokeWidth={1.8} />
  </I>
);

export const XCircle = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.12" />
    <circle cx="12" cy="12" r="10" />
    <path d="m9 9 6 6M15 9l-6 6" strokeWidth={1.8} />
  </I>
);

export const MinusCircle = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.12" />
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8" strokeWidth={1.8} />
  </I>
);

export const Info = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.12" />
    <circle cx="12" cy="12" r="10" />
    <path d="M12 11v5" strokeWidth={1.8} />
    <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
  </I>
);

export const Ban = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.12" />
    <circle cx="12" cy="12" r="10" />
    <path d="m5 5 14 14" strokeWidth={1.8} />
  </I>
);

export const ShieldAlert = (p: IconProps) => (
  <I {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" fill="currentColor" fillOpacity="0.15" />
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="M12 8v5" strokeWidth={1.8} />
    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
  </I>
);

export const ShieldCheck = (p: IconProps) => (
  <I {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" fill="currentColor" fillOpacity="0.15" />
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m8.5 12.2 2.4 2.3 4.6-4.8" strokeWidth={1.8} />
  </I>
);

export const Lock = (p: IconProps) => (
  <I {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" fillOpacity="0.15" />
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </I>
);

/* ---------- actions ---------- */

export const Upload = (p: IconProps) => (
  <I {...p}>
    <path d="M12 16V3" />
    <path d="M5 10 12 3l7 7" />
    <path d="M21 21v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4" />
  </I>
);

export const Download = (p: IconProps) => (
  <I {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </I>
);

export const Save = (p: IconProps) => (
  <I {...p}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" fill="currentColor" fillOpacity="0.12" />
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M7 3v6h9" strokeOpacity="0.7" />
    <rect x="7" y="13" width="10" height="8" rx="1" strokeOpacity="0.7" />
  </I>
);

export const Trash2 = (p: IconProps) => (
  <I {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <path d="M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" fill="currentColor" fillOpacity="0.1" />
    <path d="M10 11v7M14 11v7" strokeOpacity="0.7" />
  </I>
);

export const Send = (p: IconProps) => (
  <I {...p}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4 20-7Z" fill="currentColor" fillOpacity="0.15" />
    <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
  </I>
);

export const ExternalLink = (p: IconProps) => (
  <I {...p}>
    <path d="M14 3h7v7" />
    <path d="M10 14 21 3" />
    <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
  </I>
);

export const MousePointerClick = (p: IconProps) => (
  <I {...p}>
    <path d="M5 3l10 4-4 1-1 4-5-9Z" fill="currentColor" fillOpacity="0.2" />
    <path d="M5 3l10 4-4 1-1 4-5-9Z" />
    <path d="M13 13l6 6" />
    <circle cx="18" cy="18" r="3" strokeOpacity="0.7" />
  </I>
);

/* ---------- visibility ---------- */

export const Eye = (p: IconProps) => (
  <I {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" fill="currentColor" fillOpacity="0.1" />
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" />
    <circle cx="12" cy="12" r="3" />
  </I>
);

export const EyeOff = (p: IconProps) => (
  <I {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.1A10.9 10.9 0 0 1 12 6c6.5 0 10 7 10 7a17 17 0 0 1-3.2 3.9" />
    <path d="M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7c2 0 3.7-.5 5.2-1.2" />
    <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2" />
  </I>
);

/* ---------- media ---------- */

export const ImageIcon = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" fillOpacity="0.1" />
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5-6 6-3-3-4 4" />
  </I>
);

export const ImageOff = (p: IconProps) => (
  <I {...p}>
    <path d="M3 3l18 18" />
    <rect x="3" y="3" width="18" height="18" rx="3" strokeOpacity="0.6" />
    <path d="m21 15-5-5-3 3" strokeOpacity="0.6" />
  </I>
);

export const Video = (p: IconProps) => (
  <I {...p}>
    <rect x="2" y="6" width="14" height="12" rx="2" fill="currentColor" fillOpacity="0.12" />
    <rect x="2" y="6" width="14" height="12" rx="2" />
    <path d="m22 8-6 4 6 4V8Z" fill="currentColor" fillOpacity="0.2" />
    <path d="m22 8-6 4 6 4V8Z" />
  </I>
);

export const Crop = (p: IconProps) => (
  <I {...p}>
    <path d="M6 2v14a2 2 0 0 0 2 2h14" />
    <path d="M18 22V8a2 2 0 0 0-2-2H2" />
  </I>
);

/* ---------- devices & layout ---------- */

export const Monitor = (p: IconProps) => (
  <I {...p}>
    <rect x="2" y="4" width="20" height="14" rx="2" fill="currentColor" fillOpacity="0.1" />
    <rect x="2" y="4" width="20" height="14" rx="2" />
    <path d="M9 22h6M12 18v4" />
  </I>
);

export const Smartphone = (p: IconProps) => (
  <I {...p}>
    <rect x="6" y="2" width="12" height="20" rx="3" fill="currentColor" fillOpacity="0.1" />
    <rect x="6" y="2" width="12" height="20" rx="3" />
    <path d="M11 18h2" strokeWidth={1.8} />
  </I>
);

export const Server = (p: IconProps) => (
  <I {...p}>
    <rect x="2" y="4" width="20" height="7" rx="2" fill="currentColor" fillOpacity="0.12" />
    <rect x="2" y="4" width="20" height="7" rx="2" />
    <rect x="2" y="13" width="20" height="7" rx="2" fill="currentColor" fillOpacity="0.12" />
    <rect x="2" y="13" width="20" height="7" rx="2" />
    <circle cx="6" cy="7.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="6" cy="16.5" r="1" fill="currentColor" stroke="none" />
  </I>
);

export const Database = (p: IconProps) => (
  <I {...p}>
    <ellipse cx="12" cy="5" rx="9" ry="3" fill="currentColor" fillOpacity="0.2" />
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5" />
    <path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6" />
  </I>
);

export const Webhook = (p: IconProps) => (
  <I {...p}>
    <circle cx="6" cy="18" r="3" fill="currentColor" fillOpacity="0.15" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="18" r="3" fill="currentColor" fillOpacity="0.15" />
    <circle cx="18" cy="18" r="3" />
    <circle cx="12" cy="6" r="3" fill="currentColor" fillOpacity="0.15" />
    <circle cx="12" cy="6" r="3" />
    <path d="M9 18h6" />
    <path d="m14 8-4 7" strokeOpacity="0.7" />
    <path d="m10 8 4 7" strokeOpacity="0.7" />
  </I>
);

export const LineChart = (p: IconProps) => (
  <I {...p}>
    <path d="M3 3v18h18" />
    <path d="m7 16 4-4 3 3 5-6" strokeWidth={1.8} />
  </I>
);

export const BarChart3 = (p: IconProps) => (
  <I {...p}>
    <path d="M3 3v18h18" />
    <rect x="7" y="12" width="3" height="6" rx="0.5" fill="currentColor" fillOpacity="0.25" />
    <rect x="12" y="8" width="3" height="10" rx="0.5" fill="currentColor" fillOpacity="0.25" />
    <rect x="17" y="5" width="3" height="13" rx="0.5" fill="currentColor" fillOpacity="0.25" />
  </I>
);

export const Layout = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" fillOpacity="0.1" />
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </I>
);

export const PanelBottom = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" fillOpacity="0.1" />
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 15h18" />
  </I>
);

export const Boxes = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="10" width="8" height="10" rx="1.5" fill="currentColor" fillOpacity="0.1" />
    <rect x="3" y="10" width="8" height="10" rx="1.5" />
    <rect x="13" y="10" width="8" height="10" rx="1.5" fill="currentColor" fillOpacity="0.1" />
    <rect x="13" y="10" width="8" height="10" rx="1.5" />
    <rect x="8" y="2" width="8" height="8" rx="1.5" fill="currentColor" fillOpacity="0.1" />
    <rect x="8" y="2" width="8" height="8" rx="1.5" />
  </I>
);

export const Package = (p: IconProps) => (
  <I {...p}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" fill="currentColor" fillOpacity="0.12" />
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="m3 8 9 5 9-5M12 13v8" strokeOpacity="0.7" />
  </I>
);

/* ---------- misc / meta ---------- */

export const Globe = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.08" />
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
  </I>
);

export const BellRing = (p: IconProps) => (
  <I {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9Z" fill="currentColor" fillOpacity="0.1" />
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9Z" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    <path d="M2 5c.7-.7 1.5-1.4 2.5-2M22 5c-.7-.7-1.5-1.4-2.5-2" strokeOpacity="0.6" />
  </I>
);

export const HelpCircle = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
    <circle cx="12" cy="12" r="10" />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
    <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
  </I>
);

export const Megaphone = (p: IconProps) => (
  <I {...p}>
    <path d="M3 11v2a2 2 0 0 0 2 2h2l7 4V5L7 9H5a2 2 0 0 0-2 2Z" fill="currentColor" fillOpacity="0.12" />
    <path d="M3 11v2a2 2 0 0 0 2 2h2l7 4V5L7 9H5a2 2 0 0 0-2 2Z" />
    <path d="M18 8a5 5 0 0 1 0 8" />
  </I>
);

export const Sparkles = (p: IconProps) => (
  <I {...p}>
    <path d="M12 3v3M12 18v3M4.5 4.5l2 2M17.5 17.5l2 2M3 12h3M18 12h3M4.5 19.5l2-2M17.5 6.5l2-2" strokeOpacity="0.8" />
    <path d="M12 7c-1.5 3-3 4.5-6 6 3 1.5 4.5 3 6 6 1.5-3 3-4.5 6-6-3-1.5-4.5-3-6-6Z" fill="currentColor" fillOpacity="0.2" />
    <path d="M12 7c-1.5 3-3 4.5-6 6 3 1.5 4.5 3 6 6 1.5-3 3-4.5 6-6-3-1.5-4.5-3-6-6Z" />
  </I>
);

export const Palette = (p: IconProps) => (
  <I {...p}>
    <path d="M12 3a9 9 0 1 0 0 18 3 3 0 0 0 3-3v-1a2 2 0 0 1 2-2h1a3 3 0 0 0 3-3 9 9 0 0 0-9-9Z" fill="currentColor" fillOpacity="0.1" />
    <path d="M12 3a9 9 0 1 0 0 18 3 3 0 0 0 3-3v-1a2 2 0 0 1 2-2h1a3 3 0 0 0 3-3 9 9 0 0 0-9-9Z" />
    <circle cx="7.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="10" cy="8" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="8" r="1.2" fill="currentColor" stroke="none" />
  </I>
);

/* ---------- people & comms ---------- */

export const Mail = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" fillOpacity="0.1" />
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </I>
);

export const MessageCircle = (p: IconProps) => (
  <I {...p}>
    <path d="M21 12a8.5 8.5 0 0 1-12.5 7.5L3 21l1.5-5.5A8.5 8.5 0 1 1 21 12Z" fill="currentColor" fillOpacity="0.12" />
    <path d="M21 12a8.5 8.5 0 0 1-12.5 7.5L3 21l1.5-5.5A8.5 8.5 0 1 1 21 12Z" />
  </I>
);

export const MessageSquare = (p: IconProps) => (
  <I {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4V5Z" fill="currentColor" fillOpacity="0.1" />
    <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4V5Z" />
  </I>
);

export const Users = (p: IconProps) => (
  <I {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2 20c0-3 3-5 7-5s7 2 7 5" />
    <circle cx="17" cy="9" r="2.5" strokeOpacity="0.7" />
    <path d="M22 19c0-2-2-3.5-5-3.5" strokeOpacity="0.7" />
  </I>
);

export const UserPlus = (p: IconProps) => (
  <I {...p}>
    <circle cx="10" cy="8" r="3.5" />
    <path d="M3 20c0-3 3-5 7-5s7 2 7 5" />
    <path d="M19 8v6M16 11h6" strokeOpacity="0.8" />
  </I>
);

export const Building2 = (p: IconProps) => (
  <I {...p}>
    <path d="M6 21V4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v17" fill="currentColor" fillOpacity="0.1" />
    <path d="M6 21V4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v17" />
    <path d="M15 8h4a1 1 0 0 1 1 1v12" />
    <path d="M3 21h18" />
    <path d="M9 7h.01M9 11h.01M9 15h.01M12 7h.01M12 11h.01M12 15h.01" strokeWidth={1.8} />
  </I>
);

export const CalendarClock = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" fill="currentColor" fillOpacity="0.08" />
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
    <circle cx="16" cy="16" r="3.5" fill="currentColor" fillOpacity="0.15" />
    <path d="M16 14v2l1.5 1" strokeWidth={1.6} />
  </I>
);

export const Bug = (p: IconProps) => (
  <I {...p}>
    <rect x="7" y="8" width="10" height="12" rx="5" fill="currentColor" fillOpacity="0.1" />
    <rect x="7" y="8" width="10" height="12" rx="5" />
    <path d="M12 8V5M8 5l1.5 2M16 5l-1.5 2" />
    <path d="M3 14h4M17 14h4M4 10l3 1M20 10l-3 1M4 18l3-1M20 18l-3-1" strokeOpacity="0.7" />
  </I>
);

/* ---------- money & rewards ---------- */

export const DollarSign = (p: IconProps) => (
  <I {...p}>
    <path d="M12 3v18" strokeWidth={1.8} />
    <path d="M17 7c0-2-2-3-5-3s-5 1-5 3 2 3 5 3 5 1 5 3-2 3-5 3-5-1-5-3" />
  </I>
);

export const CreditCard = (p: IconProps) => (
  <I {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" fill="currentColor" fillOpacity="0.1" />
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" strokeWidth={1.8} />
    <path d="M6 15h4" strokeOpacity="0.7" />
  </I>
);

export const Wallet = (p: IconProps) => (
  <I {...p}>
    <path d="M19 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" fill="currentColor" fillOpacity="0.12" />
    <path d="M19 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
    <path d="M19 7V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1" />
    <circle cx="17" cy="13" r="1" fill="currentColor" stroke="none" />
  </I>
);

export const Gift = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="8" width="18" height="12" rx="2" fill="currentColor" fillOpacity="0.12" />
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M12 8v12" />
    <path d="M8 8c-1.5-2-1-4 1-4s2.5 2 1 4M16 8c-1.5-2-1-4 1-4s2.5 2 1 4" />
  </I>
);

export const Trophy = (p: IconProps) => (
  <I {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" fill="currentColor" fillOpacity="0.15" />
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
    <path d="M8 4H4v2a3 3 0 0 0 3 3M16 4h4v2a3 3 0 0 1-3 3" />
    <path d="M12 13v4M8 21h8M10 21v-2h4v2" />
  </I>
);

export const Star = (p: IconProps) => (
  <I {...p}>
    <path
      d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9L12 3Z"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9L12 3Z" />
  </I>
);
