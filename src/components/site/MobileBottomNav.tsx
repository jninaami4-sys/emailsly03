import { ShoppingBag } from "lucide-react";
import { openOrderDrawer } from "./OrderDrawer";

export function MobileBottomNav() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" aria-hidden="true" />
      <button
        type="button"
        onClick={openOrderDrawer}
        aria-label="Order verified B2B leads now"
        className="relative isolate flex w-full max-w-md items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/15 bg-ink/95 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all active:scale-[0.98] hover:bg-ink"
      >
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet/60 to-transparent" aria-hidden="true" />
        <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-coral/40 to-transparent" aria-hidden="true" />
        <span className="absolute -right-6 -top-6 size-28 rounded-full bg-violet/25 blur-2xl" aria-hidden="true" />
        <span className="absolute -left-6 -bottom-6 size-24 rounded-full bg-coral/20 blur-2xl" aria-hidden="true" />
        <span className="relative z-10 flex size-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
          <ShoppingBag className="size-4" aria-hidden="true" />
        </span>
        <span className="relative z-10">Order Now</span>
      </button>
    </div>
  );
}

