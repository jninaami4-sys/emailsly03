export type Product = {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryColor: "violet" | "coral" | "emerald";
  records: number;
  price: number;
  compareAtPrice?: number;
  fileFormat: string;
  geography: string;
  description: string;
  fields: string[];
  sampleNote?: string;
  featured?: boolean;
  coverImage?: string;
};

export const CATEGORIES = [
  "All",
  "B2B Leads",
  "SaaS Leads",
  "Ecommerce Leads",
  "Executive Lists",
  "Startup Founders",
  "Real Estate Agents",
  "Healthcare Providers",
] as const;

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    slug: "saas-founders-decision-makers",
    title: "SaaS Founders & Decision Makers — 5,000 Contacts",
    category: "SaaS Leads",
    categoryColor: "violet",
    records: 5000,
    price: 79,
    compareAtPrice: 149,
    fileFormat: "CSV",
    geography: "USA, UK, Canada",
    description:
      "Founders and C-suite decision makers at growing SaaS companies. Verified within the last 30 days.",
    fields: ["Name", "Role", "Company", "Email", "LinkedIn", "Website", "Company Size", "Category"],
    sampleNote: "Free 10-row sample available on request",
    featured: true,
  },
  {
    id: "p2",
    slug: "shopify-plus-owners",
    title: "Shopify Plus Store Owners — 3,200 Contacts",
    category: "Ecommerce Leads",
    categoryColor: "emerald",
    records: 3200,
    price: 69,
    compareAtPrice: 129,
    fileFormat: "CSV",
    geography: "Global",
    description:
      "Owners and founders running Shopify Plus stores doing $1M+ ARR. Ideal for outbound to high-intent DTC.",
    fields: ["Name", "Role", "Store URL", "Email", "LinkedIn", "Est. Revenue", "Category"],
    sampleNote: "Free 10-row sample available on request",
    featured: true,
  },
  {
    id: "p3",
    slug: "fortune-1000-execs",
    title: "Fortune 1000 Executive List — 2,500 Contacts",
    category: "Executive Lists",
    categoryColor: "coral",
    records: 2500,
    price: 99,
    compareAtPrice: 199,
    fileFormat: "CSV",
    geography: "USA",
    description:
      "VP+ decision makers at Fortune 1000 companies. Includes direct-dial mobiles where available.",
    fields: ["Name", "Role", "Company", "Email", "LinkedIn", "Direct Dial", "Company Size"],
    sampleNote: "Free 10-row sample available on request",
    featured: true,
  },
  {
    id: "p4",
    slug: "series-a-founders-nyc",
    title: "Series A Startup Founders in NYC — 1,240 Contacts",
    category: "Startup Founders",
    categoryColor: "violet",
    records: 1240,
    price: 59,
    fileFormat: "CSV",
    geography: "New York Metro",
    description: "Recently funded Series-A founders based in NYC. Includes work email and direct dial.",
    fields: ["Name", "Verified Email", "Direct Dial", "Company", "Funding Round", "LinkedIn"],
  },
  {
    id: "p5",
    slug: "us-real-estate-agents",
    title: "US Real Estate Agents (Top Producers) — 4,800 Contacts",
    category: "Real Estate Agents",
    categoryColor: "coral",
    records: 4800,
    price: 65,
    compareAtPrice: 120,
    fileFormat: "CSV",
    geography: "United States",
    description: "Top-producing real estate agents across the US, filtered by transaction volume.",
    fields: ["Name", "Email", "Brokerage", "Phone", "City", "State", "LinkedIn"],
  },
  {
    id: "p6",
    slug: "us-healthcare-decision-makers",
    title: "US Healthcare Decision Makers — 1,900 Contacts",
    category: "Healthcare Providers",
    categoryColor: "emerald",
    records: 1900,
    price: 89,
    fileFormat: "CSV",
    geography: "USA",
    description: "Practice owners, hospital admins, and clinic directors across the US healthcare sector.",
    fields: ["Name", "Role", "Facility", "Email", "Direct Dial", "Specialty"],
  },
  {
    id: "p7",
    slug: "european-ecom-cmos",
    title: "European E-commerce CMOs — 1,650 Contacts",
    category: "Ecommerce Leads",
    categoryColor: "emerald",
    records: 1650,
    price: 75,
    fileFormat: "CSV",
    geography: "Europe",
    description: "Chief Marketing Officers at European e-commerce brands with €10M+ revenue.",
    fields: ["Name", "Email", "Brand", "Revenue Est.", "LinkedIn"],
  },
  {
    id: "p8",
    slug: "b2b-agency-owners",
    title: "B2B Agency Owners & Founders — 2,100 Contacts",
    category: "B2B Leads",
    categoryColor: "violet",
    records: 2100,
    price: 55,
    compareAtPrice: 99,
    fileFormat: "CSV",
    geography: "Global",
    description: "Owners and founders of independent B2B marketing agencies with 10–200 employees.",
    fields: ["Name", "Email", "Agency", "Headcount", "Direct Dial", "LinkedIn"],
  },
  {
    id: "p9",
    slug: "vp-growth-fintech",
    title: "VP Growth at Fintech Series B — 1,400 Contacts",
    category: "B2B Leads",
    categoryColor: "violet",
    records: 1400,
    price: 85,
    fileFormat: "CSV",
    geography: "USA + Canada",
    description:
      "Growth and revenue leaders at Series-B fintech companies with $10M–$50M ARR. Verified within the last 24 hours.",
    fields: ["Name", "Verified Email", "LinkedIn", "Company", "Revenue", "Direct Dial"],
  },
];
