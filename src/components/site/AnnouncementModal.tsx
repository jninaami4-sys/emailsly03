import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState } from "@tanstack/react-router";
import { X, Sparkles } from "lucide-react";
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

  const palette: Record<string, { bg: string; text: string; ring: string; soft: string; shadow: string }> = {
    violet: { bg: "bg-violet", text: "text-violet", ring: "border-violet/30", soft: "bg-violet/10", shadow: "shadow-violet/30" },
    emerald: { bg: "bg-emerald", text: "text-emerald", ring: "border-emerald/30", soft: "bg-emerald/10", shadow: "shadow-emerald/30" },
    amber: { bg: "bg-amber-500", text: "text-amber-500", ring: "border-amber-500/30", soft: "bg-amber-500/10", shadow: "shadow-amber-500/30" },
    rose: { bg: "bg-rose-500", text: "text-rose-500", ring: "border-rose-500/30", soft: "bg-rose-500/10", shadow: "shadow-rose-500/30" },
    sky: { bg: "bg-sky-500", text: "text-sky-500", ring: "border-sky-500/30", soft: "bg-sky-500/10", shadow: "shadow-sky-500/30" },
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
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95">
        {!preview && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-secondary hover:text-foreground"
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
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
              </div>
            );
          }
          return (
            <div className={`relative h-24 w-full bg-gradient-to-br ${p.soft} to-transparent`}>
              <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,hsl(var(--foreground)/0.15)_1px,transparent_0)] [background-size:16px_16px]" />
            </div>
          );
        })()}

        <div className="relative p-6 sm:p-8">
          {(() => {
            const style = a.image_style || (a.image_url ? "cover" : "none");
            if (style === "thumbnail" && a.image_url) {
              return (
                <div className={`mb-4 inline-flex size-20 overflow-hidden rounded-2xl border ${p.ring} bg-secondary shadow-lg ${p.shadow}`}>
                  <img src={a.image_url} alt="" className="h-full w-full object-cover" loading="eager" />
                </div>
              );
            }
            return null;
          })()}
          {a.badge && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border ${p.ring} ${p.soft} px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest ${p.text}`}
            >
              <Sparkles className="size-3" />
              {a.badge}
            </span>
          )}
          <h2
            id="announcement-title"
            className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl"
          >
            {a.title}
          </h2>
          {a.body && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
              {a.body}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {a.cta_url && a.cta_label && (
              <a
                href={a.cta_url}
                onClick={onClose}
                className={`inline-flex items-center justify-center rounded-xl ${p.bg} px-5 py-2.5 text-sm font-semibold text-white shadow-lg ${p.shadow} transition-transform hover:scale-[1.02]`}
              >
                {a.cta_label}
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
