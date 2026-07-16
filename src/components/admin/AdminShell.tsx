import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Search, ChevronRight, ExternalLink, Layout, BarChart3, Boxes, Package,
  Users, MessageSquare, Palette, Database, LineChart, Sparkles, HelpCircle,
  ShieldCheck, Megaphone, Globe, PanelBottom, ImageIcon, Webhook, Server,
  Mail, Lock,
} from "@/components/admin/AdminIcons";

export type NavItem = {
  id: string;
  label: string;
  desc: string;
  icon: (p: { className?: string }) => ReactElement;
  keywords?: string;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const NAV_ICONS = {
  Layout, BarChart3, Boxes, Package, Users, MessageSquare, Palette,
  Database, LineChart, Sparkles, HelpCircle, ShieldCheck, Megaphone,
  Globe, PanelBottom, ImageIcon, Webhook, Server, Mail,
};

export function AdminShell({
  groups,
  activeId,
  onSelect,
  onOpenPalette,
  userEmail,
  onSignOut,
  children,
}: {
  groups: NavGroup[];
  activeId: string;
  onSelect: (id: string) => void;
  onOpenPalette: () => void;
  userEmail?: string | null;
  onSignOut?: () => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = groups.flatMap((g) => g.items).find((i) => i.id === activeId);

  // Close mobile nav on selection
  useEffect(() => {
    setMobileOpen(false);
  }, [activeId]);

  return (
    <div className="min-h-screen bg-[oklch(0.14_0.01_260)] text-foreground">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/5 bg-[oklch(0.12_0.01_260)]/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg border border-white/10 bg-white/5 p-2"
          aria-label="Open navigation"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest">
          <span className="size-2 rounded-full bg-violet shadow-[0_0_12px] shadow-violet" />
          Emailsly Admin
        </div>
        <button
          type="button"
          onClick={onOpenPalette}
          className="ml-auto rounded-lg border border-white/10 bg-white/5 p-2"
          aria-label="Open command palette"
        >
          <Search className="size-4" />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-40 flex h-screen w-72 flex-col border-r border-white/5 bg-[oklch(0.11_0.01_260)] transition-transform lg:sticky lg:top-0 lg:translate-x-0`}
        >
          {/* Brand */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <Link
              to="/admin"
              className="flex items-center gap-2.5"
              onClick={() => onSelect("overview")}
            >
              <div className="relative flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet to-[oklch(0.55_0.22_310)] shadow-[0_0_20px_-4px_oklch(0.52_0.24_293/0.6)]">
                <Sparkles className="size-4 text-white" />
              </div>
              <div>
                <p className="font-display text-sm font-bold leading-none">Emailsly</p>
                <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
                  Control Deck
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/5 lg:hidden"
              aria-label="Close navigation"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Command trigger */}
          <div className="px-3 py-3">
            <button
              type="button"
              onClick={onOpenPalette}
              className="group flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-white/50 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
            >
              <Search className="size-3.5" />
              <span className="flex-1">Search or jump to…</span>
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white/60">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
            {groups.map((g) => (
              <div key={g.id}>
                <p className="px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
                  {g.label}
                </p>
                <ul className="mt-0.5 space-y-0.5">
                  {g.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeId;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(item.id)}
                          className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-[13px] transition-colors ${
                            isActive
                              ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_oklch(0.52_0.24_293/0.4)]"
                              : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                          }`}
                        >
                          <Icon
                            className={`size-4 shrink-0 ${
                              isActive ? "text-violet" : "text-white/40 group-hover:text-white/70"
                            }`}
                          />
                          <span className="truncate font-medium">{item.label}</span>
                          {isActive && (
                            <span className="ml-auto size-1.5 rounded-full bg-violet shadow-[0_0_8px] shadow-violet" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-white/5 p-3">
            <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] p-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet to-emerald text-[11px] font-bold text-white">
                {userEmail?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-white/90">
                  {userEmail ?? "Admin"}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-emerald">
                  ● Online
                </p>
              </div>
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded p-1.5 text-white/40 hover:bg-white/5 hover:text-white"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <Lock className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main */}
        <div className="min-w-0 flex-1">
          {/* Top bar (desktop) */}
          <header className="sticky top-0 z-20 hidden items-center gap-3 border-b border-white/5 bg-[oklch(0.14_0.01_260)]/85 px-6 py-3 backdrop-blur lg:flex">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/40">
              <span className="text-white/30">Admin</span>
              <ChevronRight className="size-3" />
              <span className="font-semibold text-white/80">
                {active?.label ?? "Overview"}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/70 hover:border-white/20 hover:text-white"
              >
                <ExternalLink className="size-3.5" /> View site
              </a>
              <button
                type="button"
                onClick={onOpenPalette}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/70 hover:border-white/20 hover:text-white"
              >
                <Search className="size-3.5" /> Search
                <kbd className="ml-1 rounded border border-white/10 bg-black/40 px-1 py-0.5 font-mono text-[9px]">
                  ⌘K
                </kbd>
              </button>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {active && (
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold sm:text-3xl">
                  {active.label}
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {active.desc}
                </p>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}