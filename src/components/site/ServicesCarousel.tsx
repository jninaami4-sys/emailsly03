import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

import { openOrderDrawer } from "@/components/site/OrderDrawer";
import {
  PremiumArrowUpRight,
  PremiumSparkles,
  PremiumTarget,
  PremiumGlobe,
  PremiumLayers,
  PremiumShieldCheck,
  PremiumDatabase,
  PremiumFileText,
} from "@/components/site/PremiumIcons";

type Service = {
  serviceId: string;
  title: string;
  tagline: string;
  badge: string;
  price: string;
  perUnit: string;
  unit?: string;
  minOrder: string;
  turnaround: string;
  gradient: string;
  glow: string;
  ring: string;
  accent: string;
  Icon: React.ComponentType<{ className?: string }>;
  bullets: string[];
  tiers?: { qty: string; price: string; unitRate: string }[];
};

const services: Service[] = [
  {
    serviceId: "apollo",
    title: "Apollo B2B Data",
    tagline: "Fresh, filtered Apollo exports — cleaned, deduped, CRM-ready.",
    badge: "Most popular",
    price: "$0.0035",
    perUnit: "per lead",
    minOrder: "5,000 min",
    turnaround: "≤24h",
    gradient: "from-[#4338ca] via-[#6366f1] to-[#8b5cf6]",
    glow: "shadow-[0_40px_100px_-25px_rgba(99,102,241,0.7)]",
    ring: "ring-1 ring-inset ring-white/15",
    accent: "text-[#c4b5fd]",
    Icon: PremiumDatabase,
    bullets: ["Verified emails", "Any ICP filter", "Deduped"],
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
    gradient: "from-[#0a66c2] via-[#2563eb] to-[#6366f1]",
    glow: "shadow-[0_40px_100px_-25px_rgba(37,99,235,0.7)]",
    ring: "ring-1 ring-inset ring-white/15",
    accent: "text-[#93c5fd]",
    Icon: PremiumTarget,
    bullets: ["Sales Nav URLs", "Title + seniority", "~70% w/ emails"],
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
    gradient: "from-[#c2410c] via-[#f97316] to-[#fbbf24]",
    glow: "shadow-[0_40px_100px_-25px_rgba(249,115,22,0.65)]",
    ring: "ring-1 ring-inset ring-white/15",
    accent: "text-[#fed7aa]",
    Icon: PremiumDatabase,
    bullets: ["Direct dials", "Tech stack", "Firmographics"],
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
    gradient: "from-[#065f46] via-[#10b981] to-[#22d3ee]",
    glow: "shadow-[0_40px_100px_-25px_rgba(16,185,129,0.65)]",
    ring: "ring-1 ring-inset ring-white/15",
    accent: "text-[#a7f3d0]",
    Icon: PremiumShieldCheck,
    bullets: ["1-by-1 vetted", "Niche ICPs", "0% bounce"],
    tiers: [
      { qty: "100", price: "$35", unitRate: "$0.35" },
      { qty: "500", price: "$175", unitRate: "$0.35" },
      { qty: "1,000", price: "$350", unitRate: "$0.35" },
    ],
  },
  {
    serviceId: "mobile",
    title: "Mobile Number Lookup",
    tagline: "Append verified mobile numbers to your existing contact list.",
    badge: "Append",
    price: "$0.35",
    perUnit: "per record",
    unit: "records",
    minOrder: "100 min",
    turnaround: "≤24h",
    gradient: "from-[#7c2d92] via-[#a855f7] to-[#ec4899]",
    glow: "shadow-[0_40px_100px_-25px_rgba(168,85,247,0.6)]",
    ring: "ring-1 ring-inset ring-white/15",
    accent: "text-[#f5d0fe]",
    Icon: PremiumFileText,
    bullets: ["Cell-verified", "US + intl.", "CSV in / CSV out"],
    tiers: [
      { qty: "100", price: "$35", unitRate: "$0.35" },
      { qty: "500", price: "$175", unitRate: "$0.35" },
      { qty: "1,000", price: "$350", unitRate: "$0.35" },
    ],
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
    gradient: "from-[#831843] via-[#e11d48] to-[#f97316]",
    glow: "shadow-[0_40px_100px_-25px_rgba(225,29,72,0.6)]",
    ring: "ring-1 ring-inset ring-white/15",
    accent: "text-[#fecdd3]",
    Icon: PremiumLayers,
    bullets: ["Figma → live", "Mobile-first", "SEO baked-in"],
  },
];

export function ServicesCarousel() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 px-4 py-24 sm:px-6">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 size-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo/10 blur-[160px]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 backdrop-blur">
            <PremiumSparkles className="size-3.5 text-indigo" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/80">
              Our services · full stack
            </span>
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold lg:text-5xl">
            Everything you need to
            <span className="ml-2 bg-gradient-to-r from-indigo via-violet to-coral bg-clip-text text-transparent">
              scale outbound.
            </span>
          </h2>
          <p className="mt-4 text-foreground/60">
            Swipe through the full stack — tap a service to jump straight into the order builder with it preselected.
          </p>
        </div>

        <div className="services-swiper-wrapper">
          <Swiper
            effect="coverflow"
            grabCursor
            centeredSlides
            loop
            slidesPerView="auto"
            autoplay={{ delay: 2800, disableOnInteraction: false, pauseOnMouseEnter: true }}
            coverflowEffect={{ rotate: 28, stretch: 0, depth: 180, modifier: 1.4, slideShadows: false }}
            pagination={{ clickable: true }}
            modules={[EffectCoverflow, Autoplay, Pagination]}
            className="!pb-16"
          >
            {services.map((s) => (
              <SwiperSlide key={s.serviceId} className="!w-[290px] sm:!w-[360px] md:!w-[420px]">
                <button
                  type="button"
                  onClick={() => openOrderDrawer(s.serviceId)}
                  className={`group relative block h-[480px] w-full overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${s.gradient} p-7 text-left text-white transition-all duration-500 hover:-translate-y-1.5 ${s.glow} ${s.ring}`}
                >
                  {/* Sheen */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/[0.08]" />
                  <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:36px_36px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
                  <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-white/25 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 -left-16 size-52 rounded-full bg-black/40 blur-3xl" />

                  <div className="relative flex h-full flex-col">
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="grid size-14 place-items-center rounded-2xl bg-white/15 shadow-inner shadow-white/10 backdrop-blur">
                        <s.Icon className="size-7 text-white" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest backdrop-blur">
                        <span className="size-1.5 rounded-full bg-white" />
                        {s.badge}
                      </span>
                    </div>

                    {/* Price ribbon */}
                    {s.tiers ? (
                      <div className="mt-5 space-y-1.5">
                        {s.tiers.map((tier) => (
                          <div
                            key={tier.qty}
                            className="flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur"
                          >
                            <div className="flex items-baseline gap-2">
                              <span className="font-display text-xl font-bold tracking-tight">{tier.price}</span>
                              <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${s.accent}`}>
                                {tier.qty} {s.unit}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] font-semibold text-white/80">{tier.unitRate}/ea</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-6 flex items-baseline gap-2">
                        <span className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
                          {s.price}
                        </span>
                        <span className={`font-mono text-[11px] font-bold uppercase tracking-widest ${s.accent}`}>
                          {s.perUnit}
                        </span>
                      </div>
                    )}

                    <div className="mt-auto">
                      <h3 className="font-display text-2xl font-bold leading-tight md:text-[28px]">
                        {s.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/85">{s.tagline}</p>

                      {/* Meta strip */}
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/15 bg-black/20 p-3 backdrop-blur">
                        <div>
                          <div className={`font-mono text-[9px] font-bold uppercase tracking-widest ${s.accent}`}>
                            Min order
                          </div>
                          <div className="mt-0.5 text-sm font-semibold">{s.minOrder}</div>
                        </div>
                        <div>
                          <div className={`font-mono text-[9px] font-bold uppercase tracking-widest ${s.accent}`}>
                            Turnaround
                          </div>
                          <div className="mt-0.5 text-sm font-semibold">{s.turnaround}</div>
                        </div>
                      </div>

                      {/* Bullets */}
                      <ul className="mt-4 flex flex-wrap gap-1.5">
                        {s.bullets.map((b) => (
                          <li
                            key={b}
                            className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider backdrop-blur"
                          >
                            {b}
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <div className="mt-5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-black shadow-lg shadow-black/20 transition-transform group-hover:translate-x-0.5">
                          Explore service
                          <PremiumArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                        <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${s.accent}`}>
                          Order now →
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      <style>{`
        .services-swiper-wrapper .swiper-pagination-bullet {
          background: rgba(255,255,255,0.35);
          opacity: 1;
          transition: all 0.3s ease;
        }
        .services-swiper-wrapper .swiper-pagination-bullet-active {
          background: oklch(0.62 0.22 275);
          width: 28px;
          border-radius: 999px;
          box-shadow: 0 0 20px oklch(0.62 0.22 275 / 0.6);
        }
      `}</style>
    </section>
  );
}
