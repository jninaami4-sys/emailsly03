import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

type Source = { id: string; name: string; rate: number; min: number };

const SOURCES: Source[] = [
  { id: "apollo", name: "Apollo Export", rate: 0.12, min: 500 },
  { id: "linkedin", name: "LinkedIn Sales Nav", rate: 0.15, min: 500 },
  { id: "zoominfo", name: "ZoomInfo Verified", rate: 0.25, min: 300 },
  { id: "manual", name: "Manual Research", rate: 1.5, min: 100 },
];

export function PricingCalculator({ compact = false }: { compact?: boolean }) {
  const [sourceId, setSourceId] = useState("linkedin");
  const [quantity, setQuantity] = useState(2500);

  const source = SOURCES.find((s) => s.id === sourceId)!;
  const total = useMemo(() => Math.max(source.rate * quantity, source.rate * source.min), [source, quantity]);

  return (
    <div className={`rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8 ${compact ? "" : "shadow-lg"}`}>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">Estimate your batch</h3>
        <span className="rounded-full bg-emerald-soft px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald">
          Instant quote
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-3 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Source
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSourceId(s.id)}
                className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                  sourceId === s.id
                    ? "border-violet bg-violet-soft text-violet"
                    : "border-border text-foreground hover:border-foreground/20"
                }`}
              >
                <div>{s.name}</div>
                <div className={`mt-0.5 font-mono text-[10px] font-normal ${sourceId === s.id ? "text-violet/70" : "text-muted-foreground"}`}>
                  from ${s.rate.toFixed(2)}/lead
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Quantity
            </label>
            <span className="font-mono text-sm font-semibold">{quantity.toLocaleString()} leads</span>
          </div>
          <input
            type="range"
            min={source.min}
            max={10000}
            step={100}
            value={Math.max(quantity, source.min)}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full accent-violet"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>{source.min.toLocaleString()}</span>
            <span>10,000</span>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-border pt-6">
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Estimated total</div>
            <div className="font-display text-4xl font-bold italic tracking-tight">
              ${total.toFixed(2)}
            </div>
          </div>
          <Link
            to="/contact"
            className="rounded-xl bg-violet px-6 py-3 font-semibold text-white shadow-lg shadow-violet/20 transition-transform hover:scale-[1.02]"
          >
            Get started
          </Link>
        </div>
      </div>
    </div>
  );
}
