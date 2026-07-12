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
          className="mx-auto flex h-12 max-w-6xl items-center justify-between rounded-full border border-white/50 bg-ink/20 px-5 shadow-[0_8px_32px_-12px_rgba(24,24,60,0.12)] backdrop-blur-2xl backdrop-saturate-[180%]"
        >
          <div className="flex items-center gap-8">
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
            <ul className="hidden items-center gap-6 text-sm font-medium text-foreground lg:flex">
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
                    activeProps={{ "aria-current": "page", className: "text-foreground" }}
                    className={`rounded-md px-1 py-1 transition-colors hover:text-foreground ${focusRing}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={open}
              className={`relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${focusRing}`}
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
        </nav>
        {mobileOpen && (
          <div id="mobile-nav" className="mt-2 rounded-2xl border border-white/50 bg-ink/20 shadow-lg backdrop-blur-2xl backdrop-saturate-[180%] lg:hidden">
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
