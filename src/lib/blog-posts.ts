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
    title: "Cold Email Deliverability in 2026: How to Fix It and Land in the Primary Inbox",
    excerpt:
      "A practical cold email deliverability guide for 2026: B2B domain warm-up, list hygiene, SPF/DKIM/DMARC setup, and the sending cadence that still hits the primary tab.",
    category: "Outbound",
    readingMinutes: 9,
    publishedAt: "2026-06-24",
    author: { name: "Marcus Thorne", role: "VP Sales, EmailsLy", initials: "MT" },
    cover: { eyebrow: "Deliverability", kicker: "Land in the primary tab — every time." },
    featured: true,
    content: [
      {
        type: "p",
        text: "Cold email deliverability got harder again in 2026. Google and Microsoft quietly rolled out another round of sender-reputation changes in Q2, and teams that used to see 40% reply rates are now watching sequences vanish into Promotions or spam. The fix isn't a better subject line — it's a better sending foundation. This guide walks through the B2B email domain warm-up, list hygiene, and cadence changes that still put cold email in the primary inbox.",
      },
      {
        type: "p",
        text: "Every recommendation below is drawn from EmailsLy's deliverability desk, where we monitor bounce and complaint rates across thousands of outbound sending domains each month. If your reply rate dropped in the last quarter, start here.",
      },
      { type: "h2", text: "1. Warm the B2B email domain, not just the mailbox" },
      {
        type: "p",
        text: "Warmup tools that only rotate seed emails between themselves are being flagged as inorganic in 2026. Real B2B email domain warm-up means real conversations — replies from prospects, calendar invites, forwarded threads. Give a new domain at least four weeks of human activity before you send a single cold email from it, and never point a warmup tool at a brand-new domain in isolation.",
      },
      {
        type: "ul",
        items: [
          "Buy the domain at least 30 days before first send",
          "Set up SPF, DKIM, and DMARC — and actually read the DMARC aggregate reports",
          "Send 5–10 human emails per day from every mailbox for two weeks",
          "Only then layer in a warmup tool on top of real, replied-to activity",
          "Cap sending at 30 emails/day per mailbox for the first month",
        ],
      },
      { type: "h3", text: "How do I improve cold email deliverability for a new domain?" },
      {
        type: "p",
        text: "Treat the first 30 days as reputation building, not pipeline building. Send from the domain manually — vendor thank-yous, internal notes, replies to sign-ups — before any automated cold outreach touches it. Providers weight the first 30–90 days of activity heavily when scoring your domain.",
      },
      { type: "h2", text: "2. List hygiene beats list size" },
      {
        type: "p",
        text: "A 5,000-lead list with a 2% bounce rate will out-deliver a 50,000-lead list with 12% bounces every time. Bad lead data can ruin cold email deliverability inside a single campaign — inbox providers treat repeated bounces as spammer behavior, not a data problem. Email verification isn't optional anymore; it's the price of entry.",
      },
      { type: "h3", text: "Can bad lead data ruin cold email deliverability?" },
      {
        type: "p",
        text: "Yes, and faster than most teams expect. A single send to a list with more than 5% invalid addresses can throttle your domain for weeks. Verify every list at the moment of send — not the moment of purchase — because B2B email addresses decay by roughly 2% per month as people change jobs.",
      },
      {
        type: "callout",
        title: "Rule of thumb",
        text: "Keep bounce rate under 2% and spam complaints under 0.1%. Cross either line for a week and providers throttle your entire domain.",
      },
      { type: "h2", text: "3. Cadence that respects the inbox" },
      {
        type: "p",
        text: "Cold email best practices for 2025 and 2026 all point in the same direction: shorter sequences, more personalization, and no links in the first touch. Providers now score sequences based on how quickly people open, reply, or delete — not just whether they land in the inbox at all.",
      },
      {
        type: "ol",
        items: [
          "Day 1 — short, personal, no links",
          "Day 3 — reference their trigger event, one soft CTA",
          "Day 7 — value-first: teardown, resource, or data point",
          "Day 12 — polite break-up email, always",
        ],
      },
      { type: "h3", text: "What ruins cold email deliverability the fastest?" },
      {
        type: "p",
        text: "In order of destructive impact: high bounce rate, spam-word-heavy templates, tracking pixels on every send, links in the first email, and identical body copy across thousands of mailboxes. Fix bounces first — everything else compounds on top of a clean list.",
      },
      { type: "h2", text: "4. Monitor deliverability every week" },
      {
        type: "p",
        text: "Deliverability is not a launch task — it's a weekly hygiene job. Check Google Postmaster Tools and Microsoft SNDS every Monday, watch DMARC reports for spoofing attempts, and rotate any mailbox that trips a complaint threshold. Teams that treat deliverability as maintenance keep 90%+ inbox placement year over year.",
      },
      {
        type: "quote",
        text: "Deliverability is a compounding asset. Every clean send you make is credit toward the next one; every spam complaint burns a month of goodwill.",
        cite: "EmailsLy deliverability desk",
      },
      {
        type: "callout",
        title: "Start with verified data",
        text: "The fastest way to protect deliverability is to start with data that's already been checked. Every EmailsLy list is triple-verified before delivery, with bounce rates guaranteed under 2%.",
      },
    ],
  },
  {
    slug: "apollo-vs-zoominfo-vs-linkedin",
    title: "Apollo vs ZoomInfo vs LinkedIn (2026): Which B2B Data Source Actually Wins?",
    excerpt:
      "Apollo vs ZoomInfo vs LinkedIn, benchmarked in 2026. We ran the same ICP through all three databases and scored coverage, freshness, and per-lead cost — with the honest verdict on which is better for outbound.",
    category: "Data Sources",
    readingMinutes: 7,
    publishedAt: "2026-06-10",
    author: { name: "Elena Rodriguez", role: "Head of Data, EmailsLy", initials: "ER" },
    cover: { eyebrow: "Benchmark", kicker: "Coverage, freshness, and cost — side by side." },
    content: [
      {
        type: "p",
        text: "Apollo vs ZoomInfo is the most-asked question in B2B sales tooling — and once LinkedIn Sales Navigator is added to the shortlist, most teams stall for weeks trying to pick a winner. The honest answer for 2026 is that no single database wins across the board. We ran the same 2,500-account ICP through Apollo.io, ZoomInfo, and LinkedIn Sales Navigator and scored the results on the three axes that actually move outbound: coverage, freshness, and per-lead cost.",
      },
      { type: "h2", text: "Coverage: how many decision-makers each database returns" },
      {
        type: "p",
        text: "For a 2,500-account US mid-market ICP (Series A–C SaaS, 50–500 headcount), ZoomInfo returned the most decision-maker contacts per account (4.2 on average), LinkedIn returned the freshest job titles but fewer verified emails, and Apollo.io landed in the middle on both axes — while costing roughly 10× less per lead than ZoomInfo. Apollo's database size closes the gap fast once you strip out ZoomInfo's stale contacts.",
      },
      { type: "h2", text: "Freshness: how recent are the job titles?" },
      {
        type: "p",
        text: "LinkedIn wins the freshness benchmark, full stop. Titles and companies update within days because prospects maintain their own profiles. ZoomInfo lags by 6–8 weeks in our tests, which is enough for 4–5% of a mid-market list to already be out of date on the day you buy it. Apollo sits in between — the gap closes fast when you export against a live search rather than a saved list.",
      },
      { type: "h2", text: "Per-lead cost: Apollo vs ZoomInfo vs LinkedIn pricing" },
      {
        type: "p",
        text: "Effective per-lead cost is the metric most Apollo vs ZoomInfo comparisons skip, and it's the one that decides annual budget. Here's the normalized cost for a 5,000-lead export at each database's standard 2026 rates:",
      },
      {
        type: "ul",
        items: [
          "Apollo.io — ~$0.0035 per lead when exported in bulk",
          "LinkedIn Sales Navigator — ~$0.01 per lead via live search + verification",
          "ZoomInfo — ~$0.02 per lead for the direct-dial premium tier",
        ],
      },
      { type: "h3", text: "Which is better: ZoomInfo Sales vs Apollo.io?" },
      {
        type: "p",
        text: "For pure email outbound at scale, Apollo.io wins on price and is close enough on coverage. For ABM programs where you need mobile numbers and org charts for a small set of accounts, ZoomInfo is still worth the premium. If you can only pay for one, Apollo covers 80% of what most outbound teams need.",
      },
      { type: "h3", text: "Is Apollo or ZoomInfo more accurate?" },
      {
        type: "p",
        text: "Accuracy is a wash on freshly exported records — both hit 90%+ verified email rates. The gap opens on stale records: ZoomInfo's saved lists rot faster than Apollo's because more of the data is proprietary rather than crawled from public sources. Always export against a live search, not a saved list, regardless of which tool you pick.",
      },
      {
        type: "callout",
        title: "Our take",
        text: "Use Apollo.io as your default outbound engine, LinkedIn Sales Navigator for account intel and trigger events, and ZoomInfo only when you need direct dials for a small, high-priority list. That stack costs less than a ZoomInfo seat alone.",
      },
      {
        type: "p",
        text: "The last thing to know about Apollo vs ZoomInfo vs LinkedIn: none of them are the right answer if you're just starting outbound. Buying a targeted, verified list once — at the exact ICP you're testing — costs less than any of these subscriptions and skips the tool learning curve entirely.",
      },
    ],
  },
  {
    slug: "icp-scoring-framework",
    title: "How to Create an Ideal Customer Profile (ICP): A 5-Minute Scoring Framework",
    excerpt:
      "How to create and score an ideal customer profile in five minutes. Skip the 40-tab spreadsheet — this ICP scoring framework uses four inputs to rank any prospect list and doubles reply rates on average.",
    category: "Strategy",
    readingMinutes: 6,
    publishedAt: "2026-05-28",
    author: { name: "David Park", role: "Director RevOps, EmailsLy", initials: "DP" },
    cover: { eyebrow: "Framework", kicker: "Rank any list in five minutes." },
    content: [
      {
        type: "p",
        text: "Most teams know they need an ideal customer profile, but the frameworks they inherit collapse under their own weight. Sales stops using them within a quarter, and the prospect list goes back to being sorted by employee count. This guide is a lightweight ICP scoring framework that keeps decision-making to four inputs, works on any B2B prospect list, and takes about five minutes to run once you've done it twice.",
      },
      { type: "h2", text: "What is an ideal customer profile?" },
      {
        type: "p",
        text: "An ideal customer profile (ICP) is a written definition of the company most likely to buy your product, stay a customer, and refer more like them. Unlike a buyer persona, which describes an individual, an ICP describes the account: industry, size, tech stack, geography, and the trigger events that make now the right time to buy. A good ICP is short enough to remember and specific enough to disqualify most of the market.",
      },
      { type: "h2", text: "How to create an ideal customer profile in four inputs" },
      {
        type: "p",
        text: "Every ICP scoring framework that survives contact with real sales teams uses fewer than five signals. More than that and reps stop scoring; fewer and the model can't tell good from great. These are the four we use with every EmailsLy customer:",
      },
      {
        type: "ol",
        items: [
          "Fit — do their firmographics (industry, size, region, tech stack) match your best-fit customers?",
          "Intent — are they showing a trigger event (funding, hiring, tech change) this quarter?",
          "Reach — do you have the right seniority contact and their verified email?",
          "Access — can you plausibly reach a decision-maker in under three touches?",
        ],
      },
      { type: "h2", text: "How to weight the four ICP inputs" },
      {
        type: "p",
        text: "Start with equal weights (25% each), run a two-week pilot, then adjust based on which signal correlates most tightly with booked meetings. In our data, Intent is almost always undervalued — score it 2× until proven otherwise. Fit gets over-weighted because it's the easiest to measure; ignore that instinct.",
      },
      { type: "h3", text: "How do I find new leads matching my ideal customer profile?" },
      {
        type: "p",
        text: "Once you have the four inputs and their weights, you have a rubric a data provider can filter against. Feed the fit criteria (industry, size, region, tech stack) into your list source, then layer intent signals from LinkedIn, funding databases, and job postings on top. The final list should be shorter than your first draft and score above 70/100 on the rubric.",
      },
      { type: "h3", text: "What if my ideal customer profile is undefined or unclear?" },
      {
        type: "p",
        text: "Start with your last 20 closed-won deals. Pull the firmographics, the trigger event, the seniority of the champion, and the number of touches to reach them. Patterns show up faster than most teams expect — usually one industry, one size band, and one trigger event account for 60%+ of the wins. That pattern is your first ICP draft.",
      },
      { type: "h2", text: "Ship the ICP as a scorecard, not a slide" },
      {
        type: "p",
        text: "The single biggest reason ICP scoring frameworks fail is that they live in a slide deck instead of the tools reps use every day. Put the rubric in your CRM as four custom fields, auto-populate what you can, and make the ICP score visible on every account view. If a rep can see the score without leaving their workflow, they'll use it.",
      },
      {
        type: "quote",
        text: "The teams that grow fastest aren't the ones with the biggest lists. They're the ones who can rank a list in five minutes and mean it.",
      },
    ],
  },
  {
    slug: "crm-hygiene-automations",
    title: "CRM Data Hygiene: 6 Automations Every SDR Team Should Ship This Quarter",
    excerpt:
      "A practical CRM data hygiene checklist. Dirty CRM data costs the average B2B team six figures a year in wasted sequences — ship these six data cleansing automations and reclaim your pipeline in a weekend.",
    category: "Operations",
    readingMinutes: 8,
    publishedAt: "2026-05-12",
    author: { name: "Sarah Jenkins", role: "VP Growth, EmailsLy", initials: "SJ" },
    cover: { eyebrow: "RevOps", kicker: "Reclaim your pipeline in a weekend." },
    content: [
      {
        type: "p",
        text: "You don't need a new CRM. You need CRM data hygiene — six small automations that run every night while your team sleeps and quietly delete the reasons your outbound conversion keeps sliding. Every B2B team we've audited has bad CRM data slowing them down in the same six places; the fix is boring, cheap, and can ship in a weekend.",
      },
      { type: "h2", text: "What is CRM data hygiene?" },
      {
        type: "p",
        text: "CRM data hygiene is the ongoing practice of keeping contact, account, and pipeline records accurate, complete, and deduplicated. It covers CRM data cleansing (removing bad records), enrichment (filling in what's missing), and validation (catching errors as they enter). Done well, it saves the average 10-person SDR team 6–8 hours per week of manual list work — and stops sequences from firing at bounced or duplicate contacts.",
      },
      { type: "h3", text: "Why does bad CRM data hurt so much?" },
      {
        type: "p",
        text: "B2B contact data decays at roughly 22–30% per year — people change jobs, companies get acquired, emails get retired. A CRM with no hygiene automations is 30% wrong within twelve months of the last clean-up. That drives bounce rates, distorts pipeline reporting, and burns SDR time on ghost accounts.",
      },
      { type: "h2", text: "The six CRM hygiene automations to ship this quarter" },
      {
        type: "p",
        text: "Each of these can be built in your CRM's native workflow tool or in an off-the-shelf automation platform. None require engineering. Ship them one per week, measure the change in bounce rate and sequence conversion, then move on.",
      },
      {
        type: "ol",
        items: [
          "Bounce detected → auto-archive the contact and flag the parent account for re-verification",
          "Job change detected → move contact to a nurture list and open a new-contact task on the old account",
          "No activity in 90 days → downgrade lifecycle stage and remove from active sequences",
          "Duplicate detected → merge on primary email match, keep the most recent activity trail",
          "Missing enrichment → queue the contact for the nightly enrichment job with a 24-hour SLA",
          "Owner inactive for 30 days → reassign the account to the pool queue automatically",
        ],
      },
      { type: "h2", text: "How to clean marketing data at scale" },
      {
        type: "p",
        text: "For CRMs above 50,000 contacts, one-off CRM cleanup projects almost never finish. The only sustainable pattern is continuous data cleansing: a nightly batch job that runs the six rules above, plus a monthly re-verification pass on any record older than 90 days. Combined, they hold the error rate under 5% indefinitely.",
      },
      { type: "h3", text: "How do AI agents improve CRM data hygiene?" },
      {
        type: "p",
        text: "The 2026 wave of CRM AI agents shines on the fuzzy parts of hygiene: identifying near-duplicates that string matching misses, inferring seniority from job titles, and normalizing company names. Use them as the second pass after your deterministic rules, not the first — deterministic wins on speed, AI wins on judgement.",
      },
      {
        type: "callout",
        title: "Compounding wins",
        text: "None of these CRM hygiene automations are glamorous, but together they save the average 10-person SDR team 6–8 hours per week and cut bounce rates by roughly half within a quarter.",
      },
    ],
  },
  {
    slug: "technographic-targeting-guide",
    title: "Technographic Targeting: How to Find High-Intent B2B Prospects by Their Tech Stack",
    excerpt:
      "A practical guide to technographic data for B2B targeting. Learn how to use technographics — the software prospects already use — to prioritize outreach, reduce wasted emails, and increase conversion rates.",
    category: "Strategy",
    readingMinutes: 8,
    publishedAt: "2026-07-18",
    author: { name: "Elena Rodriguez", role: "Head of Data, EmailsLy", initials: "ER" },
    cover: { eyebrow: "Technographics", kicker: "Target prospects by the tools they already use." },
    content: [
      {
        type: "p",
        text: "Firmographics tell you what a company looks like. Technographics tell you what a company actually does. And in 2026, what a company does — the software stack it pays for, integrates with, and depends on — is the strongest signal of whether it will buy from you next. This guide explains how to use technographic data for B2B targeting so you stop spraying sequences at lookalike accounts and start conversations with prospects who already think like your customers.",
      },
      {
        type: "p",
        text: "Every example below comes from EmailsLy's enrichment desk, where we append technographic signals to millions of B2B records each month. If you're building an outbound motion around HubSpot, AWS, Shopify, Salesforce, or any other platform-specific use case, this is the playbook.",
      },
      { type: "h2", text: "What is technographic data for B2B targeting?" },
      {
        type: "p",
        text: "Technographic data is the set of technologies a company uses to run its business: its CRM, marketing automation platform, cloud infrastructure, e-commerce stack, analytics tools, HR systems, and even the widgets on its website. For B2B targeting, technographics turn a static account list into a live map of buying intent. A prospect running HubSpot but no sales engagement tool is a different conversation than the same prospect running neither — even if both have identical employee counts, industries, and locations.",
      },
      {
        type: "p",
        text: "The best technographic data platforms for B2B targeting combine three layers: detected web technologies (from site crawling), declared install data (from integrations and job postings), and inferred signals (from hiring patterns and partner ecosystems). No single source is perfect, but layered together they give you a clear picture of a prospect's current tooling and the gaps your product can fill.",
      },
      { type: "h2", text: "Why technographic targeting converts better than firmographics alone" },
      {
        type: "p",
        text: "Firmographics answer 'who are they?' Technographics answer 'are they ready for us?' That difference shows up in the numbers. In EmailsLy's outbound benchmarks, campaigns segmented by at least one technographic signal average 2.3× higher reply rates than campaigns segmented by firmographics alone. The reason is simple: technographics reveal pain points, budget, and implementation maturity that demographics hide.",
      },
      {
        type: "ul",
        items: [
          "A company using Segment but no product analytics tool is likely investing in data infrastructure — and may need a warehouse or BI layer.",
          "A Shopify Plus store with no reviews app is probably leaving conversion rate on the table — a perfect opening for a CRO agency.",
          "A Salesforce org hiring three RevOps roles in one quarter is actively fixing its go-to-market stack — timing matters more than title.",
        ],
      },
      {
        type: "p",
        text: "Technographic targeting also reduces wasted outreach. When you know a prospect's existing stack, you can disqualify accounts that are locked into a direct competitor, already over-tooling in your category, or running infrastructure incompatible with your onboarding. Fewer bad-fit emails means better domain reputation, higher reply rates, and cleaner pipeline reporting.",
      },
      { type: "h2", text: "How to use technographic data to prioritize outbound prospecting targets" },
      {
        type: "p",
        text: "Technographic segmentation works best as a scoring layer on top of your ICP, not a replacement for it. Start with your ideal customer profile, then add technographic signals as positive or negative weights. Here is the four-step model we use with EmailsLy customers:",
      },
      {
        type: "ol",
        items: [
          "Identify the anchor technology — the platform your product sits next to, replaces, or integrates with (e.g., HubSpot, AWS, Shopify, Salesforce).",
          "Map the maturity curve — distinguish between prospects evaluating the anchor tool, newly adopted it, or outgrowing it.",
          "Layer complementary and competitive signals — find companies using tools in your ecosystem but missing the piece you sell.",
          "Score by recency — technographic data decays; a signal detected last week is worth more than one detected six months ago.",
        ],
      },
      {
        type: "p",
        text: "Run this model against your target account list and sort by total score. The top 20% of accounts will usually produce 60% of your qualified pipeline. That is the entire argument for technographic targeting: sharper prioritization, fewer emails, better meetings.",
      },
      { type: "h2", text: "Technographic segmentation examples that work in practice" },
      {
        type: "p",
        text: "The most effective B2B technographic segments are specific enough to write a single personalized email to. Here are three real examples from EmailsLy customer campaigns:",
      },
      {
        type: "h3",
        text: "How do I target companies using HubSpot?",
      },
      {
        type: "p",
        text: "Filter for companies on HubSpot Marketing Hub Professional or Enterprise, then exclude any account already using a sales engagement platform like Outreach or Apollo. Your angle is the gap between marketing automation and sales execution — a handoff problem HubSpot-native prospects feel every quarter.",
      },
      {
        type: "h3",
        text: "How do I find AWS users who need cloud cost management?",
      },
      {
        type: "p",
        text: "Target companies with AWS in their stack, 51–500 employees, and recent engineering hires in infrastructure or FinOps. Growth-stage AWS bills tend to outrun visibility, and new infrastructure headcount is a reliable signal that someone is now accountable for the spend.",
      },
      {
        type: "h3",
        text: "How do I use Shopify data for e-commerce lead generation?",
      },
      {
        type: "p",
        text: "Segment Shopify Plus stores by the apps they do not have. A store without an email pop-up tool, a reviews app, or a subscription platform is telling you exactly where it is under-optimized. Lead with the missing piece, not a generic 'we help e-commerce brands grow' pitch.",
      },
      { type: "h2", text: "Where to get reliable technographic data" },
      {
        type: "p",
        text: "The fastest way to add technographics to your outbound stack is to buy a list that already includes them. Building your own technographic scraper is technically possible, but keeping it accurate across millions of domains costs more in engineering and data maintenance than most teams expect. The best technographic data providers refresh their signals weekly and combine detection with verification.",
      },
      {
        type: "p",
        text: "EmailsLy includes technographic enrichment as part of every lead list. We append detected and verified technology signals alongside verified emails, job titles, and company firmographics, so your first sequence can reference the prospect's actual stack instead of guessing from their website footer. If your ICP depends on a specific platform — HubSpot, AWS, Shopify, Salesforce, or any other — we can build a technographic segment that matches it.",
      },
      { type: "h3", text: "What is the best B2B data provider for technographic insights?" },
      {
        type: "p",
        text: "The best provider depends on your use case. For platform-specific outbound, look for a provider that verifies emails and job titles alongside technographic signals, refreshes data at least monthly, and lets you filter by both 'uses' and 'does not use' specific tools. A provider that only gives you a technology list without contact data leaves you with accounts, not conversations.",
      },
      { type: "h3", text: "How accurate is technographic data?" },
      {
        type: "p",
        text: "Accuracy varies by signal source. Web-detection data is directionally correct but can miss tools behind login walls or custom subdomains. Declared and inferred signals — from integrations, job postings, and partner directories — are usually more reliable. At EmailsLy, we treat technographics as a prioritization signal, not a guarantee, and we refresh every record before it ships.",
      },
      { type: "h3", text: "Can technographic data help with account-based marketing?" },
      {
        type: "p",
        text: "Yes. ABM programs live or die on account selection, and technographic data makes that selection defensible. Instead of picking accounts because they 'feel right,' an ABM team can select accounts based on a documented stack gap, then personalize every touch around the specific technology pain that gap creates.",
      },
      {
        type: "callout",
        title: "Start with one anchor technology",
        text: "Don't try to segment by twenty tools at once. Pick one anchor technology your best customers use, build a tight list of accounts around it, and run a 200-contact test. Technographic targeting compounds when you prove the signal before you scale it.",
      },
      {
        type: "quote",
        text: "The best outbound teams don't guess who is ready to buy. They read the tech stack and start the conversation already knowing the gap.",
        cite: "EmailsLy data team",
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
