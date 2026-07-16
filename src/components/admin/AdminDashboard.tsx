import { ArrowRight, Sparkles } from "@/components/admin/AdminIcons";
import type { NavGroup, NavItem } from "@/components/admin/AdminShell";

// The handful of tools most admins reach for daily. Rendered as a big,
// obvious "Start here" row so the deck doesn't feel overwhelming.
const PINNED_IDS = [
  "orders",
  "site-content",
  "pricing",
  "reviews",
  "support",
  "announcements",
] as const;

export function AdminDashboard({
  groups,
  onSelect,
  userEmail,
}: {
  groups: NavGroup[];
  onSelect: (id: string) => void;
  userEmail?: string | null;
}) {
  const allItems = groups.flatMap((g) => g.items);
  const pinned: NavItem[] = PINNED_IDS
    .map((id) => allItems.find((i) => i.id === id))
    .filter((i): i is NavItem => !!i);

  return (
    <div className="space-y-8">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0e131c] p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            All systems operational
          </div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Welcome back{userEmail ? `, ${userEmail.split("@")[0]}` : ""}.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Pick a tool below to get started. Everything is grouped by what it
            does — no need to memorize where things live. Press{" "}
            <kbd className="rounded border border-white/10 bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>{" "}
            any time to jump straight to a section.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelect("site-content")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2563eb]"
            >
              <Sparkles className="size-4" />
              Edit site content
            </button>
            <button
              type="button"
              onClick={() => onSelect("orders")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/80 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              View orders
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Start here — pinned everyday tools */}
      {pinned.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-display text-base font-semibold text-white">
              Start here
            </h3>
            <span className="font-mono text-[10px] text-white/40">
              Most used
            </span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {pinned.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0e131c] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#3b82f6]/40 hover:bg-[#111826]"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#3b82f6]/12 text-[#60a5fa] ring-1 ring-[#3b82f6]/25 transition-colors group-hover:bg-[#3b82f6]/20">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {item.label}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-white/60">
                      {item.desc}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-white/40 transition-all group-hover:translate-x-0.5 group-hover:text-[#60a5fa]" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Everything else, grouped by purpose */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-display text-base font-semibold text-white">
            All tools
          </h3>
          <span className="font-mono text-[10px] text-white/40">
            Grouped by purpose
          </span>
        </div>
      </div>
      {groups
        .filter((g) => g.id !== "overview")
        .map((g) => (
          <section key={g.id}>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                {g.label}
              </h3>
              <span className="font-mono text-[10px] text-white/30">
                {g.items.length} {g.items.length === 1 ? "tool" : "tools"}
              </span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className="group relative flex items-start gap-3 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0e131c] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#3b82f6]/40 hover:bg-[#111826]"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/70 transition-colors group-hover:bg-[#3b82f6]/15 group-hover:text-[#60a5fa]">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-white">
                        {item.label}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-white/50">
                        {item.desc}
                      </p>
                    </div>
                    <ArrowRight className="size-3.5 shrink-0 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:text-[#60a5fa]" />
                  </button>
                );
              })}
            </div>
          </section>
        ))}

      {/* Keyboard tips */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0e131c] p-5">
        <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
          Power-user shortcuts
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { keys: ["⌘", "K"], label: "Command palette" },
            { keys: ["G", "O"], label: "Go to overview" },
            { keys: ["Esc"], label: "Close overlays" },
            { keys: ["↑", "↓"], label: "Navigate palette" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-xs text-white/60">
              <span className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white/80">
                    {k}
                  </kbd>
                ))}
              </span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}