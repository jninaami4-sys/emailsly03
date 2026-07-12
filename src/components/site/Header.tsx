import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShoppingCart, Menu, LogOut, User as UserIcon } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

type NavItem = { label: string; to: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Lead Store", to: "/store" },
  { label: "Pricing", to: "/pricing" },
  { label: "Services", to: "/apollo-leads-export" },
  { label: "Track Order", to: "/track-order" },
  { label: "Blog", to: "/blog" },
  { label: "Contact", to: "/contact" },
];

type CursorPosition = { left: number; width: number; opacity: number };

function DesktopNav() {
  const [position, setPosition] = useState<CursorPosition>({ left: 0, width: 0, opacity: 0 });

  return (
    <ul
      className="relative mx-auto hidden w-fit items-center rounded-full border border-ink/15 bg-white p-1 shadow-sm md:flex"
      onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
    >
      {NAV_ITEMS.map((item) => (
        <NavTab key={item.to} item={item} setPosition={setPosition} />
      ))}
      <Cursor position={position} />
    </ul>
  );
}

function NavTab({
  item,
  setPosition,
}: {
  item: NavItem;
  setPosition: React.Dispatch<React.SetStateAction<CursorPosition>>;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) return;
        const { width } = ref.current.getBoundingClientRect();
        setPosition({ width, opacity: 1, left: ref.current.offsetLeft });
      }}
      className="relative z-10 block"
    >
      <Link
        to={item.to}
        className={`block cursor-pointer whitespace-nowrap px-4 py-2 text-xs font-semibold uppercase tracking-wide mix-blend-difference lg:px-5 lg:text-[13px] ${
          isActive ? "text-white" : "text-white/90"
        }`}
      >
        {item.label}
      </Link>
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
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <span className="grid size-6 place-items-center rounded-sm bg-violet">
            <span className="size-2 rounded-full bg-white" />
          </span>
          LYRA<span className="text-violet">DATA</span>
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
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-2 py-2 hover:bg-secondary"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
