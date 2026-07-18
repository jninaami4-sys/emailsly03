// Default site content — used as fallback when a section isn't set in DB.
// Editable via Admin → Site Content.
import { DEFAULT_SERVICE_CARDS } from "@/lib/service-icons";


export const SITE_CONTENT_DEFAULTS = {
  hero: {
    badge: "Premium B2B Data Platform",
    title_line_1: "Verified B2B Leads",
    title_line_2: "Delivered in 24h",
    title_line_3: "To Your CRM",
    subtitle:
      "Precision-targeted, 99% accurate leads from Apollo, ZoomInfo, and LinkedIn — delivered to your CRM in 24 hours.",
    primary_cta: "Start Your Order",
    secondary_cta: "Explore Solutions",
  },
  popup: {
    enabled: false,
    title: "Welcome!",
    body: "Get 10% off your first order.",
    cta_label: "Claim offer",
    cta_url: "/store",
  },
  trust: {
    stat_1_value: "500+",
    stat_1_label: "clients served",
    stat_2_value: "100M+",
    stat_2_label: "leads delivered",
    stat_3_value: "24h",
    stat_3_label: "avg. delivery",
    items: [
      { value: "500+", label: "Clients served", icon: "user", iconUrl: "", color: "indigo" },
      { value: "100M+", label: "Leads delivered", icon: "database", iconUrl: "", color: "blue" },
      { value: "24h", label: "Avg. delivery", icon: "zap", iconUrl: "", color: "emerald" },
    ],
  },
  testimonials: {
    heading: "Loved by growth teams that ship",
    subheading: "Every review below comes from a signed-in customer. We verify before we publish.",
    items: [
      { text: "We booked 42 qualified demos in the first three weeks. The data was cleaner than anything we've ever pulled from Apollo directly.", name: "Sarah Chen", role: "VP Growth, Northwind", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150" },
      { text: "Delivered in 18 hours. Bounce rate under 2%. EmailsLy is now our default outbound engine — we cancelled two other tools.", name: "Marcus Rivera", role: "Founder, Helios Labs", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150" },
      { text: "The mobile numbers actually connect. Our SDR team's connect rate jumped from 4% to 19% in a month. Wild ROI.", name: "Priya Anand", role: "Head of SDRs, Loomly", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150" },
      { text: "Seamless integration with our CRM. Enriched 12k accounts overnight — no manual cleanup needed.", name: "Omar Raza", role: "CEO, Vortex", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150" },
      { text: "Our reply rate doubled and pipeline coverage tripled. EmailsLy is the quiet engine behind our Q4 number.", name: "Hassan Ali", role: "E-commerce Manager", avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150" },
    ],
  },
  services: {
    heading: "Our services",
    subheading: "Everything you need to fill your pipeline.",
    section_eyebrow: "Our services · full stack",
    section_headline_pre: "Everything you need to",
    section_headline_accent: "scale outbound.",
    section_sub: "Swipe through the full stack — tap a service to jump straight into the order builder with it preselected.",
  },
  service_cards: {
    items: DEFAULT_SERVICE_CARDS,
  },

  competitors: {
    heading: "Why choose us over the competition",
    row_1_name: "Apollo",
    row_1_us: "$49 / 1k",
    row_1_them: "$149 / 1k",
    row_2_name: "ZoomInfo",
    row_2_us: "$79 / 1k",
    row_2_them: "$249 / 1k",
  },
  faq: {
    heading: "Frequently asked questions",
    items: [
      { q: "How fast will I receive my data?", a: "Most orders are delivered within 24 hours." },
      { q: "What format will the data be in?", a: "Clean, ready-to-import CSV files." },
      { q: "How accurate is the data?", a: "99%+ accuracy, verified before delivery." },
    ],
  },
  notices: {
    top_banner_enabled: false,
    top_banner_text: "🎉 Free sample — try 50 leads on us. Reply to any confirmation email.",
    top_banner_url: "/store",
  },
  footer: {
    tagline: "Verified B2B leads, delivered.",
    copyright: "© EmailsLy. All rights reserved.",
    newsletter_heading: "Get lead-gen tips",
    newsletter_sub: "One short email a week. Unsubscribe anytime.",
  },
  misc: {
    cta_banner_heading: "Ready to fill your pipeline?",
    cta_banner_sub: "Start with a free 50-lead sample.",
    cta_banner_button: "Start your order",
  },
  branding: {
    site_name: "EmailsLy",
    logo_url: "/__l5e/assets-v1/cefa0fcb-c63a-417d-9b6c-f4b799342926/emailsly-logo-trim.png",
    footer_logo_url: "/__l5e/assets-v1/13871748-4ee2-4ddc-9e8b-f37e91287305/emailsly-logo-white.png",
    favicon_url: "/__l5e/assets-v1/ea57d947-a4da-451d-9133-ccca76f30438/emailsly-favicon.png",
    invoice_logo_url: "",
    tagline: "Verified B2B Data Platform",
    primary_color: "#7C3AED",
    accent_color: "#D946EF",
    ink_color: "#0A0A1F",
  },
  contact: {
    email: "hello@emailsly.com",
    whatsapp: "+1 (555) 010-9820",
    calendar_url: "cal.com/emailsly",
    address: "",
    hours: "Mon–Fri · 9am–6pm",
    response_promise: "Response within 4 business hours. Or grab time on the calendar directly.",
  },
} as const;

export type SiteContentDefaults = typeof SITE_CONTENT_DEFAULTS;
export type SiteContentSection = keyof SiteContentDefaults;
