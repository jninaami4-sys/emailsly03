import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Menu, LogOut, User as UserIcon } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function Header() {
  const { count, open } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    // Stop in-flight requests before the 401s land and drop cached protected data.
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="sticky top-4 z-40 px-4">
      <nav className="mx-auto flex h-12 max-w-6xl items-center justify-between rounded-full border border-white/40 bg-white/50 px-5 shadow-[0_8px_30px_-12px_rgba(24,24,60,0.18)] backdrop-blur-xl backdrop-saturate-150">
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
            <Link to="/blog" className="transition-colors hover:text-foreground">
              Blog
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
          {user ? (
            <>
              <span className="hidden items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold md:inline-flex">
                <UserIcon className="size-3.5 text-violet" />
                <span className="max-w-[140px] truncate">{user.email}</span>
              </span>
              <button
                onClick={handleSignOut}
                className="hidden items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet md:inline-flex"
              >
                <LogOut className="size-3.5" /> Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="hidden rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-violet md:inline-flex"
            >
              Get Started
            </Link>
          )}
          <button
            className="rounded-lg p-2 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </nav>
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
            <Link to="/blog" className="rounded-md px-2 py-2 hover:bg-secondary" onClick={() => setMobileOpen(false)}>
              Blog
            </Link>
            <Link to="/contact" className="rounded-md px-2 py-2 hover:bg-secondary" onClick={() => setMobileOpen(false)}>
              Contact
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
