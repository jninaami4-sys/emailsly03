import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { listActiveAnnouncements, type Announcement } from "@/lib/announcements.functions";
import { supabase } from "@/integrations/supabase/client";

const DISMISS_PREFIX = "lyra_announce_dismissed:";

function pathMatches(pattern: string, pathname: string): boolean {
  const p = pattern.trim();
  if (!p || p === "*") return true;
  if (p.endsWith("/*")) {
    const prefix = p.slice(0, -2);
    return pathname === prefix || pathname.startsWith(prefix + "/");
  }
  if (p.endsWith("*")) return pathname.startsWith(p.slice(0, -1));
  return pathname === p;
}

type Viewer = { userId: string | null; isAdmin: boolean };

function useViewer(): Viewer | null {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      let isAdmin = false;
      if (uid) {
        try {
          const { data: adminData } = await supabase.rpc("has_role", {
            _user_id: uid,
            _role: "admin",
          });
          isAdmin = !!adminData;
        } catch {
          isAdmin = false;
        }
      }
      if (alive) setViewer({ userId: uid, isAdmin });
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return viewer;
}

function audienceMatches(a: Announcement, v: Viewer): boolean {
  switch (a.audience) {
    case "guests":
      return v.userId === null;
    case "authenticated":
      return v.userId !== null;
    case "admins":
      return v.isAdmin;
    case "all":
    default:
      return true;
  }
}

export function AnnouncementModal() {
  const fetchFn = useServerFn(listActiveAnnouncements);
  const { data: list } = useQuery({
    queryKey: ["active-announcements"],
    queryFn: () => fetchFn(),
    staleTime: 60_000,
    retry: false,
  });

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const viewer = useViewer();

  const data = useMemo<Announcement | null>(() => {
    if (!list || !list.length || !viewer) return null;
    const now = Date.now();
    return (
      list.find(
        (a) =>
          (a.path_patterns?.length ? a.path_patterns : ["*"]).some((p) => pathMatches(p, pathname)) &&
          audienceMatches(a, viewer) &&
          (!a.start_at || new Date(a.start_at).getTime() <= now) &&
          (!a.end_at || new Date(a.end_at).getTime() > now),
      ) ?? null
    );
  }, [list, viewer, pathname]);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!data) {
      setOpen(false);
      return;
    }
    const key = `${DISMISS_PREFIX}${data.id}:${data.updated_at}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      // ignore
    }
    const t = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(t);
  }, [data]);

  const dismiss = () => {
    if (data) {
      try {
        localStorage.setItem(`${DISMISS_PREFIX}${data.id}:${data.updated_at}`, "1");
      } catch {
        // ignore
      }
    }
    setOpen(false);
  };

  if (!open || !data) return null;
  return <ModalContent a={data} onClose={dismiss} />;
}

export function AnnouncementPreview({ a }: { a: Announcement }) {
  return <ModalContent a={a} onClose={() => {}} preview />;
}

function ModalContent({ a, onClose, preview = false }: { a: Announcement; onClose: () => void; preview?: boolean }) {
  useEffect(() => {
    if (preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, preview]);

  const palette: Record<
    string,
    { bg: string; text: string; ring: string; soft: string; shadow: string; glowFrom: string; glowTo: string; hairline: string }
  > = {
    violet: {
      bg: "bg-gradient-to-b from-violet to-[oklch(0.45_0.22_293)]",
      text: "text-violet",
      ring: "border-violet/30",
      soft: "bg-violet/10",
      shadow: "shadow-[0_20px_60px_-20px_oklch(0.52_0.24_293/0.55)]",
      glowFrom: "from-violet/40",
      glowTo: "to-[oklch(0.55_0.22_310)]/25",
      hairline: "before:bg-gradient-to-b before:from-violet/60 before:to-transparent",
    },
    emerald: {
      bg: "bg-gradient-to-b from-emerald to-[oklch(0.55_0.15_165)]",
      text: "text-emerald",
      ring: "border-emerald/30",
      soft: "bg-emerald/10",
      shadow: "shadow-[0_20px_60px_-20px_oklch(0.66_0.16_165/0.5)]",
      glowFrom: "from-emerald/40",
      glowTo: "to-[oklch(0.7_0.18_190)]/25",
      hairline: "before:bg-gradient-to-b before:from-emerald/60 before:to-transparent",
    },
    amber: {
      bg: "bg-gradient-to-b from-amber-500 to-amber-600",
      text: "text-amber-500",
      ring: "border-amber-500/30",
      soft: "bg-amber-500/10",
      shadow: "shadow-[0_20px_60px_-20px_oklch(0.75_0.16_75/0.5)]",
      glowFrom: "from-amber-400/40",
      glowTo: "to-rose-500/20",
      hairline: "before:bg-gradient-to-b before:from-amber-500/60 before:to-transparent",
    },
    rose: {
      bg: "bg-gradient-to-b from-rose-500 to-rose-600",
      text: "text-rose-500",
      ring: "border-rose-500/30",
      soft: "bg-rose-500/10",
      shadow: "shadow-[0_20px_60px_-20px_oklch(0.65_0.22_15/0.5)]",
      glowFrom: "from-rose-500/40",
      glowTo: "to-violet/25",
      hairline: "before:bg-gradient-to-b before:from-rose-500/60 before:to-transparent",
    },
    sky: {
      bg: "bg-gradient-to-b from-sky-500 to-sky-600",
      text: "text-sky-500",
      ring: "border-sky-500/30",
      soft: "bg-sky-500/10",
      shadow: "shadow-[0_20px_60px_-20px_oklch(0.7_0.16_235/0.5)]",
      glowFrom: "from-sky-500/40",
      glowTo: "to-violet/25",
      hairline: "before:bg-gradient-to-b before:from-sky-500/60 before:to-transparent",
    },
  };
  const p = palette[a.accent] ?? palette.violet;

  return (
    <div
      className={
        preview
          ? "relative flex h-full w-full items-center justify-center p-4"
          : "fixed inset-0 z-[100] flex items-center justify-center p-4"
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
    >
      {!preview && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        className={`relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-card to-[oklch(0.13_0.01_260)] ${p.shadow} ring-1 ring-white/5 animate-in fade-in zoom-in-95 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px ${p.hairline}`}
      >
        {!preview && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full border border-white/10 bg-background/60 text-muted-foreground backdrop-blur-md transition-all hover:border-white/20 hover:bg-background/80 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}

        {(() => {
          const style = a.image_style || (a.image_url ? "cover" : "none");
          if (style === "cover" && a.image_url) {
            return (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-secondary">
                <img src={a.image_url} alt="" className="h-full w-full object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                <div className={`pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[140%] -translate-x-1/2 rounded-full bg-gradient-to-t ${p.glowFrom} ${p.glowTo} blur-3xl opacity-70`} />
              </div>
            );
          }
          // Elegant, iconless header: layered gradient orbs behind a soft veil.
          return (
            <div className="relative h-32 w-full overflow-hidden">
              <div className={`absolute -top-20 left-1/2 size-72 -translate-x-1/2 rounded-full bg-gradient-to-br ${p.glowFrom} ${p.glowTo} blur-3xl`} />
              <div className={`absolute -bottom-24 right-0 size-56 rounded-full bg-gradient-to-tr ${p.glowFrom} to-transparent blur-3xl opacity-70`} />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
            </div>
          );
        })()}

        <div className="relative -mt-6 p-6 sm:p-8">
          {(() => {
            const style = a.image_style || (a.image_url ? "cover" : "none");
            if (style === "thumbnail" && a.image_url) {
              return (
                <div className={`mb-4 inline-flex size-20 overflow-hidden rounded-2xl border ${p.ring} bg-secondary shadow-lg`}>
                  <img src={a.image_url} alt="" className="h-full w-full object-cover" loading="eager" />
                </div>
              );
            }
            return null;
          })()}
          {a.badge && (
            <span
              className={`inline-flex items-center gap-2 rounded-full border ${p.ring} ${p.soft} px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${p.text} backdrop-blur`}
            >
              <span className={`size-1.5 rounded-full ${p.text.replace("text-", "bg-")} shadow-[0_0_8px_currentColor]`} />
              {a.badge}
            </span>
          )}
          <h2
            id="announcement-title"
            className="mt-4 font-display text-[26px] font-bold leading-[1.1] tracking-tight sm:text-[32px]"
          >
            {a.title}
          </h2>
          {a.body && (
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
              {a.body}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            {a.cta_url && a.cta_label && (
              <a
                href={a.cta_url}
                onClick={onClose}
                className={`group relative inline-flex items-center justify-center overflow-hidden rounded-xl ${p.bg} px-5 py-2.5 text-sm font-semibold text-white ${p.shadow} ring-1 ring-white/15 transition-all hover:-translate-y-0.5 hover:brightness-110`}
              >
                <span className="absolute inset-x-0 top-0 h-px bg-white/40" />
                <span className="relative">{a.cta_label}</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-foreground/80 backdrop-blur transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-foreground"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
