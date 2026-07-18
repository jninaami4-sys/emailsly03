import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, FreeMode, Mousewheel, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/free-mode";
import "swiper/css/pagination";

import { openOrderDrawer } from "@/components/site/OrderDrawer";
import {
  PremiumArrowUpRight,
  PremiumTarget,
  PremiumGlobe,
  PremiumLayers,
  PremiumShieldCheck,
  PremiumDatabase,
  PremiumFileText,
} from "@/components/site/PremiumIcons";
import { listSiteContent } from "@/lib/site-content.functions";
import {
  DEFAULT_SERVICE_CARDS,
  getServiceIcon,
  getGradientPreset,
  type EditableServiceCard,
} from "@/lib/service-icons";
import { usePricingOverrides } from "@/hooks/use-pricing-overrides";
import {
  SERVICE_CATALOG,
  formatUnitPrice,
  formatPerUnit,
  formatMinOrder,
} from "@/lib/service-catalog";



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

const FALLBACK_SERVICES: Service[] = [
  {
    serviceId: "apollo",
    title: "Apollo B2B Data",
    tagline: "Fresh, filtered Apollo exports — cleaned, deduped, CRM-ready.",
    badge: "Most popular",
    price: "$0.0035",
    perUnit: "per lead",
    minOrder: "5,000 min",
    turnaround: "≤24h",
    gradient: "from-[#1e3a8a] via-[#2563eb] to-[#418df1]",
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
    price: "$0.15",
    perUnit: "per record",
    unit: "records",
    minOrder: "100 min",
    turnaround: "≤24h",
    gradient: "from-[#0f2547] via-[#2563eb] to-[#7fb0f5]",
    glow: "shadow-[0_40px_100px_-25px_rgba(168,85,247,0.6)]",
    ring: "ring-1 ring-inset ring-white/15",
    accent: "text-[#f5d0fe]",
    Icon: PremiumFileText,
    bullets: ["Cell-verified", "US + intl.", "CSV in / CSV out"],
    tiers: [
      { qty: "100", price: "$15", unitRate: "$0.15" },
      { qty: "500", price: "$75", unitRate: "$0.15" },
      { qty: "1,000", price: "$150", unitRate: "$0.15" },
    ],
  },
  {
    serviceId: "warmup",
    title: "Mailbox Warmup + DKIM/SPF",
    tagline: "15-day inbox warmup with DKIM, SPF & DMARC setup for higher deliverability.",
    badge: "Deliverability",
    price: "$100",
    perUnit: "2 mailboxes · 15 days",
    minOrder: "2 mailboxes min",
    turnaround: "15 days",
    gradient: "from-[#134e4a] via-[#0d9488] to-[#38bdf8]",
    glow: "shadow-[0_40px_100px_-25px_rgba(13,148,136,0.65)]",
    ring: "ring-1 ring-inset ring-white/15",
    accent: "text-[#99f6e4]",
    Icon: PremiumShieldCheck,
    bullets: ["DKIM + SPF + DMARC", "Gradual send ramp", "Inbox placement"],
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

  const listFn = listSiteContent;
  const { data: siteContent } = useQuery({
    queryKey: ["site-content"],
    queryFn: () => listFn(),
    staleTime: 60_000,
  });

  const overrides = usePricingOverrides();

  const services = useMemo<Service[]>(() => {
    const raw = (siteContent as Record<string, { items?: EditableServiceCard[] } | undefined> | undefined)
      ?.service_cards?.items;
    const items: EditableServiceCard[] = Array.isArray(raw) && raw.length > 0 ? raw : DEFAULT_SERVICE_CARDS;
    const fallbackById = new Map(FALLBACK_SERVICES.map((s) => [s.serviceId, s]));
    return items
      .filter((c) => c.enabled !== false)
      .map<Service>((c) => {
        const fb = fallbackById.get(c.serviceId);
        const preset = getGradientPreset(c.gradientKey);
        const IconCmp = c.iconUrl
          ? ({ className }: { className?: string }) => (
              <img src={c.iconUrl} alt="" className={className} style={{ objectFit: "contain" }} />
            )
          : getServiceIcon(c.icon);
        // Prices ALWAYS come from the canonical catalog + admin overrides so
        // cards / order form / pricing page / invoices never drift.
        const inCatalog = c.serviceId in SERVICE_CATALOG;
        const price = inCatalog ? formatUnitPrice(c.serviceId, overrides) : c.price;
        const perUnit = inCatalog ? formatPerUnit(c.serviceId, overrides) : c.perUnit;
        const minOrder = inCatalog ? formatMinOrder(c.serviceId, overrides) : c.minOrder;
        return {
          serviceId: c.serviceId,
          title: c.title,
          tagline: c.tagline,
          badge: c.badge,
          price,
          perUnit,
          unit: c.unit ?? fb?.unit,
          minOrder,
          turnaround: c.turnaround,
          bullets: c.bullets,
          gradient: fb?.gradient ?? preset.gradient,
          glow: fb?.glow ?? "",
          ring: fb?.ring ?? "ring-1 ring-white/10",
          accent: fb?.accent ?? preset.accent,
          Icon: IconCmp,
          tiers: fb?.tiers
            ? fb.tiers.map((t) => {
                const q = Number(t.qty.replace(/[^0-9]/g, ""));
                const entry = SERVICE_CATALOG[c.serviceId];
                if (!entry || !Number.isFinite(q)) return t;
                const o = overrides.get(c.serviceId);
                const rate = o?.rate ?? entry.rate;
                return {
                  qty: t.qty,
                  price: `$${(q * rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                  unitRate: `$${rate}`,
                };
              })
            : undefined,
        };
      });
  }, [siteContent, overrides]);






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

        <div className="services-swiper-wrapper relative mx-auto">
          <Swiper
            key={isMobile ? "mobile" : "desktop"}
            effect={isMobile ? "slide" : "coverflow"}
            grabCursor
            centeredSlides
            loop
            slidesPerView="auto"
            spaceBetween={isMobile ? 16 : 0}
            speed={isMobile ? 450 : 600}
            resistanceRatio={0.6}
            threshold={5}
            touchAngle={35}
            touchRatio={1.15}
            longSwipesRatio={0.15}
            longSwipesMs={220}
            shortSwipes
            followFinger
            slideToClickedSlide
            watchSlidesProgress
            /* Snap-based navigation guarantees each release lands on a fully centered card
               (no partial visibility). FreeMode momentum is disabled because it can leave
               a card half-in / half-out of the viewport. */
            freeMode={false}
            mousewheel={{ forceToAxis: true, sensitivity: 0.6, thresholdDelta: 12 }}
            autoplay={{ delay: 3200, disableOnInteraction: false, pauseOnMouseEnter: true }}
            coverflowEffect={{ rotate: 22, stretch: 0, depth: 140, modifier: 1.1, slideShadows: false }}
            pagination={{ clickable: true, dynamicBullets: isMobile }}
            modules={[EffectCoverflow, Autoplay, Pagination, FreeMode, Mousewheel]}
            className="services-swiper !pb-20"
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
          overflow: visible;
          position: relative;
          z-index: 2;
        }
        .services-swiper-wrapper {
          isolation: isolate;
          padding-top: 8px;
        }
        .services-swiper-wrapper::before {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 4px;
          z-index: 0;
          width: min(680px, 76vw);
          height: 120px;
          transform: translateX(-50%);
          border-radius: 999px;
          background:
            radial-gradient(ellipse at center, color-mix(in oklab, var(--violet) 18%, transparent), transparent 66%),
            radial-gradient(ellipse at center, color-mix(in oklab, var(--magenta) 10%, transparent), transparent 72%);
          filter: blur(22px);
          opacity: 0.72;
          pointer-events: none;
        }
        .services-swiper-wrapper::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(90deg, var(--background), transparent 10%, transparent 90%, var(--background)),
            linear-gradient(180deg, transparent 82%, color-mix(in oklab, var(--background) 62%, transparent));
        }
        .services-swiper .swiper-wrapper {
          transition-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
          will-change: transform;
          position: relative;
          z-index: 2;
        }
        .services-swiper .swiper-slide {
          touch-action: pan-y;
          transform: translate3d(0, 0, 0);
        }
        .services-swiper-wrapper .swiper-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          left: 50% !important;
          bottom: 18px !important;
          width: auto !important;
          min-width: 128px;
          height: 26px;
          padding: 0 12px;
          transform: translateX(-50%);
          border: 1px solid color-mix(in oklab, var(--violet) 18%, var(--foreground) 5%);
          border-radius: 999px;
          background:
            radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--violet) 20%, transparent), transparent 72%),
            color-mix(in oklab, var(--background) 76%, transparent);
          box-shadow:
            inset 0 1px 0 color-mix(in oklab, var(--foreground) 10%, transparent),
            0 12px 34px color-mix(in oklab, var(--violet) 16%, transparent),
            0 18px 42px color-mix(in oklab, var(--background) 80%, transparent);
          backdrop-filter: blur(18px) saturate(1.1);
          -webkit-backdrop-filter: blur(18px) saturate(1.1);
          z-index: 6;
        }
        .services-swiper-wrapper .swiper-pagination-bullet {
          width: 6px;
          height: 6px;
          margin: 0 !important;
          background: color-mix(in oklab, var(--foreground) 34%, transparent);
          opacity: 1;
          border-radius: 999px;
          box-shadow: none;
          transform: scale(1);
          transition:
            width 0.38s cubic-bezier(0.22, 0.61, 0.36, 1),
            background 0.38s cubic-bezier(0.22, 0.61, 0.36, 1),
            box-shadow 0.38s cubic-bezier(0.22, 0.61, 0.36, 1),
            opacity 0.38s cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        .services-swiper-wrapper .swiper-pagination-bullet-active {
          width: 26px;
          height: 6px;
          background: linear-gradient(
            90deg,
            color-mix(in oklab, var(--violet) 88%, var(--foreground) 10%),
            color-mix(in oklab, var(--magenta) 78%, var(--foreground) 10%)
          );
          border-radius: 999px;
          box-shadow:
            0 0 12px color-mix(in oklab, var(--violet) 36%, transparent),
            inset 0 1px 0 color-mix(in oklab, var(--foreground) 24%, transparent);
        }
        .services-swiper-wrapper .swiper-pagination-bullet:not(.swiper-pagination-bullet-active):hover {
          background: color-mix(in oklab, var(--foreground) 38%, transparent);
        }
        .services-swiper-wrapper .swiper-pagination-bullet-active-main,
        .services-swiper-wrapper .swiper-pagination-bullet-active-prev,
        .services-swiper-wrapper .swiper-pagination-bullet-active-next {
          transform: scale(1);
        }
        /* Responsive debug mode */
        .carousel-debug .services-swiper .swiper-slide {
          outline: 1px dashed rgba(16, 185, 129, 0.7);
          outline-offset: -2px;
          position: relative;
        }
        .carousel-debug .services-swiper .swiper-slide::before {
          content: attr(class);
          position: absolute;
          top: 4px;
          left: 4px;
          z-index: 50;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(16, 185, 129, 0.85);
          color: #000;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 9px;
          font-weight: 700;
          max-width: 90%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          pointer-events: none;
        }
        .carousel-debug .services-swiper .swiper-slide[data-overflow] {
          outline: 2px solid #ef4444 !important;
          outline-offset: -2px;
          box-shadow: 0 0 0 9999px rgba(239, 68, 68, 0.06) inset;
        }
        .carousel-debug .services-swiper .swiper-slide[data-overflow]::after {
          content: "⚠ overflow: " attr(data-overflow);
          position: absolute;
          bottom: 4px;
          right: 4px;
          z-index: 50;
          padding: 2px 6px;
          border-radius: 4px;
          background: #ef4444;
          color: #fff;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 10px;
          font-weight: 700;
          pointer-events: none;
        }
      `}</style>
    </section>
  );
}
