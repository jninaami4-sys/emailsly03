// Auto-KB sync source-of-truth.
// Regenerates all `source='auto'` entries in chatbot_kb from live site data:
//   • PRODUCTS (static catalog)                    → catalog + pages
//   • BLOG_POSTS (static blog content)             → blog
//   • product_details (Supabase, admin-editable)   → catalog long-descriptions
//   • announcements  (Supabase, admin-editable)    → announcements
//   • curated services / pricing / faq / policies  → services, pricing, faq, policies
//
// Manually-authored entries (source='manual') are NEVER touched.

import { PRODUCTS } from "./products";
import { BLOG_POSTS } from "./blog-posts";

export type KbAutoRow = {
  source_key: string;
  category: string;
  title: string;
  answer: string;
  sort_order: number;
};

// ---- Curated service / pricing / faq / policies (single source of truth) ----
const SERVICES: Array<{ title: string; answer: string }> = [
  {
    title: "📊 Lead generation (Apollo)",
    answer:
      "Verified B2B leads pulled from Apollo. Fixed pricing: 5,000 leads = $20 total; 10,000 leads = $35 total. Delivered as CSV within 24 hours. Fields include name, role, company, email, LinkedIn, website.",
  },
  {
    title: "🏢 ZoomInfo enterprise data",
    answer:
      "Premium ZoomInfo lead lists with HQ phone numbers, direct dials and current job titles. Starts at $50 per targeted list. Best for enterprise ABM.",
  },
  {
    title: "🔎 LinkedIn Sales Navigator export",
    answer:
      "Fresh Sales Navigator exports with current job titles, employer, industry and connection paths. Great for outbound ready-to-message lists.",
  },
  {
    title: "✍️ Manual lead research",
    answer:
      "Fully manual research for niche ICPs — any data field you need (custom criteria). We source, verify and format to your spec. From $20 per list.",
  },
  {
    title: "🌐 Website & app development",
    answer:
      "Custom-coded websites, AI-built websites, and full custom apps. Website design starts at $50 (logo) / $100 (AI-built) / $200 (custom). Timelines depend on scope.",
  },
  {
    title: "📣 Google & Meta ads setup",
    answer:
      "Full setup for Google Ads and Meta (Facebook / Instagram) — pixel install, campaign build, audience targeting. From $100 per platform. We do NOT run TikTok or other platforms.",
  },
  { title: "🎨 Logo & brand design", answer: "Custom logo design from $50. Includes 3 concepts, unlimited revisions on the picked direction, all source files." },
  { title: "📌 Facebook Pixel install", answer: "Server + client-side Facebook Pixel install with event tracking (Add-to-Cart, Purchase, Lead). $100 flat." },
];

const PRICING: Array<{ title: string; answer: string }> = [
  { title: "Apollo — 5,000 leads", answer: "$20 flat. Delivered as CSV within 24 hours." },
  { title: "Apollo — 10,000 leads", answer: "$35 flat. Delivered as CSV within 24 hours." },
  { title: "ZoomInfo custom list", answer: "From $50. Includes HQ phone + direct dial where available." },
  { title: "LinkedIn Sales Navigator export", answer: "From $20. Current titles, industry, connection paths." },
  { title: "Manual research (any criteria)", answer: "From $20 per list. Priced by complexity & volume." },
  { title: "Facebook Pixel install", answer: "$100 flat." },
  { title: "Google Ads setup", answer: "$100 flat." },
  { title: "Logo design", answer: "$50 flat. 3 concepts, all source files." },
  { title: "AI website design", answer: "$100 flat." },
  { title: "Custom-coded website", answer: "From $200. Depends on scope — request a quote." },
  { title: "Volume discounts", answer: "Yes — bulk lead orders (25k+) get automatic discounts. Ask for a custom quote." },
];

const FAQ: Array<{ title: string; answer: string }> = [
  { title: "How fresh is the data?", answer: "All leads are verified within the last 30 days before delivery. Emails run through a validator; bounced rows are replaced free." },
  { title: "What formats do you deliver?", answer: "CSV by default. XLSX or Google Sheets on request — no extra charge." },
  { title: "Can I get a free sample?", answer: "Yes — every list ships with a free 10-row sample on request before payment. Tap \"Talk to a human\" to request one." },
  { title: "What countries do you cover?", answer: "Global coverage. Strongest in USA, Canada, UK, EU, Australia. Ask for a specific country and we will confirm volume." },
  { title: "What is your bounce guarantee?", answer: "Under 5% bounce rate guaranteed. If a delivery exceeds that, we replace bounced rows free within 7 days." },
  { title: "How long does delivery take?", answer: "Prebuilt lists: instant download after payment. Apollo custom lists: within 24 hours. Manual research: 2–5 business days." },
  { title: "Do you accept custom criteria?", answer: "Yes — job title, industry, revenue, headcount, tech stack, funding stage, location, seniority, and more. Tell us your ICP." },
  { title: "How do payments work?", answer: "We accept card (Stripe), PayPal, and crypto. Invoice on request for orders over $200." },
  { title: "Can I resell the data?", answer: "No — data is licensed for your own outbound only. Ask about reseller/enterprise licenses if needed." },
  { title: "Is the data GDPR / CCPA compliant?", answer: "Yes — sourced from publicly available business records. We include an opt-out header field in every delivery." },
];

const POLICIES: Array<{ title: string; answer: string }> = [
  { title: "Refund policy", answer: "Full refund within 24 hours if we have not started delivery. After delivery, we replace bounced rows free but do not refund. Full policy → /refund-policy" },
  { title: "Privacy policy", answer: "We only collect data needed to fulfill your order. We never share customer info. Full policy → /privacy-policy" },
  { title: "Terms of service", answer: "Read the full terms → /terms" },
];

const STATIC_PAGES: Array<{ title: string; answer: string }> = [
  { title: "Browse the store", answer: "See all prebuilt lead products with prices, sample rows, and instant CSV download → /store" },
  { title: "Full pricing page", answer: "All services with transparent pricing side-by-side → /pricing" },
  { title: "Apollo leads export", answer: "Learn about our Apollo export service → /apollo-leads-export" },
  { title: "ZoomInfo leads", answer: "Enterprise ZoomInfo data details → /zoominfo-leads" },
  { title: "LinkedIn Sales Navigator leads", answer: "Sales Nav export details → /linkedin-sales-navigator-leads" },
  { title: "Manual lead research", answer: "Fully custom research service → /manual-lead-research" },
  { title: "Website design service", answer: "Custom + AI website builds → /website-design" },
  { title: "Track your order", answer: "Enter your order ID for live status → /track-order" },
  { title: "Free sample data", answer: "See what our deliveries look like → /sample-data" },
  { title: "Contact us", answer: "Reach the team directly → /contact" },
  { title: "Blog & guides", answer: "Deliverability, ICP scoring, data-source comparisons → /blog" },
];

const HELP: Array<{ title: string; answer: string }> = [
  { title: "How order status works", answer: "Give us your order ID (e.g. ORD-1042) — the bot pulls the current status and any notes from our team." },
  { title: "Hours", answer: "Sunday–Thursday, 9am–7pm (GMT+6). Outside hours: leave a ticket and we reply first thing next business day." },
  { title: "Talk to a human", answer: "Tap \"Talk to a human\" and a team member joins the chat live via Telegram. Median first-response under 5 minutes during hours." },
];

function trimAnswer(text: string, max = 700): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + "…" : clean;
}

export function buildAutoRows(input: {
  productDetails: Array<{ slug: string; long_description: string; extra_info: string; cta_url: string }>;
  announcements: Array<{ title: string; body: string; cta_label: string; cta_url: string }>;
}): KbAutoRow[] {
  const rows: KbAutoRow[] = [];

  // 1. Services
  SERVICES.forEach((s, i) =>
    rows.push({ source_key: `svc:${i}`, category: "services", title: s.title, answer: s.answer, sort_order: (i + 1) * 10 }),
  );

  // 2. Pricing
  PRICING.forEach((p, i) =>
    rows.push({ source_key: `price:${i}`, category: "pricing", title: p.title, answer: p.answer, sort_order: (i + 1) * 10 }),
  );

  // 3. Catalog — from static PRODUCTS + optional long_description from product_details
  const detailsBySlug = new Map(input.productDetails.map((d) => [d.slug, d]));
  PRODUCTS.forEach((p, i) => {
    const d = detailsBySlug.get(p.slug);
    const price = p.compareAtPrice ? `$${p.price} (was $${p.compareAtPrice})` : `$${p.price}`;
    const base = `${price}. ${p.records.toLocaleString()} ${p.category.toLowerCase()} in ${p.geography}. ${p.description}`;
    const extra = d?.long_description ? ` ${d.long_description}` : "";
    const link = ` → ${d?.cta_url || `/store/${p.slug}`}`;
    rows.push({
      source_key: `product:${p.slug}`,
      category: "catalog",
      title: p.title,
      answer: trimAnswer(base + extra + link),
      sort_order: (i + 1) * 10,
    });
  });

  // 4. FAQ
  FAQ.forEach((f, i) =>
    rows.push({ source_key: `faq:${i}`, category: "faq", title: f.title, answer: f.answer, sort_order: (i + 1) * 10 }),
  );

  // 5. Policies
  POLICIES.forEach((p, i) =>
    rows.push({ source_key: `policy:${i}`, category: "policies", title: p.title, answer: p.answer, sort_order: (i + 1) * 10 }),
  );

  // 6. Pages
  STATIC_PAGES.forEach((p, i) =>
    rows.push({ source_key: `page:${i}`, category: "pages", title: p.title, answer: p.answer, sort_order: (i + 1) * 10 }),
  );

  // 7. Blog — from BLOG_POSTS
  BLOG_POSTS.forEach((post, i) => {
    rows.push({
      source_key: `blog:${post.slug}`,
      category: "blog",
      title: post.title,
      answer: trimAnswer(`${post.excerpt} → /blog/${post.slug}`),
      sort_order: (i + 1) * 10,
    });
  });

  // 8. Help
  HELP.forEach((h, i) =>
    rows.push({ source_key: `help:${i}`, category: "help", title: h.title, answer: h.answer, sort_order: (i + 1) * 10 }),
  );

  // 9. Announcements (live)
  input.announcements.forEach((a, i) => {
    if (!a.title && !a.body) return;
    const link = a.cta_url ? ` → ${a.cta_url}` : "";
    rows.push({
      source_key: `announcement:${i}`,
      category: "announcements",
      title: a.title || "Announcement",
      answer: trimAnswer(`${a.body}${link}`),
      sort_order: (i + 1) * 10,
    });
  });

  return rows;
}

/**
 * Executes the full sync against Supabase using the service-role client.
 * Safe to call from server functions and public webhook routes.
 */
export async function runKbSync(): Promise<{
  ok: true;
  inserted: number;
  removed: number;
  categories: Record<string, number>;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const sb = supabaseAdmin as any;

  const [{ data: productDetails }, { data: announcements }] = await Promise.all([
    sb.from("product_details").select("slug, long_description, extra_info, cta_url").eq("enabled", true),
    sb.from("announcements").select("title, body, cta_label, cta_url").eq("enabled", true),
  ]);

  const rows = buildAutoRows({
    productDetails: productDetails ?? [],
    announcements: announcements ?? [],
  });

  // Remove existing auto rows, then bulk insert fresh ones.
  const { count: removed } = await sb
    .from("chatbot_kb")
    .delete({ count: "exact" })
    .eq("source", "auto");

  const payload = rows.map((r) => ({
    category: r.category,
    title: r.title,
    answer: r.answer,
    sort_order: r.sort_order,
    enabled: true,
    source: "auto",
    source_key: r.source_key,
  }));

  if (payload.length > 0) {
    const { error } = await sb.from("chatbot_kb").insert(payload);
    if (error) throw new Error(error.message);
  }

  const categories: Record<string, number> = {};
  rows.forEach((r) => {
    categories[r.category] = (categories[r.category] ?? 0) + 1;
  });

  return { ok: true, inserted: rows.length, removed: removed ?? 0, categories };
}
