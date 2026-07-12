import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function Header() {
  const { count, open } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  const cartLabel = count > 0 ? `Open cart, ${count} item${count === 1 ? "" : "s"}` : "Open cart";

  return (
    <>
      <a
        href="#main-content"
        className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white ${focusRing}`}
      >
        Skip to main content
      </a>
      <div className="sticky top-4 z-40 px-4">
        <nav
          aria-label="Primary"
          className="relative mx-auto flex h-12 max-w-6xl items-center justify-between overflow-hidden rounded-full border border-white/20 bg-white/[0.03] px-5 shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_1px_1px_0_rgba(255,255,255,0.3),inset_0_-1px_1px_0_rgba(255,255,255,0.05)] backdrop-blur-3xl before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/10 before:to-transparent"
        >
          <div className="z-10 flex items-center gap-8 text-white">
            <Link
              to="/"
              aria-label="LyraData home"
              className={`flex items-center gap-2 rounded-md font-display text-xl font-bold tracking-tight ${focusRing}`}
            >
              <span className="grid size-6 place-items-center rounded-sm bg-violet" aria-hidden="true">
                <span className="size-2 rounded-full bg-white" />
              </span>
              LYRA<span className="text-violet">DATA</span>
            </Link>
            <ul className="hidden items-center gap-6 text-sm font-medium text-white/70 lg:flex">
              {[
                { to: "/store", label: "Lead Store" },
                { to: "/pricing", label: "Pricing" },
                { to: "/apollo-leads-export", label: "Services" },
                { to: "/track-order", label: "Track Order" },
                { to: "/blog", label: "Blog" },
                { to: "/contact", label: "Contact" },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    activeProps={{ "aria-current": "page", className: "text-white" }}
                    className={`rounded-md px-1 py-1 transition-colors hover:text-white ${focusRing}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={open}
              className={`relative rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white ${focusRing}`}
              aria-label={cartLabel}
            >
              <ShoppingCart className="size-5" aria-hidden="true" />
              {count > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-coral text-[10px] font-bold text-white"
                >
                  {count}
                </span>
              )}
            </button>
            {user ? (
              <>
                <span className="hidden items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold lg:inline-flex">
                  <UserIcon className="size-3.5 text-violet" aria-hidden="true" />
                  <span className="max-w-[140px] truncate" aria-label={`Signed in as ${user.email}`}>
                    {user.email}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`hidden items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet lg:inline-flex ${focusRing}`}
                >
                  <LogOut className="size-3.5" aria-hidden="true" /> Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className={`hidden rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-violet lg:inline-flex ${focusRing}`}
              >
                Get Started
              </Link>
            )}
            <button
              type="button"
              className={`inline-flex size-11 items-center justify-center rounded-lg lg:hidden ${focusRing}`}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
            {mobileOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
        {/* Liquid-glass gloss reflection */}
        <div className="pointer-events-none absolute inset-0 rounded-full overflow-hidden" aria-hidden="true">
          <div className="absolute -top-1/2 -left-[10%] w-[120%] h-full rotate-12 bg-white/5 blur-2xl will-change-transform" />
        </div>
      </nav>
      {mobileOpen && (
        <div id="mobile-nav" className="relative mt-2 overflow-hidden rounded-2xl border border-white/20 bg-white/[0.03] shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_1px_1px_0_rgba(255,255,255,0.3),inset_0_-1px_1px_0_rgba(255,255,255,0.05)] backdrop-blur-3xl before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/10 before:to-transparent lg:hidden">
            <ul className="flex flex-col gap-1 px-3 py-3 text-sm font-medium">
              {[
                { to: "/store", label: "Lead Store" },
                { to: "/pricing", label: "Pricing" },
                { to: "/apollo-leads-export", label: "Services" },
                { to: "/track-order", label: "Track Order" },
                { to: "/blog", label: "Blog" },
                { to: "/contact", label: "Contact" },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    activeProps={{ "aria-current": "page", className: "bg-secondary text-foreground" }}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-md px-3 py-2 hover:bg-secondary ${focusRing}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
