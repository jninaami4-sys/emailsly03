import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X, Sparkles } from "lucide-react";
import { getActiveAnnouncement, type Announcement } from "@/lib/announcements.functions";

const DISMISS_PREFIX = "lyra_announce_dismissed:";

export function AnnouncementModal() {
  const fetchFn = useServerFn(getActiveAnnouncement);
  const { data } = useQuery({
    queryKey: ["active-announcement"],
    queryFn: () => fetchFn(),
    staleTime: 60_000,
    retry: false,
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!data) return;
    const key = `${DISMISS_PREFIX}${data.id}:${data.updated_at}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      // ignore
    }
    // Small delay so it doesn't fight LCP
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

function ModalContent({ a, onClose }: { a: Announcement; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        {a.image_url ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-secondary">
            <img
              src={a.image_url}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          </div>
        ) : (
          <div className={`relative h-32 w-full bg-gradient-to-br ${p.soft} to-transparent`}>
            <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,hsl(var(--foreground)/0.15)_1px,transparent_0)] [background-size:16px_16px]" />
          </div>
        )}

        <div className="relative p-6 sm:p-8">
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
                className={`inline-flex items-center justify-center rounded-xl bg-${accent} px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-${accent}/30 transition-transform hover:scale-[1.02]`}
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
