import { Rocket, ArrowRight } from "lucide-react";
import { openOrderDrawer } from "./OrderDrawer";

export function FloatingOrderButton() {
  return (
    <>
      <style>{`body.order-open .lyra-floating-order { display: none; }`}</style>
      <button
        type="button"
        onClick={openOrderDrawer}
        aria-label="Get started — order your leads"
        className="lyra-floating-order group fixed right-0 top-1/2 z-[70] -translate-y-1/2 translate-x-[calc(100%-3.25rem)] hover:translate-x-0 transition-transform duration-500 ease-out inline-flex items-center gap-3 rounded-l-2xl border border-white/15 border-r-0 bg-gradient-to-br from-indigo to-[oklch(0.42_0.22_275)] py-4 pl-4 pr-5 text-sm font-semibold text-white shadow-[0_20px_60px_-10px_rgba(79,70,229,0.7)]"
      >
        <span className="relative grid size-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
          <Rocket className="size-5 text-white" />
          <span className="absolute inset-0 animate-ping rounded-xl bg-white/20" aria-hidden />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-white/70">
            Start here
          </span>
          <span className="font-display text-base font-bold">Get your leads</span>
        </span>
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </button>
    </>
  );
}
