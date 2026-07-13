import { Link } from "@tanstack/react-router";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

import {
  PremiumArrowUpRight,
  PremiumSparkles,
  PremiumTarget,
  PremiumGlobe,
  PremiumLayers,
  PremiumShieldCheck,
  PremiumZap,
} from "@/components/site/PremiumIcons";

type Service = {
  title: string;
  tagline: string;
  href: string;
  badge: string;
  gradient: string;
  glow: string;
  Icon: React.ComponentType<{ className?: string }>;
  bullets: string[];
};

const services: Service[] = [
  {
    title: "Apollo Leads Export",
    tagline: "Fresh, filtered exports pulled straight from Apollo — cleaned & CRM-ready.",
    href: "/apollo-leads-export",
    badge: "Most popular",
    gradient: "from-[#4f46e5] via-[#6366f1] to-[#8b5cf6]",
    glow: "shadow-[0_30px_80px_-20px_rgba(99,102,241,0.55)]",
    Icon: PremiumZap,
    bullets: ["Verified emails", "Any ICP filter", "24h delivery"],
  },
  {
    title: "LinkedIn Sales Navigator",
    tagline: "Sales Nav searches converted into enriched, contact-ready spreadsheets.",
    href: "/linkedin-sales-navigator-leads",
    badge: "Enriched",
    gradient: "from-[#0a66c2] via-[#3b82f6] to-[#6366f1]",
    glow: "shadow-[0_30px_80px_-20px_rgba(59,130,246,0.55)]",
    Icon: PremiumTarget,
    bullets: ["Sales Nav URLs", "Title + seniority", "Email enrichment"],
  },
  {
    title: "ZoomInfo Leads",
    tagline: "Enterprise-grade ZoomInfo pulls — mapped to your CRM schema.",
    href: "/zoominfo-leads",
    badge: "Enterprise",
    gradient: "from-[#f97316] via-[#fb923c] to-[#fbbf24]",
    glow: "shadow-[0_30px_80px_-20px_rgba(251,146,60,0.55)]",
    Icon: PremiumGlobe,
    bullets: ["Direct dials", "Tech stack", "Firmographics"],
  },
  {
    title: "Manual Lead Research",
    tagline: "100% human-verified prospecting for complex, high-value ICPs.",
    href: "/manual-lead-research",
    badge: "Human-verified",
    gradient: "from-[#10b981] via-[#14b8a6] to-[#0ea5e9]",
    glow: "shadow-[0_30px_80px_-20px_rgba(16,185,129,0.5)]",
    Icon: PremiumShieldCheck,
    bullets: ["1-by-1 vetted", "Niche ICPs", "0% bounce"],
  },
  {
    title: "Website Design",
    tagline: "Conversion-focused landing pages built for outbound campaigns.",
    href: "/website-design",
    badge: "New",
    gradient: "from-[#ec4899] via-[#f43f5e] to-[#f97316]",
    glow: "shadow-[0_30px_80px_-20px_rgba(244,63,94,0.5)]",
    Icon: PremiumLayers,
    bullets: ["Figma → live", "Mobile-first", "SEO baked-in"],
  },
];

export function ServicesCarousel() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 px-4 py-24 sm:px-6">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo/10 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 backdrop-blur">
            <PremiumSparkles className="size-3.5 text-indigo" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/80">
              Our services
            </span>
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold lg:text-5xl">
            Everything you need to
            <span className="ml-2 bg-gradient-to-r from-indigo via-violet to-coral bg-clip-text text-transparent">
              scale outbound.
            </span>
          </h2>
          <p className="mt-4 text-foreground/60">
            Swipe through the full stack — from Apollo exports to hand-crafted landing pages.
          </p>
        </div>

        <div className="services-swiper-wrapper">
          <Swiper
            effect="coverflow"
            grabCursor
            centeredSlides
            loop
            slidesPerView="auto"
            autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
            coverflowEffect={{ rotate: 30, stretch: 0, depth: 140, modifier: 1.6, slideShadows: false }}
            pagination={{ clickable: true }}
            modules={[EffectCoverflow, Autoplay, Pagination]}
            className="!pb-14"
          >
            {services.map((s) => (
              <SwiperSlide key={s.title} className="!w-[300px] sm:!w-[360px] md:!w-[420px]">
                <Link
                  to={s.href}
                  className={`group relative block h-[440px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${s.gradient} p-7 text-white transition-transform hover:-translate-y-1 ${s.glow}`}
                >
                  {/* Grid overlay */}
                  <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
                  <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/20 blur-3xl" />

                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between">
                      <div className="grid size-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                        <s.Icon className="size-6" />
                      </div>
                      <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest backdrop-blur">
                        {s.badge}
                      </span>
                    </div>

                    <div className="mt-auto">
                      <h3 className="font-display text-2xl font-bold leading-tight md:text-3xl">
                        {s.title}
                      </h3>
                      <p className="mt-3 text-sm text-white/85">{s.tagline}</p>

                      <ul className="mt-5 flex flex-wrap gap-2">
                        {s.bullets.map((b) => (
                          <li
                            key={b}
                            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider backdrop-blur"
                          >
                            {b}
                          </li>
                        ))}
                      </ul>

                      <span className="mt-6 inline-flex items-center gap-1.5 font-semibold">
                        Explore service
                        <PremiumArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
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
          width: 24px;
          border-radius: 999px;
        }
      `}</style>
    </section>
  );
}
