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
      <div className="admin-glow-card relative overflow-hidden p-6 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage:
              "radial-gradient(ellipse at 20% 0%, black 30%, transparent 75%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[#facc15]/15 blur-[110px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-[#3b82f6]/15 blur-[120px]"
        />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#facc15]/30 bg-[#facc15]/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#fde68a]">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#facc15] opacity-70" />
              <span className="relative size-1.5 rounded-full bg-[#facc15]" />
            </span>
            All systems operational
          </div>
          <h2 className="font-display text-3xl leading-[1.05] sm:text-4xl lg:text-5xl">
            <span className="admin-title">Welcome back</span>
            {userEmail && (
              <>
                {", "}
                <span className="admin-title-accent">
                  {userEmail.split("@")[0]}
                </span>
              </>
            )}
            .
          </h2>
          <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-white/70 sm:text-base">
            Your control deck for everything Emailsly. Grouped by purpose — no
            memorization required. Press{" "}
            <kbd className="rounded border border-white/10 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-bold">
              ⌘K
            </kbd>{" "}
            to jump anywhere.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelect("site-content")}
              className="group inline-flex items-center gap-1.5 rounded-lg bg-[#facc15] px-4 py-2.5 text-sm font-black uppercase tracking-wide text-black shadow-[0_10px_30px_-10px_rgba(250,204,21,0.55)] transition-transform hover:-translate-y-0.5 hover:bg-[#fbbf24]"
            >
              <Sparkles className="size-4" />
              Edit site content
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={() => onSelect("orders")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white/85 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            >
              View orders
              <ArrowRight className="size-3.5" />
            </button>
          </div>

          {/* Live meta strip */}
          <div className="mt-8 grid gap-4 border-t border-white/[0.06] pt-6 text-xs sm:grid-cols-3">
            {[
              { label: "Signed in", value: userEmail ?? "Admin", accent: "#facc15" },
              {
                label: "Local time",
                value: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                accent: "#3b82f6",
              },
              {
                label: "Today",
                value: new Date().toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                }),
                accent: "#22c55e",
              },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-2.5">
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ background: m.accent, boxShadow: `0 0 12px ${m.accent}` }}
                />
                <div className="min-w-0">
                  <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-white/40">
                    {m.label}
                  </p>
                  <p className="truncate text-[12px] font-bold text-white/90 tabular-nums">
                    {m.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Start here — pinned everyday tools */}
      {pinned.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-display text-lg font-black uppercase tracking-tight text-white">
              Start here
            </h3>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/40">
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
                  className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0e131c] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#facc15]/40 hover:bg-[#111826] hover:shadow-[0_12px_30px_-15px_rgba(250,204,21,0.35)]"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#facc15]/12 text-[#facc15] ring-1 ring-[#facc15]/25 transition-colors group-hover:bg-[#facc15]/20">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black uppercase tracking-tight text-white">
                      {item.label}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-white/60">
                      {item.desc}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-white/40 transition-all group-hover:translate-x-0.5 group-hover:text-[#facc15]" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Everything else, grouped by purpose */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-display text-lg font-black uppercase tracking-tight text-white">
            All tools
          </h3>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/40">
            Grouped by purpose
          </span>
        </div>
      </div>
      {groups
        .filter((g) => g.id !== "overview")
        .map((g) => (
          <section key={g.id}>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="admin-eyebrow">
                {g.label}
              </h3>
              <span className="font-mono text-[10px] font-bold text-white/30">
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
                    className="group relative flex items-start gap-3 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0e131c] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#facc15]/40 hover:bg-[#111826]"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/70 transition-colors group-hover:bg-[#facc15]/15 group-hover:text-[#facc15]">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-black uppercase tracking-tight text-white">
                        {item.label}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] font-medium text-white/55">
                        {item.desc}
                      </p>
                    </div>
                    <ArrowRight className="size-3.5 shrink-0 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:text-[#facc15]" />
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