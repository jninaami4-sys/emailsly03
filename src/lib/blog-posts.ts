export type PostBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "callout"; title: string; text: string };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingMinutes: number;
  publishedAt: string; // ISO
  author: { name: string; role: string; initials: string };
  cover: { eyebrow: string; kicker: string }; // simple text-based cover, keeps design tokens
  featured?: boolean;
  content: PostBlock[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "cold-email-deliverability-2026",
    title: "The 2026 cold email deliverability playbook",
    excerpt:
      "Inbox providers changed the rules again. Here's the domain warmup, list hygiene, and sending cadence that still lands in the primary tab.",
    category: "Outbound",
    readingMinutes: 8,
    publishedAt: "2026-06-24",
    author: { name: "Marcus Thorne", role: "VP Sales, EmailsLy", initials: "MT" },
    cover: { eyebrow: "Deliverability", kicker: "Land in the primary tab — every time." },
    featured: true,
    content: [
      {
        type: "p",
        text: "Google and Microsoft quietly rolled out another round of sender-reputation changes in Q2. Teams that used to see 40% reply rates are watching their sequences vanish into Promotions. The fix isn't a better subject line — it's a better sending foundation.",
      },
      { type: "h2", text: "Warm the domain, not the mailbox" },
      {
        type: "p",
        text: "Warmup tools that only rotate seed emails between themselves are being flagged as inorganic. Real warmup means real conversations — replies from prospects, calendar invites, forwarded threads. Give a new domain 4 weeks before you send a single cold email.",
      },
      {
        type: "ul",
        items: [
          "Buy the domain at least 30 days before first send",
          "Set up SPF, DKIM, DMARC — and monitor the reports",
          "Send 5–10 human emails per day from every mailbox for two weeks",
          "Only then layer in a warmup tool on top of real activity",
        ],
      },
      { type: "h2", text: "List hygiene beats list size" },
      {
        type: "p",
        text: "A 5,000-lead list with a 2% bounce rate will out-deliver a 50,000-lead list with 12% bounces every time. Verification isn't optional anymore — it's the price of entry.",
      },
      {
        type: "callout",
        title: "Rule of thumb",
        text: "Keep bounce rate under 2% and spam complaints under 0.1%. Cross either line for a week and providers throttle your entire domain.",
      },
      { type: "h2", text: "Cadence that respects the inbox" },
      {
        type: "ol",
        items: [
          "Day 1 — short, personal, no links",
          "Day 3 — reference their trigger event, one soft CTA",
          "Day 7 — value-first: teardown, resource, or data point",
          "Day 12 — polite break-up email, always",
        ],
      },
      {
        type: "quote",
        text: "Deliverability is a compounding asset. Every clean send you make is credit toward the next one; every spam complaint burns a month of goodwill.",
        cite: "EmailsLy deliverability desk",
      },
    ],
  },
  {
    slug: "apollo-vs-zoominfo-vs-linkedin",
    title: "Apollo vs. ZoomInfo vs. LinkedIn: which source wins in 2026?",
    excerpt:
      "We ran the same ICP through all three databases and scored the results on coverage, freshness, and per-lead cost. The winner might surprise you.",
    category: "Data Sources",
    readingMinutes: 6,
    publishedAt: "2026-06-10",
    author: { name: "Elena Rodriguez", role: "Head of Data, EmailsLy", initials: "ER" },
    cover: { eyebrow: "Benchmark", kicker: "Coverage, freshness, and cost — side by side." },
    content: [
      {
        type: "p",
        text: "Every founder asks the same question in their first sales call: which database should we standardize on? The honest answer is that no single source wins across the board. Here's how we score them.",
      },
      { type: "h2", text: "Coverage" },
      {
        type: "p",
        text: "For a 2,500-account US mid-market ICP (Series A–C SaaS, 50–500 headcount), ZoomInfo returned the most decision-maker contacts, LinkedIn returned the freshest job titles, and Apollo landed in the middle on both axes — while costing 10× less per lead.",
      },
      { type: "h2", text: "Freshness" },
      {
        type: "p",
        text: "LinkedIn wins here, full stop. Titles and companies update within days. ZoomInfo lags by 6–8 weeks. Apollo sits in between, but the gap closes fast when you export against a live search rather than a saved list.",
      },
      { type: "h2", text: "Per-lead cost" },
      {
        type: "ul",
        items: [
          "Apollo: ~$0.0035/lead when exported in bulk",
          "LinkedIn Sales Navigator: ~$0.01/lead via live scraping",
          "ZoomInfo: ~$0.02/lead for the direct-dial premium tier",
        ],
      },
      {
        type: "callout",
        title: "Our take",
        text: "Use Apollo as your default outbound engine, LinkedIn for account intel and trigger events, and ZoomInfo only when you need direct dials for a small, high-priority list.",
      },
    ],
  },
  {
    slug: "icp-scoring-framework",
    title: "A 5-minute ICP scoring framework for outbound teams",
    excerpt:
      "Skip the 40-tab spreadsheet. This scoring model uses four inputs to rank any prospect list and doubles reply rates on average.",
    category: "Strategy",
    readingMinutes: 5,
    publishedAt: "2026-05-28",
    author: { name: "David Park", role: "Director RevOps, EmailsLy", initials: "DP" },
    cover: { eyebrow: "Framework", kicker: "Rank any list in five minutes." },
    content: [
      {
        type: "p",
        text: "Most ICP scoring models collapse under their own weight. Sales stops using them, and the list goes back to being sorted by employee count. Keep it to four signals, weight them, and move on.",
      },
      { type: "h2", text: "The four inputs" },
      {
        type: "ol",
        items: [
          "Fit — do their firmographics match your best customer?",
          "Intent — are they showing a trigger event this quarter?",
          "Reach — do you have the right seniority contact?",
          "Access — can you get to a decision-maker in under three touches?",
        ],
      },
      { type: "h2", text: "How to weight them" },
      {
        type: "p",
        text: "Start with equal weights, run a two-week pilot, then adjust based on which signal correlates with booked meetings. In our data, Intent is almost always undervalued — score it 2× until proven otherwise.",
      },
      {
        type: "quote",
        text: "The teams that grow fastest aren't the ones with the biggest lists. They're the ones who can rank a list in five minutes and mean it.",
      },
    ],
  },
  {
    slug: "crm-hygiene-automations",
    title: "Six CRM hygiene automations every SDR team should ship this quarter",
    excerpt:
      "Dirty pipeline data costs the average B2B team six figures a year in wasted sequences. Ship these six automations and reclaim the pipeline.",
    category: "Operations",
    readingMinutes: 7,
    publishedAt: "2026-05-12",
    author: { name: "Sarah Jenkins", role: "VP Growth, EmailsLy", initials: "SJ" },
    cover: { eyebrow: "RevOps", kicker: "Reclaim your pipeline in a weekend." },
    content: [
      {
        type: "p",
        text: "You don't need a new CRM. You need six small automations that run every night while your team sleeps.",
      },
      { type: "h2", text: "The six" },
      {
        type: "ol",
        items: [
          "Bounce → auto-archive the contact and flag the account",
          "Job change detected → move contact to a nurture list",
          "No activity in 90 days → downgrade lifecycle stage",
          "Duplicate detected → merge on primary email match",
          "Missing enrichment → queue for the enrichment job",
          "Owner inactive → reassign to the pool queue",
        ],
      },
      {
        type: "callout",
        title: "Compounding wins",
        text: "None of these are glamorous, but together they save the average 10-person SDR team 6–8 hours per week of manual list work.",
      },
    ],
  },
];

export function getPostBySlug(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function formatPublishedAt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
