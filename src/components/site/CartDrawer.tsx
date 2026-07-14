import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useEffect } from "react";

export function CartDrawer() {
  const { isOpen, close, items, remove, setQty, subtotal, clear } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const fee = subtotal > 0 ? Math.round((subtotal * 0.029 + 0.3) * 100) / 100 : 0;
  const total = subtotal + fee;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close cart"
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={close}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-2xl animate-in slide-in-from-right">
        <div className="flex items-center justify-between border-b border-border p-6">
          <h2 className="font-display text-xl font-bold">Your cart</h2>
          <button onClick={close} className="rounded-lg p-2 hover:bg-secondary" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-secondary">
              <ShoppingBag className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">Cart is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">Add a lead list to get started.</p>
            </div>
            <button
              onClick={close}
              className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-violet"
            >
              Browse store
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <ul className="space-y-4">
                {items.map(({ product, quantity }) => (
                  <li
                    key={product.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                          product.categoryColor === "violet" ? "bg-violet-soft text-violet" :
                          product.categoryColor === "coral" ? "bg-coral-soft text-coral" :
                          "bg-emerald-soft text-emerald"
                        }`}>
                          {product.category}
                        </span>
                        <h3 className="mt-1.5 font-semibold leading-tight">{product.title}</h3>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                          {product.records.toLocaleString()} records
                        </p>
                      </div>
                      <button
                        onClick={() => remove(product.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        aria-label="Remove"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-lg border border-border">
                        <button
                          onClick={() => setQty(product.id, quantity - 1)}
                          className="grid size-8 place-items-center hover:bg-secondary"
                          aria-label="Decrease"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="min-w-6 text-center font-mono text-sm font-semibold">{quantity}</span>
                        <button
                          onClick={() => setQty(product.id, quantity + 1)}
                          className="grid size-8 place-items-center hover:bg-secondary"
                          aria-label="Increase"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <span className="font-display font-bold">${(product.price * quantity).toFixed(2)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border bg-secondary/40 p-6">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Processing fee</span>
                  <span className="font-mono">${fee.toFixed(2)}</span>
                </div>
                <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
                  <span className="font-semibold">Total</span>
                  <span className="font-display text-2xl font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
              <button
                disabled
                className="slide-btn mt-4 w-full"
                title="Payments not yet enabled"
              >
                <span className="slide-btn-decor" aria-hidden />
                <span className="slide-btn-content justify-between">
                  <span className="slide-btn-icon">
                    <Lock className="size-4" />
                  </span>
                  <span className="slide-btn-text flex-1 justify-center">
                    Checkout · Stripe coming soon
                  </span>
                  <span className="slide-btn-icon" style={{ background: "color-mix(in oklab, var(--violet) 88%, black)" }}>
                    <ArrowRight className="size-4" />
                  </span>
                </span>
              </button>
              <button
                onClick={clear}
                className="mt-2 w-full rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-background"
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
