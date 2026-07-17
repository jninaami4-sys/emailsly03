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
import { useSiteContent } from "@/hooks/use-site-content";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { openOrderDrawer } from "./OrderDrawer";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import {
  Store,
  Tag,
  Briefcase,
  PackageSearch,
  Newspaper,
  Mail,
  Building2,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/store", label: "Lead Store", icon: Store },
  { to: "/pricing", label: "Pricing", icon: Tag },
  { to: "/apollo-leads-export", label: "Services", icon: Briefcase },
  { to: "/track-order", label: "Track Order", icon: PackageSearch },
  { to: "/blog", label: "Blog", icon: Newspaper },
  { to: "/about", label: "About", icon: Building2 },
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const branding = useSiteContent("branding");
  const siteName = branding.site_name || "EmailsLy";
  const logoUrl = (branding.logo_url || "").trim();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  const cartLabel = count > 0 ? `Open cart, ${count} item${count === 1 ? "" : "s"}` : "Open cart";

  function handleLogoClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

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
            className="relative mx-auto flex h-12 w-full max-w-6xl items-center justify-between rounded-full border border-white/40 bg-white/85 px-5 text-ink shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_0.5px_0_0_rgba(255,255,255,0.72),inset_0_-0.5px_0_0_rgba(0,0,0,0.05)] backdrop-blur-2xl backdrop-saturate-[180%]"
          >
            <div className="z-10 flex items-center gap-8">
              <Link
                to="/"
                onClick={handleLogoClick}
                aria-label={`${siteName} home`}
                className={`flex items-center gap-2 rounded-md font-display text-xl font-bold tracking-tight ${focusRing}`}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${siteName} logo`}
                    className="block h-7 sm:h-8 w-auto max-w-[140px] object-contain shrink-0 select-none p-0 m-0"
                    draggable={false}
                  />
                ) : (
                  <>
                    <PremiumLogoMark className="size-6" aria-hidden="true" />
                    <span>{siteName}</span>
                  </>
                )}
              </Link>
              <ul className="hidden items-center gap-1 text-sm font-medium lg:flex">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    pathname === item.to || pathname.startsWith(item.to + "/");
                  return (
                    <li key={item.to} className="relative">
                      <Link
                        to={item.to}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative inline-flex items-center rounded-full px-3 py-1.5 transition-colors ${
                          isActive ? "text-violet" : "text-ink/70 hover:text-ink"
                        } ${focusRing}`}
                      >
                        <span className="relative z-10">{item.label}</span>
                        {isActive && (
                          <>
                            <motion.span
                              layoutId="header-nav-pill"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                              className="absolute inset-0 rounded-full bg-violet/10"
                            />
                            <motion.span
                              layoutId="header-nav-lamp"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                              className="pointer-events-none absolute -top-[7px] left-1/2 z-20 h-1 w-8 -translate-x-1/2 rounded-full bg-violet"
                            >
                              <span className="absolute -top-2 -left-2 h-6 w-12 rounded-full bg-violet/30 blur-md" />
                              <span className="absolute -top-1 left-0 h-6 w-8 rounded-full bg-violet/25 blur-md" />
                              <span className="absolute top-0 left-2 h-4 w-4 rounded-full bg-violet/25 blur-sm" />
                            </motion.span>
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={open}
                className={`relative rounded-lg p-2 text-ink transition-colors hover:bg-violet/10 hover:text-violet ${focusRing}`}
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
                  <Link
                    to="/dashboard"
                    className={`hidden items-center gap-1.5 rounded-lg bg-violet/10 px-3 py-2 text-xs font-semibold text-violet transition-colors hover:bg-violet hover:text-white lg:inline-flex ${focusRing}`}
                    aria-label="Open your dashboard"
                  >
                    <PremiumUser className="size-3.5" aria-hidden="true" />
                    <span className="max-w-[140px] truncate">Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={`hidden items-center gap-1.5 rounded-lg bg-violet px-3 py-2 text-xs font-semibold text-white transition-colors hover:brightness-110 lg:inline-flex ${focusRing}`}
                  >
                    <PremiumLogOut className="size-3.5" aria-hidden="true" /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    aria-label="Sign in to your account"
                    className={`hidden size-9 items-center justify-center rounded-full border border-violet/20 bg-violet/10 text-violet transition-colors hover:bg-violet hover:text-white lg:inline-flex ${focusRing}`}
                  >
                    <PremiumUser className="size-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={openOrderDrawer}
                    className={`hidden rounded-full bg-violet px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 lg:inline-flex ${focusRing}`}
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
                { to: "/about", label: "About" },
                { to: "/contact", label: "Contact" },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    activeProps={{ "aria-current": "page", className: "bg-violet/10 text-violet" }}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-md px-3 py-2 text-ink transition-colors [-webkit-tap-highlight-color:transparent] hover:bg-violet/10 hover:text-violet active:bg-violet/10 active:text-violet ${focusRing}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            {user ? (
              <div className="relative z-10 flex flex-col gap-1 border-t border-black/10 px-3 py-3">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-md bg-violet/10 px-3 py-2 text-sm font-semibold text-violet transition-colors hover:bg-violet hover:text-white ${focusRing}`}
                >
                  <PremiumUser className="size-4" aria-hidden="true" />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleSignOut();
                  }}
                  className={`flex items-center gap-2 rounded-md bg-violet px-3 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110 ${focusRing}`}
                >
                  <PremiumLogOut className="size-4" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col gap-1 border-t border-black/10 px-3 py-3">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-md bg-violet/10 px-3 py-2 text-sm font-semibold text-violet transition-colors hover:bg-violet hover:text-white ${focusRing}`}
                >
                  <PremiumUser className="size-4" aria-hidden="true" />
                  Sign in
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
