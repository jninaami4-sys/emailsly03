import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { OrderBuilder } from "./OrderBuilder";

export const OPEN_ORDER_EVENT = "lyra:open-order";
export const PRESELECT_SERVICE_EVENT = "lyra:preselect-service";

export function openOrderDrawer(serviceId?: unknown) {
  if (typeof window === "undefined") return;
  if (typeof serviceId === "string" && serviceId) {
    window.dispatchEvent(
      new CustomEvent(PRESELECT_SERVICE_EVENT, { detail: { serviceId } }),
    );
  }
  window.dispatchEvent(new CustomEvent(OPEN_ORDER_EVENT));
}



export function OrderDrawer() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_ORDER_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ORDER_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    document.body.classList.add("order-open");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("order-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="theme-midnight">
      {/* Backdrop */}
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[80] bg-midnight/70 backdrop-blur-md transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Build your order"
        className={`fixed top-0 right-0 z-[90] flex h-[100dvh] max-h-[100dvh] w-full max-w-[1280px] flex-col bg-background text-foreground shadow-[0_0_80px_-10px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:w-[92vw] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-6 py-4 backdrop-blur">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-indigo">
              Instant quote
            </p>
            <h2 className="font-display text-lg font-bold">Build your order</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close order builder"
            className="grid size-10 place-items-center rounded-full border border-border bg-secondary text-foreground transition-colors hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="order-drawer-scroll flex-1 overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+96px)] lg:pb-0">
          <OrderBuilder />
        </div>
      </aside>
    </div>,
    document.body,
  );
}
