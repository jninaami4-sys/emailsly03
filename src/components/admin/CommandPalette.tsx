import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ArrowRight, ExternalLink } from "@/components/admin/AdminIcons";
import type { NavGroup } from "@/components/admin/AdminShell";

type Action = {
  id: string;
  label: string;
  group: string;
  hint?: string;
  keywords?: string;
  href?: string;
  onRun?: () => void;
};

export function CommandPalette({
  open,
  onClose,
  groups,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  groups: NavGroup[];
  onNavigate: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = useMemo<Action[]>(() => {
    const nav: Action[] = groups.flatMap((g) =>
      g.items.map((it) => ({
        id: `nav:${it.id}`,
        label: it.label,
        group: g.label,
        hint: it.desc,
        keywords: `${it.label} ${it.desc} ${g.label} ${it.keywords ?? ""}`,
        onRun: () => onNavigate(it.id),
      })),
    );
    const quick: Action[] = [
      { id: "go:site", label: "Open public site", group: "Quick actions", href: "/", hint: "View live storefront" },
      { id: "go:pricing", label: "Open Pricing page", group: "Quick actions", href: "/pricing" },
      { id: "go:store", label: "Open Store", group: "Quick actions", href: "/store" },
      { id: "go:blog", label: "Open Blog", group: "Quick actions", href: "/blog" },
      { id: "go:contact", label: "Open Contact", group: "Quick actions", href: "/contact" },
    ];
    return [...nav, ...quick];
  }, [groups, onNavigate]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return actions;
    return actions.filter((a) => (a.keywords ?? a.label).toLowerCase().includes(query));
  }, [actions, q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setI(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    setI(0);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setI((v) => Math.min(v + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setI((v) => Math.max(v - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const a = filtered[i];
        if (!a) return;
        if (a.href) {
          window.open(a.href, "_blank");
        } else {
          a.onRun?.();
        }
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, i, onClose]);

  if (!open) return null;

  // Group visible actions
  const byGroup = new Map<string, Action[]>();
  filtered.forEach((a) => {
    if (!byGroup.has(a.group)) byGroup.set(a.group, []);
    byGroup.get(a.group)!.push(a);
  });

  let flatIndex = -1;

  return (
    <div
      className="admin-theme fixed inset-0 z-[100] flex items-start justify-center bg-black/60 p-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sections, pages, actions…"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No matches for "{q}".
            </div>
          ) : (
            Array.from(byGroup.entries()).map(([grp, list]) => (
              <div key={grp} className="mb-2">
                <p className="px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {grp}
                </p>
                <ul>
                  {list.map((a) => {
                    flatIndex++;
                    const active = flatIndex === i;
                    return (
                      <li key={a.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setI(flatIndex)}
                          onClick={() => {
                            if (a.href) window.open(a.href, "_blank");
                            else a.onRun?.();
                            onClose();
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] ${
                            active
                              ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                              : "text-foreground/75 hover:bg-secondary"
                          }`}
                        >
                          <span className="flex-1 truncate">
                            <span className="font-medium">{a.label}</span>
                            {a.hint && (
                              <span className="ml-2 text-[11px] text-muted-foreground">
                                {a.hint}
                              </span>
                            )}
                          </span>
                          {a.href ? (
                            <ExternalLink className="size-3.5 text-muted-foreground" />
                          ) : (
                            <ArrowRight className="size-3.5 text-muted-foreground" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-secondary px-4 py-2 font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-3">
            <span><kbd className="rounded bg-background px-1">↑↓</kbd> navigate</span>
            <span><kbd className="rounded bg-background px-1">↵</kbd> select</span>
          </span>
          <span>{filtered.length} results</span>
        </div>
      </div>
    </div>
  );
}