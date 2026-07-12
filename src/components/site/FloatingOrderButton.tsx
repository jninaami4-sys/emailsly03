import { ArrowUpRight, Calculator } from "lucide-react";
import { openOrderDrawer } from "./OrderDrawer";

export function FloatingOrderButton() {
  return (
    <button
      type="button"
      onClick={openOrderDrawer}
      className="group fixed bottom-6 right-6 z-[70] inline-flex items-center gap-3 rounded-full border border-white/15 bg-midnight px-5 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_-10px_rgba(79,70,229,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_25px_60px_-10px_rgba(79,70,229,0.75)] md:bottom-8 md:right-8"
      aria-label="Build your order"
    >
      <span className="relative grid size-8 place-items-center rounded-full bg-indigo">
        <Calculator className="size-4 text-white" />
        <span className="absolute inset-0 animate-ping rounded-full bg-indigo/50" aria-hidden />
      </span>
      <span className="hidden sm:inline">Build your order</span>
      <span className="sm:hidden">Quote</span>
      <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  );
}
