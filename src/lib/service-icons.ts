// Icon registry for editable service cards.
// Admin can pick a preset key OR provide iconUrl (custom uploaded image).
import {
  PremiumDatabase,
  PremiumTarget,
  PremiumShieldCheck,
  PremiumLayers,
  PremiumGlobe,
  PremiumFileText,
  PremiumRocket,
  PremiumZap,
  PremiumWallet,
  PremiumBuilding,
  PremiumUserSearch,
  PremiumPhone,
  PremiumSearch,
  PremiumSparkles,
  PremiumStar,
} from "@/components/site/PremiumIcons";

export const SERVICE_ICON_REGISTRY = {
  database: PremiumDatabase,
  target: PremiumTarget,
  shield: PremiumShieldCheck,
  layers: PremiumLayers,
  globe: PremiumGlobe,
  file: PremiumFileText,
  rocket: PremiumRocket,
  zap: PremiumZap,
  wallet: PremiumWallet,
  building: PremiumBuilding,
  user: PremiumUserSearch,
  phone: PremiumPhone,
  search: PremiumSearch,
  sparkles: PremiumSparkles,
  star: PremiumStar,
} as const;

export type ServiceIconKey = keyof typeof SERVICE_ICON_REGISTRY;

export const SERVICE_ICON_KEYS = Object.keys(SERVICE_ICON_REGISTRY) as ServiceIconKey[];

export function getServiceIcon(key?: string | null) {
  if (!key) return PremiumDatabase;
  return (SERVICE_ICON_REGISTRY as Record<string, typeof PremiumDatabase>)[key] ?? PremiumDatabase;
}

export const GRADIENT_PRESETS: { key: string; label: string; gradient: string; accent: string }[] = [
  { key: "indigo", label: "Indigo", gradient: "from-[#1e3a8a] via-[#2563eb] to-[#418df1]", accent: "text-[#c4b5fd]" },
  { key: "blue", label: "Blue", gradient: "from-[#0a66c2] via-[#2563eb] to-[#6366f1]", accent: "text-[#93c5fd]" },
  { key: "orange", label: "Orange", gradient: "from-[#c2410c] via-[#f97316] to-[#fbbf24]", accent: "text-[#fed7aa]" },
  { key: "emerald", label: "Emerald", gradient: "from-[#065f46] via-[#10b981] to-[#22d3ee]", accent: "text-[#a7f3d0]" },
  { key: "teal", label: "Teal", gradient: "from-[#134e4a] via-[#0d9488] to-[#38bdf8]", accent: "text-[#99f6e4]" },
  { key: "rose", label: "Rose", gradient: "from-[#831843] via-[#e11d48] to-[#f97316]", accent: "text-[#fecdd3]" },
  { key: "navy", label: "Navy", gradient: "from-[#0f2547] via-[#2563eb] to-[#7fb0f5]", accent: "text-[#f5d0fe]" },
  { key: "violet", label: "Violet", gradient: "from-[#4c1d95] via-[#7c3aed] to-[#d946ef]", accent: "text-[#e9d5ff]" },
];

export function getGradientPreset(key?: string | null) {
  return GRADIENT_PRESETS.find((g) => g.key === key) ?? GRADIENT_PRESETS[0];
}

export type EditableServiceCard = {
  serviceId: string;
  title: string;
  tagline: string;
  badge: string;
  price: string;
  perUnit: string;
  unit?: string;
  minOrder: string;
  turnaround: string;
  bullets: string[];
  icon: ServiceIconKey | string;
  iconUrl?: string; // custom uploaded image; overrides `icon` when set
  gradientKey: string;
  enabled?: boolean;
};

export const DEFAULT_SERVICE_CARDS: EditableServiceCard[] = [
  {
    serviceId: "apollo",
    title: "Apollo B2B Data",
    tagline: "Fresh, filtered Apollo exports — cleaned, deduped, CRM-ready.",
    badge: "Most popular",
    price: "$0.0035",
    perUnit: "per lead",
    minOrder: "5,000 min",
    turnaround: "≤24h",
    bullets: ["Verified emails", "Any ICP filter", "Deduped"],
    icon: "database",
    gradientKey: "indigo",
    enabled: true,
  },
  {
    serviceId: "linkedin",
    title: "LinkedIn Sales Navigator",
    tagline: "Sales Nav searches → enriched, contact-ready spreadsheets.",
    badge: "Enriched",
    price: "$0.01",
    perUnit: "per lead",
    minOrder: "5,000 min",
    turnaround: "≤24h",
    bullets: ["Sales Nav URLs", "Title + seniority", "~70% w/ emails"],
    icon: "target",
    gradientKey: "blue",
    enabled: true,
  },
  {
    serviceId: "zoominfo",
    title: "ZoomInfo Enterprise",
    tagline: "Enterprise-grade ZoomInfo pulls, mapped to your CRM schema.",
    badge: "Enterprise",
    price: "$0.02",
    perUnit: "per lead",
    minOrder: "1,000 min",
    turnaround: "24–48h",
    bullets: ["Direct dials", "Tech stack", "Firmographics"],
    icon: "database",
    gradientKey: "orange",
    enabled: true,
  },
  {
    serviceId: "manual",
    title: "Hand-Picked Leads",
    tagline: "100% human-verified prospecting for complex, high-value ICPs.",
    badge: "Human-verified",
    price: "$0.35",
    perUnit: "per lead",
    unit: "leads",
    minOrder: "100 min",
    turnaround: "48–72h",
    bullets: ["1-by-1 vetted", "Niche ICPs", "0% bounce"],
    icon: "shield",
    gradientKey: "emerald",
    enabled: true,
  },
  {
    serviceId: "mobile",
    title: "Mobile Number Lookup",
    tagline: "Append verified mobile numbers to your existing contact list.",
    badge: "Append",
    price: "$0.15",
    perUnit: "per record",
    unit: "records",
    minOrder: "100 min",
    turnaround: "≤24h",
    bullets: ["Cell-verified", "US + intl.", "CSV in / CSV out"],
    icon: "phone",
    gradientKey: "navy",
    enabled: true,
  },
  {
    serviceId: "warmup",
    title: "Domain DNS Setup & Warmup",
    tagline: "DKIM, SPF & DMARC setup + 15-day warmup for 2 domains — $50 / 2 domains.",
    badge: "Deliverability",
    price: "$50",
    perUnit: "2 domains · 15 days",
    minOrder: "2 domains min",
    turnaround: "15 days",
    bullets: ["DKIM + SPF + DMARC", "2-domain package", "Inbox placement"],
    icon: "shield",
    gradientKey: "teal",
    enabled: true,
  },
  {
    serviceId: "webdesign",
    title: "Custom Website Build",
    tagline: "Conversion-focused landing pages for outbound campaigns.",
    badge: "Design",
    price: "$200",
    perUnit: "flat",
    minOrder: "Single site",
    turnaround: "3–5 days",
    bullets: ["Figma → live", "Mobile-first", "SEO baked-in"],
    icon: "layers",
    gradientKey: "rose",
    enabled: true,
  },
];
