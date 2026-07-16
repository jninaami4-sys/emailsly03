import { ArrowRight, Sparkles } from "@/components/admin/AdminIcons";
import type { NavGroup } from "@/components/admin/AdminShell";

export function AdminDashboard({
  groups,
  onSelect,
  userEmail,
}: {
  groups: NavGroup[];
  onSelect: (id: string) => void;
  userEmail?: string | null;
}) {
  return (
    <div className="space-y-8">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[oklch(0.18_0.02_280)] via-[oklch(0.14_0.01_260)] to-[oklch(0.16_0.05_290)] p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-violet/20 blur-3xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white/60">
            <span className="size-1.5 rounded-full bg-emerald shadow-[0_0_8px] shadow-emerald" />
            All systems operational
          </div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Welcome back{userEmail ? `, ${userEmail.split("@")[0]}` : ""}.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Your entire site, in one deck. Jump anywhere with{" "}
            <kbd className="rounded border border-white/10 bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
            , or pick a workspace below.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelect("site-content")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_oklch(0.52_0.24_293/0.6)] hover:brightness-110"
            >
              <Sparkles className="size-4" />
              Edit site content
            </button>
            <button
              type="button"
              onClick={() => onSelect("orders")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:border-white/20 hover:bg-white/10"
            >
              View orders
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Workspaces */}
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
                    className="group relative flex items-start gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-violet/40 hover:bg-white/[0.04] hover:shadow-[0_10px_30px_-15px_oklch(0.52_0.24_293/0.5)]"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/70 transition-colors group-hover:bg-violet/15 group-hover:text-violet">
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
                    <ArrowRight className="size-3.5 shrink-0 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:text-violet" />
                  </button>
                );
              })}
            </div>
          </section>
        ))}

      {/* Keyboard tips */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
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