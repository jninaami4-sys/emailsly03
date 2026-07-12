import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

type NavItem = { label: string; href: string };

const FALLBACK_NAV: NavItem[] = [
  { label: "Lead Store", href: "/store" },
  { label: "Pricing", href: "/pricing" },
  { label: "Services", href: "/apollo-leads-export" },
  { label: "Blog", href: "/blog" },
  { label: "Track Order", href: "/track-order" },
];

function useSiteSettings(): { nav_items: NavItem[] } {
  return { nav_items: FALLBACK_NAV };
}

export function Header() {
  const { nav_items } = useSiteSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Esc + lock scroll while open
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 h-16 border-b bg-background/70 backdrop-blur-md transition-[border-color] duration-300 ease-out md:h-20 ${
          scrolled ? "border-border" : "border-transparent"
        }`}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5 sm:px-8">
          {/* Left: logo */}
          <Link to="/" className="flex items-center gap-1.5" aria-label="Home">
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">
              LyraData
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          </Link>

          {/* Center: nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {nav_items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`group relative text-sm font-medium transition-colors duration-200 ${
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                  <span
                    className={`pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-left bg-foreground transition-transform duration-300 ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                    aria-hidden
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              className="hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] md:inline-flex"
            >
              Talk to us
              <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground md:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer so page content isn't hidden under fixed header */}
      <div className="h-16 md:h-20" aria-hidden />

      {/* Mobile sheet */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background md:hidden"
          style={{ animation: "sheet-in 300ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-16 items-center justify-between px-5 sm:px-8">
            <Link to="/" className="flex items-center gap-1.5" onClick={() => setMobileOpen(false)}>
              <span className="font-display text-lg font-semibold tracking-tight text-foreground">
                LyraData
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center space-y-6 px-6">
            {nav_items.map((item, i) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`font-display text-3xl font-semibold tracking-tight text-foreground ${
                    active ? "border-l-2 border-primary pl-4" : ""
                  }`}
                  style={{
                    animation: `sheet-item-in 400ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                    animationDelay: `${120 + i * 60}ms`,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-6 pb-10">
            <Link
              to="/contact"
              onClick={() => setMobileOpen(false)}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
            >
              Talk to us
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
