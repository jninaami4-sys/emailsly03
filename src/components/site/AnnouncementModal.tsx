import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { listActiveAnnouncements, type Announcement } from "@/lib/announcements.functions";

type ExtendedAnnouncement = Announcement & { card_style?: string; title_emoji?: string };
import { useAuth } from "@/hooks/use-auth";

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
  const { user, loading } = useAuth();
  if (loading) return null;
  return { userId: user?.id ?? null, isAdmin: Boolean(user?.is_admin) };
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
  const fetchFn = listActiveAnnouncements;
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
  const ext = a as ExtendedAnnouncement;
  const cardStyle = (ext.card_style || "glass") as "glass" | "solid" | "gradient" | "minimal";
  const titleEmoji = ext.title_emoji || "";

  const cardClassByStyle: Record<typeof cardStyle, string> = {
    glass:
      `bg-gradient-to-b from-card to-[oklch(0.13_0.01_260)] ring-1 ring-white/5 border border-white/10 ${p.shadow}`,
    solid: `bg-card border border-white/10 ${p.shadow}`,
    gradient: `${p.bg} text-white border border-white/15 ${p.shadow}`,
    minimal: "bg-background border border-white/10",
  };

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
        className={`relative w-full max-w-md overflow-hidden rounded-2xl animate-in fade-in zoom-in-95 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px ${p.hairline} ${cardClassByStyle[cardStyle]}`}
      >
        {!preview && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex size-7 items-center justify-center rounded-full border border-white/10 bg-background/60 text-muted-foreground backdrop-blur-md transition-all hover:border-white/20 hover:bg-background/80 hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}

        {(() => {
          const style = a.image_style || (a.image_url ? "cover" : "none");
          if (style === "cover" && a.image_url) {
            return (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-secondary">
                <img src={a.image_url} alt="" className="h-full w-full object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent" />
              </div>
            );
          }
          // Minimal: a single soft accent glow at the top corner.
          return (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 overflow-hidden">
              <div className={`absolute -top-16 -left-10 size-40 rounded-full bg-gradient-to-br ${p.glowFrom} ${p.glowTo} blur-3xl opacity-60`} />
            </div>
          );
        })()}

        <div className="relative p-6 sm:p-7">
          {(() => {
            const style = a.image_style || (a.image_url ? "cover" : "none");
            if (style === "thumbnail" && a.image_url) {
              return (
                <div className={`mb-4 inline-flex size-14 overflow-hidden rounded-xl border ${p.ring} bg-secondary`}>
                  <img src={a.image_url} alt="" className="h-full w-full object-cover" loading="eager" />
                </div>
              );
            }
            return null;
          })()}
          {a.badge && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full ${p.soft} px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] ${p.text}`}
            >
              <span className={`size-1 rounded-full ${p.text.replace("text-", "bg-")}`} />
              {a.badge}
            </span>
          )}
          <h2
            id="announcement-title"
            className="mt-3 font-display text-[22px] font-semibold leading-tight tracking-tight sm:text-[26px]"
          >
            {titleEmoji ? <span className="mr-2 align-middle">{titleEmoji}</span> : null}
            {a.title}
          </h2>
          {a.body && (
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-muted-foreground">
              {a.body}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {a.cta_url && a.cta_label && (
              <a
                href={a.cta_url}
                onClick={onClose}
                className={`group relative inline-flex items-center justify-center rounded-lg ${p.bg} px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 transition-all hover:brightness-110`}
              >
                {a.cta_label}
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
