import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

export type PriceService = {
  id: string;
  name: string;
  rate: number;
  minQty: number;
  minOrder: number;
  fixed?: boolean;
  unit: string;
  helper?: string;
};

export const SERVICES: PriceService[] = [
  { id: "apollo", name: "Apollo Export", rate: 0.0035, minQty: 5000, minOrder: 20, unit: "lead", helper: "$20 / 5K leads · $35 / 10K+" },
  { id: "zoominfo", name: "ZoomInfo Data", rate: 0.02, minQty: 1000, minOrder: 20, unit: "lead" },
  { id: "linkedin", name: "LinkedIn B2B", rate: 0.01, minQty: 5000, minOrder: 50, unit: "lead", helper: "~70% include emails" },
  { id: "manual", name: "Manual Research", rate: 0.35, minQty: 100, minOrder: 35, unit: "lead" },
  { id: "mobile", name: "Apollo Mobiles", rate: 0.35, minQty: 100, minOrder: 35, unit: "record" },
  { id: "pixel", name: "Facebook Pixel Setup", rate: 100, minQty: 1, minOrder: 100, unit: "setup", fixed: true },
  { id: "ads", name: "Google Ads Setup", rate: 100, minQty: 1, minOrder: 100, unit: "setup", fixed: true },
  { id: "tracking", name: "Server-Side Tracking", rate: 150, minQty: 1, minOrder: 150, unit: "setup", fixed: true },
  { id: "logo", name: "Logo Design", rate: 50, minQty: 1, minOrder: 50, unit: "design", fixed: true },
  { id: "webdesign", name: "AI Website Design", rate: 200, minQty: 1, minOrder: 200, unit: "site", fixed: true },
];

export function PricingCalculator({ compact = false, defaultId }: { compact?: boolean; defaultId?: string }) {
  const [sourceId, setSourceId] = useState(defaultId ?? "apollo");
  const source = SERVICES.find((s) => s.id === sourceId)!;
  const [quantity, setQuantity] = useState(source.minQty);

  const total = useMemo(() => {
    if (source.fixed) return source.minOrder;
    const q = Math.max(quantity, source.minQty);
    return Math.max(q * source.rate, source.minOrder);
  }, [source, quantity]);

  const dataServices = SERVICES.filter((s) => !s.fixed);
  const fixedServices = SERVICES.filter((s) => s.fixed);

  return (
    <div className={`rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8 ${compact ? "" : "shadow-lg"}`}>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">Calculate your price</h3>
        <span className="rounded-full bg-emerald-soft px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald">
          Instant quote
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-3 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Data services
          </label>
          <div className="grid grid-cols-2 gap-2">
            {dataServices.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSourceId(s.id);
                  setQuantity(s.minQty);
                }}
                className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                  sourceId === s.id
                    ? "border-violet bg-violet-soft text-violet"
                    : "border-border text-foreground hover:border-foreground/20"
                }`}
              >
                <div>{s.name}</div>
                <div className={`mt-0.5 font-mono text-[10px] font-normal ${sourceId === s.id ? "text-violet/70" : "text-muted-foreground"}`}>
                  ${s.rate.toFixed(s.rate < 1 ? 4 : 2)}/{s.unit}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Add-ons (fixed price)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {fixedServices.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSourceId(s.id);
                  setQuantity(1);
                }}
                className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                  sourceId === s.id
                    ? "border-coral bg-coral-soft text-coral"
                    : "border-border text-foreground hover:border-foreground/20"
                }`}
              >
                <div>{s.name}</div>
                <div className={`mt-0.5 font-mono text-[10px] font-normal ${sourceId === s.id ? "text-coral/70" : "text-muted-foreground"}`}>
                  ${s.minOrder} flat
                </div>
              </button>
            ))}
          </div>
        </div>

        {!source.fixed && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Quantity
              </label>
              <span className="font-mono text-sm font-semibold">
                {quantity.toLocaleString()} {source.unit}s
              </span>
            </div>
            <input
              type="range"
              min={source.minQty}
              max={Math.max(source.minQty * 10, 50000)}
              step={Math.max(Math.round(source.minQty / 20), 1)}
              value={Math.max(quantity, source.minQty)}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full accent-violet"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>Min {source.minQty.toLocaleString()}</span>
              <span>{Math.max(source.minQty * 10, 50000).toLocaleString()}</span>
            </div>
            {source.helper && (
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">{source.helper}</p>
            )}
          </div>
        )}

        <div className="flex items-end justify-between border-t border-border pt-6">
          <div>
            <div className="mb-1 text-xs text-muted-foreground">
              Estimated total {source.fixed ? "(flat)" : `(min $${source.minOrder})`}
            </div>
            <div className="font-display text-4xl font-bold italic tracking-tight">
              ${total.toFixed(2)}
            </div>
          </div>
          <Link
            to="/contact"
            className="rounded-xl bg-violet px-6 py-3 font-semibold text-white shadow-lg shadow-violet/20 transition-transform hover:scale-[1.02]"
          >
            Start order
          </Link>
        </div>
      </div>
    </div>
  );
}
