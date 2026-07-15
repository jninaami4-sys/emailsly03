// Default site content — used as fallback when a section isn't set in DB.
// Editable via Admin → Site Content.

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
  },
  services: {
    heading: "Our services",
    subheading: "Everything you need to fill your pipeline.",
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
    logo_url: "/__l5e/assets-v1/23556452-21cb-4486-8c5a-c52c2328594b/emailsly-logo.png",
    favicon_url: "/__l5e/assets-v1/23556452-21cb-4486-8c5a-c52c2328594b/emailsly-logo.png",
    tagline: "Verified B2B Data Platform",
    primary_color: "#7C3AED",
    accent_color: "#22C55E",
    ink_color: "#0F172A",
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
