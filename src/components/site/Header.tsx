import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  PremiumLogoMark,
  PremiumShoppingCart,
  PremiumMenu,
  PremiumX,
  PremiumLogOut,
  PremiumUser,
} from "./PremiumIcons";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { openOrderDrawer } from "./OrderDrawer";
import { motion } from "framer-motion";
import {
  Store,
  Tag,
  Briefcase,
  PackageSearch,
  Newspaper,
  Mail,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/store", label: "Lead Store", icon: Store },
  { to: "/pricing", label: "Pricing", icon: Tag },
  { to: "/apollo-leads-export", label: "Services", icon: Briefcase },
  { to: "/track-order", label: "Track Order", icon: PackageSearch },
  { to: "/blog", label: "Blog", icon: Newspaper },
  { to: "/contact", label: "Contact", icon: Mail },
] as const;

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
        <div className="relative">
          <nav
            aria-label="Primary"
            className="relative mx-auto flex h-12 w-full max-w-6xl items-center justify-between overflow-hidden rounded-full border border-white/40 bg-white/85 px-5 text-ink shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_0.5px_0_0_rgba(255,255,255,0.72),inset_0_-0.5px_0_0_rgba(0,0,0,0.05)] backdrop-blur-2xl backdrop-saturate-[180%]"
          >
            <div className="z-10 flex items-center gap-8">
              <Link
                to="/"
                aria-label="LyraData home"
                className={`flex items-center gap-2 rounded-md font-display text-xl font-bold tracking-tight ${focusRing}`}
              >
                <PremiumLogoMark className="size-6" aria-hidden="true" />
                LYRA<span className="text-violet">DATA</span>
              </Link>
              <ul className="hidden items-center gap-6 text-sm font-medium lg:flex">
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
                      activeProps={{ "aria-current": "page", className: "text-ink" }}
                      className={`rounded-md px-1 py-1 transition-colors hover:text-ink ${focusRing}`}
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
                className={`relative rounded-lg p-2 transition-colors hover:bg-secondary hover:text-violet ${focusRing}`}
                aria-label={cartLabel}
              >
                <PremiumShoppingCart className="size-5" aria-hidden="true" />
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
                    <PremiumUser className="size-3.5 text-violet" aria-hidden="true" />
                    <span
                      className="max-w-[140px] truncate"
                      aria-label={`Signed in as ${user.email}`}
                    >
                      {user.email}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={`hidden items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet lg:inline-flex ${focusRing}`}
                  >
                    <PremiumLogOut className="size-3.5" aria-hidden="true" /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    aria-label="Sign in to your account"
                    className={`hidden size-9 items-center justify-center rounded-full border border-black/10 bg-white text-ink transition-colors hover:bg-secondary hover:text-violet lg:inline-flex ${focusRing}`}
                  >
                    <PremiumUser className="size-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={openOrderDrawer}
                    className={`hidden rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-violet lg:inline-flex ${focusRing}`}
                  >
                    Order Now
                  </button>
                </>
              )}
              <button
                type="button"
                className={`inline-flex size-11 items-center justify-center rounded-lg lg:hidden ${focusRing}`}
                onClick={() => setMobileOpen((o) => !o)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
              >
                {mobileOpen ? (
                  <PremiumX className="size-5" aria-hidden="true" />
                ) : (
                  <PremiumMenu className="size-5" aria-hidden="true" />
                )}
              </button>
            </div>
            {/* Liquid-glass gloss reflection */}
          </nav>
          <div
            className="absolute -inset-1.5 -z-10 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />
        </div>
        {mobileOpen && (
          <div
            id="mobile-nav"
            className="relative mt-2 overflow-hidden rounded-2xl border border-white/40 bg-white/85 text-ink shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_0.5px_0_0_rgba(255,255,255,0.72),inset_0_-0.5px_0_0_rgba(0,0,0,0.05)] backdrop-blur-2xl backdrop-saturate-[180%] lg:hidden"
          >
            <ul className="relative z-10 flex flex-col gap-1 px-3 py-3 text-sm font-medium">
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
                    activeProps={{ "aria-current": "page", className: "bg-secondary text-ink" }}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-md px-3 py-2 transition-colors hover:bg-secondary hover:text-ink ${focusRing}`}
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
