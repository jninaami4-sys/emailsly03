import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote, Play, Pause, BadgeCheck } from "lucide-react";
import amineVideo from "@/assets/amine-italy.mp4.asset.json";
import aminePoster from "@/assets/amine-poster.jpg.asset.json";

// --- Types ---
type Testimonial = {
  text: string;
  image: string;
  name: string;
  role: string;
};

type VideoTestimonial = {
  name: string;
  role: string;
  company: string;
  poster: string;
  src: string;
  quote: string;
  verified?: boolean;
  country?: string;
  flag?: string;
};

// --- Data ---
const LOGOS = ["Northwind", "Acme", "Helios", "Prisma", "Loomly", "Vortex", "Signal", "Kepler"];

const testimonials: Testimonial[] = [
  {
    text: "We booked 42 qualified demos in the first three weeks. The data was cleaner than anything we've ever pulled from Apollo directly.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Sarah Chen",
    role: "VP Growth, Northwind",
  },
  {
    text: "Delivered in 18 hours. Bounce rate under 2%. LyraData is now our default outbound engine — we cancelled two other tools.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Marcus Rivera",
    role: "Founder, Helios Labs",
  },
  {
    text: "The mobile numbers actually connect. Our SDR team's connect rate jumped from 4% to 19% in a month. Wild ROI.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Priya Anand",
    role: "Head of SDRs, Loomly",
  },
  {
    text: "Seamless integration with our CRM. Enriched 12k accounts overnight — no manual cleanup needed.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Omar Raza",
    role: "CEO, Vortex",
  },
  {
    text: "Robust filters and blazing-fast turnaround transformed our workflow. We ship campaigns twice as fast.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Zainab Hussain",
    role: "Project Manager, Prisma",
  },
  {
    text: "The onboarding exceeded expectations. Streamlined processes and improved outbound performance across every pod.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Aliza Khan",
    role: "Business Analyst, Signal",
  },
  {
    text: "User-friendly, precise data, and glowing feedback from our reps. Best outbound data investment this year.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Farhan Siddiqui",
    role: "Marketing Director, Kepler",
  },
  {
    text: "They understood our niche ICP and delivered a solution that outperformed three vendors we tested prior.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Sana Sheikh",
    role: "Sales Manager, Acme",
  },
  {
    text: "Our reply rate doubled and pipeline coverage tripled. LyraData is the quiet engine behind our Q4 number.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Hassan Ali",
    role: "E-commerce Manager",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const videoTestimonials: VideoTestimonial[] = [
  {
    name: "Amine",
    role: "Verified client",
    company: "Apollo Leads Client",
    poster: aminePoster.url,
    src: amineVideo.url,
    quote: "",
    verified: true,
    country: "Italy",
    flag: "🇮🇹",
  },
];

// --- Scrolling Column ---
const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.ul
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 15,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="m-0 flex list-none flex-col gap-6 p-0 pb-6"
      >
        {[...new Array(2)].map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <motion.li
                key={`${index}-${i}`}
                aria-hidden={index === 1 ? "true" : "false"}
                tabIndex={index === 1 ? -1 : 0}
                whileHover={{ y: -6, scale: 1.015 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className="group w-full max-w-xs cursor-default select-none rounded-2xl border border-border bg-background p-8 shadow-sm transition-colors hover:border-violet/40 focus:outline-none focus:ring-2 focus:ring-violet/40"
              >
                <blockquote className="m-0 p-0">
                  <Quote className="mb-4 size-5 text-violet" />
                  <p className="m-0 text-sm leading-relaxed text-foreground">{text}</p>
                  <footer className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={`Avatar of ${name}`}
                      loading="lazy"
                      className="size-10 rounded-full object-cover ring-2 ring-border transition-all group-hover:ring-violet/40"
                    />
                    <div className="flex flex-col">
                      <cite className="font-display text-sm font-semibold not-italic leading-5 text-foreground">
                        {name}
                      </cite>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {role}
                      </span>
                    </div>
                  </footer>
                </blockquote>
              </motion.li>
            ))}
          </React.Fragment>
        ))}
      </motion.ul>
    </div>
  );
};

// --- Video Card ---
function VideoCard({ v }: { v: VideoTestimonial }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  return (
    <figure className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink">
        <video
          ref={ref}
          src={v.src}
          poster={v.poster}
          playsInline
          preload="metadata"
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          className="absolute inset-0 size-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Play/pause button */}
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${v.name}'s testimonial` : `Play ${v.name}'s testimonial`}
          className="absolute inset-0 grid place-items-center focus:outline-none"
        >
          <span
            className={`grid size-16 place-items-center rounded-full bg-white/95 text-violet shadow-2xl transition-all duration-300 group-hover:scale-110 ${
              playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
            }`}
          >
            {playing ? <Pause className="size-6 fill-current" /> : <Play className="size-6 translate-x-0.5 fill-current" />}
          </span>
        </button>

        {/* Bottom caption */}
        <figcaption className="absolute inset-x-0 bottom-0 p-6 text-white">
          {v.quote && (
            <p className="font-display text-lg font-semibold leading-snug">&ldquo;{v.quote}&rdquo;</p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">{v.name}</span>
                {v.verified && (
                  <BadgeCheck className="size-4 text-emerald" aria-label="Verified client" />
                )}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/70">
                {v.role} · {v.flag} {v.country} · {v.company}
              </div>
            </div>
            <div className="flex gap-0.5 text-coral">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3 fill-current" />
              ))}
            </div>
          </div>
        </figcaption>
      </div>
    </figure>
  );
}

// --- Main exported component ---
export function Testimonials() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden border-t border-border bg-card px-6 py-24"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[900px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,var(--violet-soft),transparent_70%)] opacity-60" />

      <div className="mx-auto max-w-7xl">
        {/* Logo wall */}
        <div className="mb-20 text-center">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Trusted by 1,200+ revenue teams
          </p>
          <div className="mt-6 grid grid-cols-2 items-center gap-6 opacity-70 sm:grid-cols-4 md:grid-cols-8">
            {LOGOS.map((l) => (
              <div
                key={l}
                className="font-display text-lg font-bold tracking-tight text-muted-foreground grayscale transition hover:text-foreground hover:grayscale-0"
              >
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="mx-auto mb-16 flex max-w-2xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft px-3 py-1">
            <Star className="size-3 fill-current text-violet" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              4.9 / 5 · 380+ reviews
            </span>
          </div>
          <h2
            id="testimonials-heading"
            className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl"
          >
            Loved by growth teams that ship
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Watch a verified client explain how LyraData powers their outbound.
          </p>
        </div>

        {/* Video testimonials */}
        <div className="mx-auto mb-20 grid max-w-md gap-6">
          {videoTestimonials.map((v) => (
            <VideoCard key={v.name} v={v} />
          ))}
        </div>

        {/* Divider */}
        <div className="mx-auto mb-12 flex max-w-xl items-center gap-4 text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
            More from our customers
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {/* Scrolling columns */}
        <div
          className="flex max-h-[720px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]"
          role="region"
          aria-label="Scrolling customer testimonials"
        >
          <TestimonialsColumn testimonials={firstColumn} duration={20} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={26} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={22} />
        </div>
      </div>
    </section>
  );
}
