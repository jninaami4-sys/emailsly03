import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

type Event = { id: number; who: string; where: string; what: string; qty: number; ago: string };

const POOL: Omit<Event, "id" | "ago">[] = [
  { who: "Sarah", where: "Austin, TX", what: "SaaS Founders list", qty: 5000 },
  { who: "Marcus", where: "London, UK", what: "Apollo Export", qty: 10000 },
  { who: "Priya", where: "Toronto, CA", what: "LinkedIn B2B scrape", qty: 5000 },
  { who: "Diego", where: "Madrid, ES", what: "ZoomInfo Direct Dials", qty: 1000 },
  { who: "Emma", where: "Berlin, DE", what: "Manual Research", qty: 200 },
  { who: "Kenji", where: "Tokyo, JP", what: "Ecom Decision Makers", qty: 3000 },
  { who: "Layla", where: "Dubai, AE", what: "Executive C-Suite list", qty: 2000 },
  { who: "Oliver", where: "Sydney, AU", what: "Real Estate Agents", qty: 8000 },
];

const AGO = ["just now", "1 min ago", "2 min ago", "4 min ago", "just now", "6 min ago"];

function pick<T>(a: T[]) {
  return a[Math.floor(Math.random() * a.length)];
}

export function ActivityTicker() {
  const [events, setEvents] = useState<Event[]>(() =>
    Array.from({ length: 4 }, (_, i) => ({ ...pick(POOL), id: i, ago: pick(AGO) })),
  );

  useEffect(() => {
    const iv = setInterval(() => {
      setEvents((prev) => {
        const next: Event = { ...pick(POOL), id: (prev[0]?.id ?? 0) + 1, ago: "just now" };
        return [next, ...prev].slice(0, 4);
      });
    }, 3200);
    return () => clearInterval(iv);
  }, []);

  return (
    <section className="border-y border-border bg-background px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-soft px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald opacity-75" />
                <span className="relative size-2 rounded-full bg-emerald" />
              </span>
              Live delivery feed
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold lg:text-3xl">
              Orders shipping right now
            </h2>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            <span className="text-foreground font-bold">1,247</span> orders delivered this month
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {events.map((e, i) => (
            <div
              key={e.id}
              className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all ${
                i === 0 ? "animate-fade-up border-emerald/30 shadow-sm" : ""
              }`}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-soft text-emerald">
                <CheckCircle2 className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">
                  <span className="font-semibold">{e.who}</span>
                  <span className="text-muted-foreground"> from {e.where} received </span>
                  <span className="font-semibold">
                    {e.qty.toLocaleString()} {e.what}
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {e.ago} · verified · 99% accurate
                </div>
              </div>
              <span className="hidden shrink-0 rounded-full bg-violet-soft px-2 py-0.5 font-mono text-[10px] font-bold text-violet sm:inline">
                #{4820 + e.id}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
