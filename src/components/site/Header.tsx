import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShoppingCart, Menu, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

type NavChild = { to: string; label: string; description?: string };
type NavItem = { label: string; to?: string; children?: NavChild[] };

const NAV_ITEMS: NavItem[] = [
  { to: "/store", label: "Lead Store" },
  { to: "/pricing", label: "Pricing" },
  {
    label: "Services",
    children: [
      { to: "/apollo-leads-export", label: "Apollo Leads Export", description: "Bulk Apollo.io exports" },
      { to: "/linkedin-sales-navigator-leads", label: "LinkedIn Sales Navigator", description: "Sales Nav lead lists" },
      { to: "/zoominfo-leads", label: "ZoomInfo Leads", description: "Enriched ZoomInfo data" },
      { to: "/manual-lead-research", label: "Manual Lead Research", description: "Human-verified prospects" },
      { to: "/website-design", label: "Website Design", description: "Conversion-focused sites" },
    ],
  },
  { to: "/track-order", label: "Track Order" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

type CursorPosition = { left: number; width: number; opacity: number };

function DesktopNav() {
  const [position, setPosition] = useState<CursorPosition>({ left: 0, width: 0, opacity: 0 });
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <ul
      className="relative mx-auto hidden w-fit items-center rounded-full border border-ink/15 bg-white p-1 shadow-sm md:flex"
      onMouseLeave={() => {
        setPosition((pv) => ({ ...pv, opacity: 0 }));
        setOpenMenu(null);
      }}
    >
      {NAV_ITEMS.map((item) => (
        <NavTab
          key={item.label}
          item={item}
          setPosition={setPosition}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
        />
      ))}
      <Cursor position={position} />
    </ul>
  );
}

function NavTab({
  item,
  setPosition,
  openMenu,
  setOpenMenu,
}: {
  item: NavItem;
  setPosition: React.Dispatch<React.SetStateAction<CursorPosition>>;
  openMenu: string | null;
  setOpenMenu: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive =
    (item.to && (pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/")))) ||
    (item.children?.some((c) => pathname === c.to || pathname.startsWith(c.to + "/")) ?? false);
  const isOpen = openMenu === item.label;

  const handleEnter = () => {
    if (!ref.current) return;
    const { width } = ref.current.getBoundingClientRect();
    setPosition({ width, opacity: 1, left: ref.current.offsetLeft });
    setOpenMenu(item.children ? item.label : null);
  };

  const inner = (
    <span
      className={`flex cursor-pointer items-center gap-1 whitespace-nowrap px-4 py-2 text-xs font-semibold uppercase tracking-wide mix-blend-difference lg:px-5 lg:text-[13px] ${
        isActive ? "text-white" : "text-white/90"
      }`}
    >
      {item.label}
      {item.children && <ChevronDown className="size-3" />}
    </span>
  );

  return (
    <li ref={ref} onMouseEnter={handleEnter} className="relative z-10 block">
      {item.to ? (
        <Link to={item.to}>{inner}</Link>
      ) : (
        <button type="button" className="block">
          {inner}
        </button>
      )}
      <AnimatePresence>
        {isOpen && item.children && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-1/2 top-full z-50 mt-3 w-72 -translate-x-1/2 rounded-2xl border border-ink/10 bg-white p-2 shadow-xl mix-blend-normal"
          >
            {item.children.map((child) => (
              <Link
                key={child.to}
                to={child.to}
                onClick={() => setOpenMenu(null)}
                className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary"
              >
                <div className="text-sm font-semibold text-ink">{child.label}</div>
                {child.description && (
                  <div className="mt-0.5 text-xs text-muted-foreground">{child.description}</div>
                )}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function Cursor({ position }: { position: CursorPosition }) {
  return (
    <motion.li
      animate={position}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className="absolute z-0 h-9 rounded-full bg-ink lg:h-10"
    />
  );
}

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

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="LyraData home">
          <span className="relative grid size-9 place-items-center rounded-xl bg-ink shadow-sm">
            <span className="absolute inset-1 rounded-lg bg-gradient-to-br from-violet to-coral opacity-90" />
            <span className="relative font-display text-sm font-black text-white">L</span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight text-ink">
              Lyra<span className="text-violet">Data</span>
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              B2B Lead Intelligence
            </span>
          </span>
        </Link>

        <DesktopNav />

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
              <span className="hidden items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold lg:inline-flex">
                <UserIcon className="size-3.5 text-violet" />
                <span className="max-w-[140px] truncate">{user.email}</span>
              </span>
              <button
                onClick={handleSignOut}
                className="hidden items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet md:inline-flex"
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
      </div>
      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-3 text-sm font-medium">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <div key={item.label} className="flex flex-col">
                  <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </div>
                  {item.children.map((child) => (
                    <Link
                      key={child.to}
                      to={child.to}
                      className="rounded-md px-4 py-2 hover:bg-secondary"
                      onClick={() => setMobileOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.to}
                  to={item.to!}
                  className="rounded-md px-2 py-2 hover:bg-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
