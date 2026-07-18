import { ArrowRight, Sparkles } from "@/components/admin/AdminIcons";
import type { NavGroup, NavItem } from "@/components/admin/AdminShell";

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
      {/* Hero card — minimal */}
      <div className="admin-glow-card p-6 sm:p-9">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-600/25 bg-emerald-600/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-600" />
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
        <p className="mt-3 max-w-xl text-sm font-semibold text-muted-foreground sm:text-base">
          Your control deck for everything Emailsly. Press{" "}
          <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-black text-foreground">
            ⌘K
          </kbd>{" "}
          to jump anywhere.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelect("site-content")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-black uppercase tracking-wide text-primary-foreground hover:opacity-90"
          >
            <Sparkles className="size-4" />
            Edit site content
            <ArrowRight className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelect("orders")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-black uppercase tracking-wide text-foreground hover:bg-secondary"
          >
            View orders
            <ArrowRight className="size-3.5" />
          </button>
        </div>

        <div className="mt-8 grid gap-4 border-t border-border pt-6 text-xs sm:grid-cols-3">
          {[
            { label: "Signed in", value: userEmail ?? "Admin" },
            {
              label: "Local time",
              value: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
            {
              label: "Today",
              value: new Date().toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              }),
            },
          ].map((m) => (
            <div key={m.label} className="flex items-center gap-2.5">
              <span className="size-1.5 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                  {m.label}
                </p>
                <p className="truncate text-[12px] font-black text-foreground tabular-nums">
                  {m.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start here */}
      {pinned.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-display text-lg font-black uppercase tracking-tight text-foreground">
              Start here
            </h3>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40 hover:bg-secondary"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black uppercase tracking-tight text-foreground">
                      {item.label}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* All tools */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-display text-lg font-black uppercase tracking-tight text-foreground">
            All tools
          </h3>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Grouped by purpose
          </span>
        </div>
      </div>
      {groups
        .filter((g) => g.id !== "overview")
        .map((g) => (
          <section key={g.id}>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="admin-eyebrow">{g.label}</h3>
              <span className="font-mono text-[10px] font-bold text-muted-foreground">
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
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40 hover:bg-secondary"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-black uppercase tracking-tight text-foreground">
                        {item.label}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </section>
        ))}

      {/* Keyboard tips */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Power-user shortcuts
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { keys: ["⌘", "K"], label: "Command palette" },
            { keys: ["G", "O"], label: "Go to overview" },
            { keys: ["Esc"], label: "Close overlays" },
            { keys: ["↑", "↓"], label: "Navigate palette" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <span className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-black text-foreground">
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
