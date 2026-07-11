export type Product = {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryColor: "violet" | "coral" | "emerald";
  records: number;
  price: number;
  accuracy: string;
  description: string;
  fields: string[];
  geography: string;
  featured?: boolean;
};

export const CATEGORIES = [
  "All",
  "SaaS",
  "E-commerce",
  "Real Estate",
  "HR Tech",
  "Agency",
  "Logistics",
  "Fintech",
  "Healthcare",
] as const;

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    slug: "vp-growth-fintech",
    title: "VP Growth at Fintech Series B",
    category: "Fintech",
    categoryColor: "violet",
    records: 1400,
    price: 120,
    accuracy: "98%",
    geography: "USA + Canada",
    description:
      "Growth and revenue leaders at Series-B fintech companies with $10M–$50M ARR. Verified within the last 24 hours.",
    fields: ["Full Name", "Verified Email", "LinkedIn", "Company", "Revenue", "Direct Dial"],
    featured: true,
  },
  {
    id: "p2",
    slug: "uk-commercial-real-estate",
    title: "UK Commercial Portfolio Owners",
    category: "Real Estate",
    categoryColor: "coral",
    records: 850,
    price: 85,
    accuracy: "99%",
    geography: "United Kingdom",
    description: "Owners and principals of UK commercial property portfolios valued at £5M+.",
    fields: ["Full Name", "Verified Email", "Portfolio Size", "HQ Address"],
  },
  {
    id: "p3",
    slug: "shopify-plus-founders",
    title: "Shopify Plus Founders ($1M+ ARR)",
    category: "E-commerce",
    categoryColor: "emerald",
    records: 3200,
    price: 210,
    accuracy: "97%",
    geography: "Global",
    description:
      "Founders and CEOs running Shopify Plus stores doing over $1M ARR. Ideal for outbound to high-intent DTC.",
    fields: ["Full Name", "Verified Email", "Store URL", "Est. Revenue", "LinkedIn"],
    featured: true,
  },
  {
    id: "p4",
    slug: "heads-of-talent-scaleups",
    title: "Heads of Talent at Scale-ups",
    category: "HR Tech",
    categoryColor: "violet",
    records: 1800,
    price: 150,
    accuracy: "100%",
    geography: "USA + Europe",
    description: "Talent leaders at scale-ups (50–500 employees) actively hiring engineering.",
    fields: ["Full Name", "Verified Email", "Company", "Headcount", "LinkedIn"],
  },
  {
    id: "p5",
    slug: "marketing-agency-ceos",
    title: "Marketing Agency CEOs",
    category: "Agency",
    categoryColor: "coral",
    records: 2100,
    price: 180,
    accuracy: "98%",
    geography: "Global",
    description: "CEOs and founders of independent marketing agencies with 10–200 employees.",
    fields: ["Full Name", "Verified Email", "Agency", "Headcount", "Direct Dial"],
    featured: true,
  },
  {
    id: "p6",
    slug: "supply-chain-directors",
    title: "Supply Chain Directors",
    category: "Logistics",
    categoryColor: "emerald",
    records: 900,
    price: 95,
    accuracy: "97%",
    geography: "North America",
    description: "Directors and VPs of supply chain at mid-market manufacturers and 3PLs.",
    fields: ["Full Name", "Verified Email", "Company", "Direct Dial"],
  },
  {
    id: "p7",
    slug: "healthtech-vps",
    title: "HealthTech VPs of Product",
    category: "Healthcare",
    categoryColor: "violet",
    records: 720,
    price: 140,
    accuracy: "99%",
    geography: "USA",
    description: "Product leaders at digital-health and med-tech companies with $5M+ funding.",
    fields: ["Full Name", "Verified Email", "Company", "Stage", "LinkedIn"],
  },
  {
    id: "p8",
    slug: "series-a-tech-founders-nyc",
    title: "Series A Tech Founders in NYC",
    category: "SaaS",
    categoryColor: "coral",
    records: 1240,
    price: 149,
    accuracy: "99%",
    geography: "New York Metro",
    description: "Series-A tech founders based in NYC. Includes work email and direct dial.",
    fields: ["Full Name", "Verified Email", "Direct Dial", "Company", "Funding Round"],
  },
  {
    id: "p9",
    slug: "ecom-cmos-eu",
    title: "European E-commerce CMOs",
    category: "E-commerce",
    categoryColor: "emerald",
    records: 1650,
    price: 175,
    accuracy: "98%",
    geography: "Europe",
    description: "Chief Marketing Officers at European e-commerce brands with €10M+ revenue.",
    fields: ["Full Name", "Verified Email", "Brand", "Revenue Est.", "LinkedIn"],
  },
];
