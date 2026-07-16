import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, FreeMode, Mousewheel, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/free-mode";
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
  const [isMobile, setIsMobile] = useState(false);
  const [debug, setDebug] = useState(false);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [overflowCount, setOverflowCount] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Toggle: ?debug-carousel=1, localStorage flag, or Alt+Shift+D
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("debug-carousel") === "1" || localStorage.getItem("debug-carousel") === "1") {
        setDebug(true);
      }
    } catch { /* ignore */ }
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        setDebug((v) => {
          const next = !v;
          try { localStorage.setItem("debug-carousel", next ? "1" : "0"); } catch { /* ignore */ }
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Scan slides for clipping/overflow while debug is on
  useEffect(() => {
    if (!debug) return;
    const scan = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      const slides = document.querySelectorAll<HTMLElement>(".services-swiper .swiper-slide");
      let count = 0;
      slides.forEach((slide) => {
        slide.removeAttribute("data-overflow");
        const inner = slide.firstElementChild as HTMLElement | null;
        if (!inner) return;
        const overflowsX = inner.scrollWidth - inner.clientWidth > 1;
        const overflowsY = inner.scrollHeight - inner.clientHeight > 1;
        const rect = slide.getBoundingClientRect();
        const offViewport = rect.right > window.innerWidth + 1 || rect.left < -1;
        if (overflowsX || overflowsY || offViewport) {
          slide.setAttribute(
            "data-overflow",
            [overflowsX && "x", overflowsY && "y", offViewport && "viewport"].filter(Boolean).join(","),
          );
          count += 1;
        }
      });
      setOverflowCount(count);
    };
    scan();
    const ro = new ResizeObserver(scan);
    ro.observe(document.body);
    window.addEventListener("resize", scan);
    const interval = window.setInterval(scan, 800);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", scan);
      window.clearInterval(interval);
    };
  }, [debug]);

  const bp = viewport.w >= 1024 ? "lg" : viewport.w >= 768 ? "md" : viewport.w >= 640 ? "sm" : "xs";

  return (
    <section
      className={`relative overflow-hidden border-t border-white/10 px-4 py-24 sm:px-6 ${debug ? "carousel-debug" : ""}`}
    >
      {debug && (
        <div className="pointer-events-auto fixed bottom-4 right-4 z-[9999] w-64 rounded-2xl border border-white/20 bg-black/85 p-3 font-mono text-[11px] text-white shadow-2xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-bold uppercase tracking-widest text-emerald-400">Carousel debug</span>
            <button
              type="button"
              onClick={() => {
                setDebug(false);
                try { localStorage.setItem("debug-carousel", "0"); } catch { /* ignore */ }
              }}
              className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] hover:bg-white/20"
            >
              ×
            </button>
          </div>
          <ul className="space-y-1">
            <li>viewport: <span className="text-emerald-300">{viewport.w}×{viewport.h}</span></li>
            <li>breakpoint: <span className="text-emerald-300">{bp}</span></li>
            <li>
              clipped/overflowing:{" "}
              <span className={overflowCount > 0 ? "text-red-400" : "text-emerald-300"}>{overflowCount}</span>
            </li>
          </ul>
          <p className="mt-2 text-[10px] leading-snug text-white/60">
            Slides with issues are outlined in red with an X/Y/viewport tag. Alt+Shift+D to toggle.
          </p>
        </div>
      )}

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
            key={isMobile ? "mobile" : "desktop"}
            effect={isMobile ? "slide" : "coverflow"}
            grabCursor
            centeredSlides
            loop
            slidesPerView="auto"
            spaceBetween={isMobile ? 16 : 0}
            speed={isMobile ? 500 : 600}
            resistanceRatio={0.72}
            touchReleaseOnEdges
            threshold={4}
            touchAngle={40}
            touchRatio={1.35}
            longSwipesRatio={0.18}
            longSwipesMs={200}
            followFinger
            freeMode={
              isMobile
                ? {
                    enabled: true,
                    momentum: true,
                    momentumRatio: 0.85,
                    momentumVelocityRatio: 0.9,
                    momentumBounce: true,
                    momentumBounceRatio: 0.6,
                    minimumVelocity: 0.02,
                    sticky: true,
                  }
                : false
            }
            mousewheel={{ forceToAxis: true, sensitivity: 0.6, thresholdDelta: 12 }}
            autoplay={{ delay: 3200, disableOnInteraction: false, pauseOnMouseEnter: true }}
            coverflowEffect={{ rotate: 22, stretch: 0, depth: 140, modifier: 1.1, slideShadows: false }}
            pagination={{ clickable: true, dynamicBullets: isMobile }}
            modules={[EffectCoverflow, Autoplay, Pagination, FreeMode, Mousewheel]}
            className="!pb-16 services-swiper"
          >

            {services.map((s) => (
              <SwiperSlide key={s.serviceId} className="!w-[86vw] max-[380px]:!w-[92vw] !h-auto sm:!w-[340px] md:!w-[400px] lg:!w-[420px]" style={{ maxWidth: "420px" }}>
                <button
                  type="button"
                  onClick={() => openOrderDrawer(s.serviceId)}
                  className={`group relative block w-full overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${s.gradient} p-5 text-left text-white transition-all duration-500 hover:-translate-y-1.5 sm:p-6 md:p-7 ${s.glow} ${s.ring}`}
                >
                  {/* Sheen */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/[0.08]" />
                  <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:36px_36px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
                  <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-white/25 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 -left-16 size-52 rounded-full bg-black/40 blur-3xl" />

                  <div className="relative flex flex-col gap-4 sm:gap-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15 shadow-inner shadow-white/10 backdrop-blur sm:size-14">
                        <s.Icon className="size-5 text-white sm:size-7" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest backdrop-blur sm:px-2.5 sm:text-[10px]">
                        <span className="size-1.5 rounded-full bg-white" />
                        {s.badge}
                      </span>
                    </div>

                    {/* Price ribbon */}
                    {s.tiers ? (
                      <div className="space-y-1.5">
                        {s.tiers.map((tier) => (
                          <div
                            key={tier.qty}
                            className="flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1.5 backdrop-blur sm:px-3"
                          >
                            <div className="flex min-w-0 items-baseline gap-2">
                              <span className="font-display text-lg font-bold tracking-tight sm:text-xl">{tier.price}</span>
                              <span className={`truncate font-mono text-[9px] font-bold uppercase tracking-widest sm:text-[10px] ${s.accent}`}>
                                {tier.qty} {s.unit}
                              </span>
                            </div>
                            <span className="shrink-0 font-mono text-[9px] font-semibold text-white/80 sm:text-[10px]">{tier.unitRate}/ea</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                          {s.price}
                        </span>
                        <span className={`font-mono text-[10px] font-bold uppercase tracking-widest sm:text-[11px] ${s.accent}`}>
                          {s.perUnit}
                        </span>
                      </div>
                    )}

                    <div>
                      <h3 className="font-display text-xl font-bold leading-tight sm:text-2xl md:text-[28px]">
                        {s.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-white/85 sm:text-sm">{s.tagline}</p>

                      {/* Meta strip */}
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/15 bg-black/20 p-2.5 backdrop-blur sm:p-3">
                        <div className="min-w-0">
                          <div className={`font-mono text-[9px] font-bold uppercase tracking-widest ${s.accent}`}>
                            Min order
                          </div>
                          <div className="mt-0.5 truncate text-[13px] font-semibold sm:text-sm">{s.minOrder}</div>
                        </div>
                        <div className="min-w-0">
                          <div className={`font-mono text-[9px] font-bold uppercase tracking-widest ${s.accent}`}>
                            Turnaround
                          </div>
                          <div className="mt-0.5 truncate text-[13px] font-semibold sm:text-sm">{s.turnaround}</div>
                        </div>
                      </div>

                      {/* Bullets */}
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {s.bullets.map((b) => (
                          <li
                            key={b}
                            className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider backdrop-blur sm:px-2.5 sm:py-1 sm:text-[10px]"
                          >
                            {b}
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 sm:mt-5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black shadow-lg shadow-black/20 transition-transform group-hover:translate-x-0.5 sm:px-4 sm:py-2 sm:text-sm">
                          Explore service
                          <PremiumArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:size-4" />
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
        .services-swiper {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
        }
        .services-swiper .swiper-wrapper {
          transition-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
          will-change: transform;
        }
        .services-swiper .swiper-slide {
          touch-action: pan-y;
          transform: translate3d(0, 0, 0);
        }
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
