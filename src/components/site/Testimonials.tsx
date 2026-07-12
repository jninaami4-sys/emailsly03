import { Star, Quote } from "lucide-react";

const LOGOS = ["Northwind", "Acme", "Helios", "Prisma", "Loomly", "Vortex", "Signal", "Kepler"];

const REVIEWS = [
  {
    name: "Sarah Chen",
    role: "VP Growth, Northwind",
    quote:
      "We booked 42 qualified demos in the first three weeks. The data was cleaner than anything we've ever pulled from Apollo directly.",
    rating: 5,
    color: "violet" as const,
  },
  {
    name: "Marcus Rivera",
    role: "Founder, Helios Labs",
    quote:
      "Delivered in 18 hours. Bounce rate under 2%. LyraData is now our default outbound engine — we cancelled two other tools.",
    rating: 5,
    color: "coral" as const,
  },
  {
    name: "Priya Anand",
    role: "Head of SDRs, Loomly",
    quote:
      "The mobile numbers actually connect. Our SDR team's connect rate jumped from 4% to 19% in a month. Wild ROI.",
    rating: 5,
    color: "emerald" as const,
  },
];

const chip: Record<"violet" | "coral" | "emerald", string> = {
  violet: "bg-violet-soft text-violet",
  coral: "bg-coral-soft text-coral",
  emerald: "bg-emerald-soft text-emerald",
};

export function Testimonials() {
  return (
    <section className="border-t border-border bg-card px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Logo wall */}
        <div className="mb-16 text-center">
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

        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-soft px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald">
              <Star className="size-3 fill-current" /> 4.9 / 5 · 380+ reviews
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold lg:text-4xl">
              Growth teams that ship faster with LyraData
            </h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure
              key={r.name}
              className="group relative flex flex-col rounded-2xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <Quote className={`mb-4 size-6 ${chip[r.color].split(" ")[1]}`} />
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
                &ldquo;{r.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <div className={`grid size-10 place-items-center rounded-full font-mono text-sm font-bold ${chip[r.color]}`}>
                  {r.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="text-sm font-semibold">{r.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {r.role}
                  </div>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="size-3 fill-coral text-coral" />
                  ))}
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
