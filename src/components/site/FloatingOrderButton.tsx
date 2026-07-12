import { ArrowUpRight, Calculator } from "lucide-react";
import { openOrderDrawer } from "./OrderDrawer";

export function FloatingOrderButton() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex justify-center px-4 md:bottom-8">
      <button
        type="button"
        onClick={openOrderDrawer}
        className="group pointer-events-auto inline-flex items-center gap-3 rounded-full border border-gold/30 bg-gold px-6 py-3.5 text-sm font-semibold text-black shadow-[0_20px_50px_-10px_rgba(212,168,83,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_25px_60px_-10px_rgba(212,168,83,0.7)] md:text-base"
        aria-label="Build your order — get instant price"
      >
        <span className="relative grid size-8 place-items-center rounded-full bg-black/15">
          <Calculator className="size-4" />
          <span className="absolute inset-0 animate-ping rounded-full bg-black/20" aria-hidden />
        </span>
        <span className="whitespace-nowrap">Build your order · get instant price</span>
        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
}
