import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { haptic } from "@/lib/haptics";
const logoAsset = { url: "/emailsly-logo-trim.png" };
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
  const activeGroupId =
    groups.find((g) => g.items.some((i) => i.id === activeId))?.id ?? groups[0]?.id;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    [activeGroupId ?? ""]: true,
  }));

  const selectItem = (id: string) => {
    if (id !== activeId) haptic("select");
    onSelect(id);
  };
  const tap = () => haptic("tap");

  useEffect(() => {
    if (activeGroupId) {
      setOpenGroups((prev) => (prev[activeGroupId] ? prev : { ...prev, [activeGroupId]: true }));
    }
  }, [activeGroupId]);

  useEffect(() => {
    setMobileOpen(false);
  }, [activeId]);

  return (
    <div className="admin-theme min-h-screen bg-background text-foreground">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-card px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => { tap(); setMobileOpen(true); }}
          className="rounded-lg border border-border bg-background p-2 text-foreground"
          aria-label="Open navigation"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <Link
          to="/admin"
          onClick={() => selectItem("overview")}
          className="flex items-center gap-2"
        >
          <img
            src={logoAsset.url}
            alt="Emailsly"
            className="h-6 w-auto"
            width={96}
            height={24}
          />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={() => { tap(); onOpenPalette(); }}
          className="ml-auto rounded-lg border border-border bg-background p-2 text-foreground"
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
          } fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card lg:sticky lg:top-0 lg:translate-x-0`}
        >
          {/* Brand */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Link
              to="/admin"
              className="flex items-center gap-3"
              onClick={() => selectItem("overview")}
            >
              <img
                src={logoAsset.url}
                alt="Emailsly"
                className="h-8 w-auto"
                width={128}
                height={32}
              />
              <span className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Admin
              </span>
            </Link>
            <button
              type="button"
              onClick={() => { tap(); setMobileOpen(false); }}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary lg:hidden"
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
              onClick={() => { tap(); onOpenPalette(); }}
              className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-xs font-semibold text-muted-foreground hover:bg-secondary"
            >
              <Search className="size-3.5" />
              <span className="flex-1">Search or jump to…</span>
              <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-6">
            {groups.map((g) => (
              <div key={g.id}>
                <button
                  type="button"
                  onClick={() => {
                    tap();
                    setOpenGroups((prev) => ({ ...prev, [g.id]: !prev[g.id] }));
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
                  aria-expanded={!!openGroups[g.id]}
                >
                  <ChevronRight
                    className={`size-3 ${openGroups[g.id] ? "rotate-90" : ""}`}
                  />
                  <span className="flex-1 text-left">{g.label}</span>
                  <span className="text-muted-foreground/70">{g.items.length}</span>
                </button>
                {openGroups[g.id] && (
                <ul className="mt-0.5 space-y-0.5">
                  {g.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeId;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => selectItem(item.id)}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-bold ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-foreground/75 hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          <Icon
                            className={`size-4 shrink-0 ${
                              isActive ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2.5 rounded-lg bg-secondary p-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30 text-[11px] font-black text-primary">
                {userEmail?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold text-foreground">
                  {userEmail ?? "Admin"}
                </p>
                <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="text-emerald-600">●</span> Online
                </p>
              </div>
              {onSignOut && (
                <button
                  type="button"
                  onClick={() => { haptic("warn"); onSignOut(); }}
                  className="rounded p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
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
            className="fixed inset-0 z-30 bg-foreground/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main */}
        <div className="min-w-0 flex-1">
          {/* Top bar (desktop) */}
          <header className="sticky top-0 z-20 hidden items-center gap-3 border-b border-border bg-card px-6 py-3 lg:flex">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-muted-foreground">
              <span>Admin</span>
              <ChevronRight className="size-3" />
              <span className="font-black text-foreground">
                {active?.label ?? "Overview"}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary"
              >
                <ExternalLink className="size-3.5" /> View site
              </a>
              <button
                type="button"
                onClick={() => { tap(); onOpenPalette(); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary"
              >
                <Search className="size-3.5" /> Search
                <kbd className="ml-1 rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[9px]">
                  ⌘K
                </kbd>
              </button>
            </div>
          </header>

          <main className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {active && (
              <div key={`h-${activeId}`} className="mb-6">
                <span className="admin-eyebrow">
                  {groups.find((g) => g.items.some((i) => i.id === active.id))?.label ?? "Admin"}
                </span>
                <h1 className="admin-title mt-1 font-display text-3xl sm:text-4xl lg:text-[42px] lg:leading-[1.05]">
                  {active.label}
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold text-muted-foreground">
                  {active.desc}
                </p>
                <div
                  aria-hidden
                  className="mt-4 h-[2px] w-16 rounded-full bg-primary"
                />
              </div>
            )}
            <div key={activeId}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
