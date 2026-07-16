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
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.15_0.01_260)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <Search className="size-4 text-white/40" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sections, pages, actions…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
          />
          <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-white/40">
              No matches for "{q}".
            </div>
          ) : (
            Array.from(byGroup.entries()).map(([grp, list]) => (
              <div key={grp} className="mb-2">
                <p className="px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
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
                              ? "bg-violet/20 text-white shadow-[inset_0_0_0_1px_oklch(0.52_0.24_293/0.4)]"
                              : "text-white/70"
                          }`}
                        >
                          <span className="flex-1 truncate">
                            <span className="font-medium">{a.label}</span>
                            {a.hint && (
                              <span className="ml-2 text-[11px] text-white/40">
                                {a.hint}
                              </span>
                            )}
                          </span>
                          {a.href ? (
                            <ExternalLink className="size-3.5 text-white/40" />
                          ) : (
                            <ArrowRight className="size-3.5 text-white/40" />
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

        <div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-4 py-2 font-mono text-[10px] text-white/40">
          <span className="flex items-center gap-3">
            <span><kbd className="rounded bg-white/10 px-1">↑↓</kbd> navigate</span>
            <span><kbd className="rounded bg-white/10 px-1">↵</kbd> select</span>
          </span>
          <span>{filtered.length} results</span>
        </div>
      </div>
    </div>
  );
}