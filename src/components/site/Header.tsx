import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Menu, LogOut, User as UserIcon } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export function Header() {
  const { count, open } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
            <span className="grid size-6 place-items-center rounded-sm bg-violet">
              <span className="size-2 rounded-full bg-white" />
            </span>
            LYRA<span className="text-violet">DATA</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link to="/store" className="transition-colors hover:text-foreground">
              Lead Store
            </Link>
            <Link to="/pricing" className="transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link to="/apollo-leads-export" className="transition-colors hover:text-foreground">
              Services
            </Link>
            <Link to="/track-order" className="transition-colors hover:text-foreground">
              Track Order
            </Link>
            <Link to="/contact" className="transition-colors hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={open}
            className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Open cart"
          >
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-coral text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
          <Link
            to="/store"
            className="hidden rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet md:inline-flex"
          >
            Start Prospecting
          </Link>
          <button
            className="rounded-lg p-2 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-3 text-sm font-medium">
            <Link to="/store" className="rounded-md px-2 py-2 hover:bg-secondary" onClick={() => setMobileOpen(false)}>
              Lead Store
            </Link>
            <Link to="/pricing" className="rounded-md px-2 py-2 hover:bg-secondary" onClick={() => setMobileOpen(false)}>
              Pricing
            </Link>
            <Link to="/apollo-leads-export" className="rounded-md px-2 py-2 hover:bg-secondary" onClick={() => setMobileOpen(false)}>
              Services
            </Link>
            <Link to="/track-order" className="rounded-md px-2 py-2 hover:bg-secondary" onClick={() => setMobileOpen(false)}>
              Track Order
            </Link>
            <Link to="/contact" className="rounded-md px-2 py-2 hover:bg-secondary" onClick={() => setMobileOpen(false)}>
              Contact
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
