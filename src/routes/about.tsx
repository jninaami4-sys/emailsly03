import { createFileRoute, Link } from "@tanstack/react-router";
import { ogImageMeta } from "@/lib/og-images";
import ogAboutPng from "@/assets/og-about.png";
import { SiteShell } from "@/components/site/SiteShell";
import {
  PremiumShieldCheck,
  PremiumTimer,
  PremiumTarget,
  PremiumGlobe,
  PremiumDatabase,
  PremiumSparkles,
} from "@/components/site/PremiumIcons";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About EmailsLy — Verified B2B Lead Data Platform" },
      {
        name: "description",
        content:
          "Emailsly helps outbound sales teams, agencies, and founders find verified B2B leads from Apollo, ZoomInfo, and LinkedIn — delivered in 24 hours with no subscription.",
      },
      {
        property: "og:title",
        content: "About EmailsLy — Verified B2B Lead Data Platform",
      },
      {
        property: "og:description",
        content:
          "100M+ contacts sourced. 99% accuracy. 24-hour delivery. Verified B2B leads from Apollo, ZoomInfo & LinkedIn — pay per lead, no subscription.",
      },
      { property: "og:type", content: "website" },
      ...ogImageMeta(ogAboutPng),
    ],
    links: [{ rel: "canonical", href: "/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About EmailsLy",
          url: "/about",
          mainEntity: {
            "@type": "Organization",
            name: "EmailsLy",
            description:
              "B2B lead intelligence platform delivering verified contact data from Apollo, ZoomInfo, and LinkedIn.",
            slogan: "Verified B2B leads, delivered.",
            areaServed: "Worldwide",
            makesOffer: {
              "@type": "Offer",
              category: "B2B Lead Data",
              description: "Pay-per-lead verified B2B contact data with 24-hour delivery.",
            },
          },
          about: [
            {
              "@type": "QuantitativeValue",
              name: "Contacts sourced",
              value: "100000000+",
              description: "100M+ verified B2B contacts sourced",
            },
            {
              "@type": "QuantitativeValue",
              name: "Data accuracy rate",
              value: "99",
              unitText: "PERCENT",
            },
            {
              "@type": "QuantitativeValue",
              name: "Average delivery time",
              value: "24",
              unitText: "HOUR",
            },
          ],
        }),
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: PremiumTarget,
    title: "Precision over volume",
    body: "We filter every list to your exact ICP — job titles, company size, industry, location, and intent signals — so you reach the right buyer, not just any inbox.",
  },
  {
    icon: PremiumShieldCheck,
    title: "Verified, compliant data",
    body: "Every record is cleaned, de-duplicated, and validated against bounce risk. We operate under GDPR/CCPA guidelines and never resell stale lists.",
  },
  {
    icon: PremiumTimer,
    title: "24-hour delivery",
    body: "Most custom orders are delivered within one business day. Larger research projects include a clear timeline and milestone updates.",
  },
  {
    icon: PremiumGlobe,
    title: "Global coverage",
    body: "From North America and Europe to APAC and LATAM, we source decision-maker contacts across 100+ countries and 50+ industries.",
  },
];

const stats = [
  { value: "99%", label: "Data accuracy rate" },
  { value: "24h", label: "Average delivery" },
  { value: "100M+", label: "Contacts sourced" },
  { value: "0", label: "Subscription required" },
];

function AboutPage() {
  return (
    <SiteShell>
      <div className="theme-midnight bg-background text-foreground">
        {/* HERO */}
        <section className="relative overflow-hidden px-6 pt-20 pb-16 lg:pt-28 lg:pb-24">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-[-10%] size-[900px] -translate-x-1/2 rounded-full bg-indigo/20 blur-[150px]" />
            <div className="absolute right-[-10%] top-[30%] size-[500px] rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent" />
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 backdrop-blur">
                <PremiumSparkles className="size-4 text-primary" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/80">
                  About EmailsLy
                </span>
              </div>

              <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
                We turn raw data into
                <br />
                <span className="text-primary">revenue-ready leads</span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                EmailsLy is a B2B lead intelligence platform built for modern outbound teams. We source, verify, and deliver business contact data from Apollo, ZoomInfo, and LinkedIn — so you can spend less time hunting and more time closing.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_rgba(59,130,246,0.25)] transition hover:shadow-[0_0_32px_rgba(59,130,246,0.35)]"
                >
                  View pricing
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-white/[0.08]"
                >
                  Talk to sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT WE DO */}
        <section className="px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  Done-for-you data + ready-to-buy lists
                </h2>
                <p className="mt-4 text-muted-foreground">
                  We sell two things: custom lead research built to your exact filters, and pre-built industry lists you can download instantly after payment. No subscriptions, no monthly minimums — just clean data when you need it.
                </p>

                <ul className="mt-8 space-y-4">
                  {[
                    "Custom ICP research with verified emails, direct dials, and firmographics",
                    "Prebuilt downloadable lists for SaaS, e-commerce, agencies, and executives",
                    "CSV delivery formatted for immediate CRM or cold-email import",
                    "Transparent per-lead pricing with live order preview",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald/15 text-emerald">
                        <svg viewBox="0 0 24 24" fill="none" className="size-3.5" stroke="currentColor" strokeWidth="3">
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      </span>
                      <span className="text-sm text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative rounded-2xl border border-border bg-card/60 p-8 backdrop-blur">
                <div className="absolute -left-4 -top-4 size-32 rounded-full bg-primary/10 blur-[60px]" />
                <div className="relative grid gap-6 sm:grid-cols-2">
                  {[
                    { label: "Sourced from", value: "Apollo, ZoomInfo, LinkedIn" },
                    { label: "Delivery format", value: "Clean CSV" },
                    { label: "Typical accuracy", value: "99%" },
                    { label: "Average turnaround", value: "24 hours" },
                    { label: "Pricing model", value: "Pay per lead" },
                    { label: "Compliance", value: "GDPR / CCPA ready" },
                  ].map((row) => (
                    <div key={row.label} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{row.label}</p>
                      <p className="mt-1 font-display text-lg font-semibold text-foreground">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="border-y border-border/40 bg-surface/30 px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-2xl">
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Built for teams that hate bad data
              </h2>
              <p className="mt-4 text-muted-foreground">
                Cheap lead lists waste money and burn domains. We built EmailsLy to fix the three biggest outbound problems: stale contacts, wrong personas, and slow fulfillment.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-border bg-card/60 p-6 backdrop-blur transition hover:border-primary/30 hover:bg-card"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 rounded-3xl border border-border bg-card/40 p-8 backdrop-blur md:grid-cols-4 md:p-12">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-4xl font-extrabold text-primary md:text-5xl">{stat.value}</p>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="px-6 pb-16 lg:pb-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <PremiumShieldCheck className="size-4 text-emerald" />
                GDPR Compliant
              </span>
              <span className="hidden h-4 w-px bg-white/10 sm:inline" />
              <span className="flex items-center gap-1.5">
                <PremiumDatabase className="size-4 text-primary" />
                99% Accuracy
              </span>
              <span className="hidden h-4 w-px bg-white/10 sm:inline" />
              <span className="flex items-center gap-1.5">
                <PremiumTimer className="size-4 text-amber" />
                24h Delivery
              </span>
            </div>
          </div>
        </section>

        {/* LINKEDIN CTA */}
        <section className="px-6 pb-20 lg:pb-28">
          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-card p-8 text-center md:p-14">
              <div className="pointer-events-none absolute left-1/2 top-0 size-[500px] -translate-x-1/2 rounded-full bg-primary/15 blur-[100px]" />
              <div className="relative">
                <h2 className="font-display text-2xl font-bold text-foreground md:text-4xl">
                  Ready to fuel your outbound pipeline?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                  Join sales teams, agencies, and founders who use EmailsLy to find verified decision-makers without the subscription overhead.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/pricing"
                    className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_0_28px_rgba(59,130,246,0.25)] transition hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]"
                  >
                    Get 50 free leads
                  </Link>
                  <a
                    href="https://www.linkedin.com/sharing/share-offsite/?url=https://id-preview--32240cf7-2352-4658-a0f4-a49112cc6df3.lovable.app/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-bold text-foreground backdrop-blur transition hover:bg-white/[0.08]"
                  >
                    Share on LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
