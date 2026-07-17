import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Megaphone, Plus, Save, Trash2, Eye, EyeOff, Loader2, Upload, ImageIcon, ImageOff, Monitor, Smartphone, Target, Users, CalendarClock, ArrowUpDown, ChevronUp, ChevronDown, Crop as CropIcon } from "@/components/admin/AdminIcons";
import {
  listAnnouncements,
  upsertAnnouncement,
  deleteAnnouncement,
  type Announcement,
  type AnnouncementImageStyle,
  type AnnouncementAudience,
  type AnnouncementCardStyle,
} from "@/lib/announcements.functions";
import { AnnouncementPreview } from "@/components/site/AnnouncementModal";
import { ImageCropperModal } from "@/components/admin/ImageCropperModal";
import { supabase } from "@/integrations/supabase/client";

const emptyDraft = {
  id: null as string | null,
  enabled: true,
  title: "",
  body: "",
  cta_label: "",
  cta_url: "",
  image_url: "",
  image_style: "cover" as AnnouncementImageStyle,
  badge: "",
  accent: "violet",
  card_style: "glass" as AnnouncementCardStyle,
  title_emoji: "",
  path_patterns: ["*"] as string[],
  audience: "all" as AnnouncementAudience,
  start_at: "" as string,
  end_at: "" as string,
  priority: 0 as number,
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatSchedule(a: Announcement, now: Date): { label: string; tone: "live" | "scheduled" | "ended" | "always" } {
  const start = a.start_at ? new Date(a.start_at) : null;
  const end = a.end_at ? new Date(a.end_at) : null;
  if (end && end < now) return { label: `Ended ${end.toLocaleString()}`, tone: "ended" };
  if (start && start > now) return { label: `Starts ${start.toLocaleString()}`, tone: "scheduled" };
  if (start || end) {
    const parts: string[] = [];
    if (start) parts.push(`from ${start.toLocaleString()}`);
    if (end) parts.push(`until ${end.toLocaleString()}`);
    return { label: `Live · ${parts.join(" ")}`, tone: "live" };
  }
  return { label: "Always on", tone: "always" };
}

const ACCENTS = ["violet", "emerald", "amber", "rose", "sky", "blue", "fuchsia", "teal", "orange", "slate"] as const;

const CARD_STYLES: { value: AnnouncementCardStyle; label: string; hint: string }[] = [
  { value: "glass", label: "Glass", hint: "Frosted blur + soft glow" },
  { value: "solid", label: "Solid", hint: "Clean flat card" },
  { value: "gradient", label: "Gradient", hint: "Bold color wash" },
  { value: "minimal", label: "Minimal", hint: "Text-forward, thin border" },
];

const EMOJI_QUICK = ["🎉", "🔥", "✨", "🚀", "💎", "⚡", "🎁", "💥", "🏆", "📣", "❤️", "⭐", "🛒", "💡", "🎯", "🕒"];

const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string; hint: string }[] = [
  { value: "all", label: "Everyone", hint: "Signed in or not" },
  { value: "guests", label: "Guests only", hint: "Not signed in" },
  { value: "authenticated", label: "Signed-in users", hint: "Any logged-in customer" },
  { value: "admins", label: "Admins only", hint: "Admin accounts" },
];

const STYLE_OPTIONS: { value: AnnouncementImageStyle; label: string; hint: string; Icon: typeof ImageIcon }[] = [
  { value: "cover", label: "Cover photo", hint: "Large 16:9 hero image", Icon: ImageIcon },
  { value: "thumbnail", label: "Thumbnail", hint: "Small product-style square", Icon: ImageIcon },
  { value: "none", label: "No image", hint: "Text-only with accent gradient", Icon: ImageOff },
];

export function AnnouncementsAdmin() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAnnouncements);
  const upsertFn = useServerFn(upsertAnnouncement);
  const deleteFn = useServerFn(deleteAnnouncement);

  const { data: list = [], isLoading, error } = useQuery({
    queryKey: ["announcements", "admin"],
    queryFn: () => listFn(),
    retry: false,
  });

  const [draft, setDraft] = useState(emptyDraft);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [lockAspect, setLockAspect] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadEdit = (a: Announcement) => {
    setDraft({
      id: a.id,
      enabled: a.enabled,
      title: a.title,
      body: a.body,
      cta_label: a.cta_label,
      cta_url: a.cta_url,
      image_url: a.image_url,
      image_style: (a.image_style || "cover") as AnnouncementImageStyle,
      badge: a.badge,
      accent: a.accent || "violet",
      card_style: ((a.card_style as AnnouncementCardStyle) || "glass"),
      title_emoji: a.title_emoji || "",
      path_patterns: a.path_patterns && a.path_patterns.length ? a.path_patterns : ["*"],
      audience: (a.audience || "all") as AnnouncementAudience,
      start_at: toDatetimeLocal(a.start_at),
      end_at: toDatetimeLocal(a.end_at),
      priority: typeof a.priority === "number" ? a.priority : 0,
    });
  };

  const handleUpload = async (fileOrBlob: File | Blob, filename?: string) => {
    if (!fileOrBlob) return;
    if (fileOrBlob.size > 5 * 1024 * 1024) {
      setStatus("Image too large (max 5MB)");
      return;
    }
    setUploading(true);
    try {
      const name = filename || (fileOrBlob as File).name || "image.png";
      const ext = (name.split(".").pop() || "png").toLowerCase();
      const path = `${crypto.randomUUID()}.${ext}`;
      const contentType = (fileOrBlob as File).type || "image/png";
      const { error: upErr } = await supabase.storage
        .from("announcement-media")
        .upload(path, fileOrBlob, { contentType, upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("announcement-media").getPublicUrl(path);
      setDraft((d) => ({
        ...d,
        image_url: data.publicUrl,
        image_style: d.image_style === "none" ? "cover" : d.image_style,
      }));
      setStatus("Image uploaded");
    } catch (e) {
      setStatus((e as Error).message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const cropAspect = draft.image_style === "thumbnail" ? 1 : 16 / 9;
  const cropAspectLabel = draft.image_style === "thumbnail" ? "1:1" : "16:9";

  const handleFilePicked = (f: File) => {
    if (!f) return;
    if (lockAspect && draft.image_style !== "none") {
      setPendingFile(f);
    } else {
      handleUpload(f);
    }
  };



  const save = useMutation({
    mutationFn: (input: typeof emptyDraft) => upsertFn({ data: input }),
    onSuccess: () => {
      setStatus("Saved");
      qc.invalidateQueries({ queryKey: ["announcements", "admin"] });
      qc.invalidateQueries({ queryKey: ["active-announcements"] });
      setDraft(emptyDraft);
    },
    onError: (e: Error) => setStatus(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements", "admin"] });
      qc.invalidateQueries({ queryKey: ["active-announcements"] });
      setDraft(emptyDraft);
    },
  });

  // list is sorted by priority DESC then updated_at DESC on the server.
  const reorder = useMutation({
    mutationFn: async ({ a, dir }: { a: Announcement; dir: "up" | "down" }) => {
      const idx = list.findIndex((x) => x.id === a.id);
      const neighbor = dir === "up" ? list[idx - 1] : list[idx + 1];
      if (!neighbor) return { skipped: true as const };
      const nextPriority =
        dir === "up" ? (neighbor.priority ?? 0) + 1 : (neighbor.priority ?? 0) - 1;
      await upsertFn({
        data: {
          id: a.id,
          enabled: a.enabled,
          title: a.title,
          body: a.body,
          cta_label: a.cta_label,
          cta_url: a.cta_url,
          image_url: a.image_url,
          image_style: (a.image_style || "cover") as AnnouncementImageStyle,
          badge: a.badge,
          accent: a.accent || "violet",
          card_style: ((a.card_style as AnnouncementCardStyle) || "glass"),
          title_emoji: a.title_emoji || "",
          path_patterns: a.path_patterns?.length ? a.path_patterns : ["*"],
          audience: (a.audience || "all") as AnnouncementAudience,
          start_at: a.start_at,
          end_at: a.end_at,
          priority: nextPriority,
        },
      });
      return { skipped: false as const };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements", "admin"] });
      qc.invalidateQueries({ queryKey: ["active-announcements"] });
    },
    onError: (e: Error) => setStatus(e.message),
  });

  useEffect(() => {
    if (!status) return;
    const t = window.setTimeout(() => setStatus(null), 2500);
    return () => window.clearTimeout(t);
  }, [status]);

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet/10 text-violet">
            <Megaphone className="size-4" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">Announcements & marketing</h2>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              First-visit popup shown to visitors
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDraft(emptyDraft)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-secondary"
        >
          <Plus className="size-3" /> New
        </button>
      </header>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,320px)_1fr]">
        {/* List */}
        <aside className="border-b border-border p-3 lg:border-b-0 lg:border-r">
          {error && (
            <p className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-500">
              {(error as Error).message}
            </p>
          )}
          {isLoading && (
            <p className="p-4 text-xs text-muted-foreground">Loading…</p>
          )}
          {!isLoading && list.length === 0 && !error && (
            <p className="p-4 text-xs text-muted-foreground">
              No announcements yet. Create one on the right.
            </p>
          )}
          <ul className="space-y-1.5">
            {list.map((a) => (
              <li key={a.id}>
                <div
                  className={`flex items-start gap-2 rounded-xl border p-2.5 transition-colors ${
                    draft.id === a.id
                      ? "border-violet bg-violet/5"
                      : "border-border hover:bg-secondary/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => loadEdit(a)}
                    className="flex min-w-0 flex-1 items-start gap-2 text-left"
                  >
                    <span
                      className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full ${
                        a.enabled
                          ? "bg-emerald/15 text-emerald"
                          : "bg-muted text-muted-foreground"
                      }`}
                      aria-label={a.enabled ? "Enabled" : "Disabled"}
                    >
                      {a.enabled ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-violet/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-violet">
                          #{a.priority ?? 0}
                        </span>
                        <p className="truncate text-sm font-semibold">{a.title || "Untitled"}</p>
                      </div>
                      {(() => {
                        const s = formatSchedule(a, new Date());
                        const toneClass =
                          s.tone === "live"
                            ? "bg-emerald/10 text-emerald"
                            : s.tone === "scheduled"
                            ? "bg-amber-500/10 text-amber-600"
                            : s.tone === "ended"
                            ? "bg-rose-500/10 text-rose-500"
                            : "bg-muted text-muted-foreground";
                        return (
                          <span
                            className={`mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${toneClass}`}
                          >
                            <CalendarClock className="size-2.5 shrink-0" />
                            <span className="truncate">{s.label}</span>
                          </span>
                        );
                      })()}
                    </div>
                  </button>
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button
                      type="button"
                      title="Move up"
                      disabled={reorder.isPending}
                      onClick={() => reorder.mutate({ a, dir: "up" })}
                      className="flex size-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Move down"
                      disabled={reorder.isPending}
                      onClick={() => reorder.mutate({ a, dir: "down" })}
                      className="flex size-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Editor */}
        <div className="p-4 sm:p-6">
          <div className="grid gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                className="size-4 accent-violet"
              />
              <span className="text-sm font-medium">
                Show this announcement on the site
              </span>
            </label>

            <Field label="Title *">
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Big news — Black Friday 40% off"
                className="input"
              />
            </Field>

            <Field label="Body">
              <textarea
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                rows={3}
                placeholder="Details visitors see under the title."
                className="input resize-y"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CTA label">
                <input
                  value={draft.cta_label}
                  onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })}
                  placeholder="Explore deals"
                  className="input"
                />
              </Field>
              <Field label="CTA URL">
                <input
                  value={draft.cta_url}
                  onChange={(e) => setDraft({ ...draft, cta_url: e.target.value })}
                  placeholder="/products or https://…"
                  className="input"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Badge">
                <input
                  value={draft.badge}
                  onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
                  placeholder="Limited time"
                  className="input"
                />
                <EmojiRow onPick={(e) => setDraft((d) => ({ ...d, badge: (d.badge + " " + e).trim().slice(0, 40) }))} />
              </Field>
              <Field label="Accent color">
                <select
                  value={draft.accent}
                  onChange={(e) => setDraft({ ...draft, accent: e.target.value })}
                  className="input"
                >
                  {ACCENTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {ACCENTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDraft({ ...draft, accent: c })}
                      title={c}
                      aria-label={c}
                      className={`size-6 rounded-full border-2 transition-transform hover:scale-110 ${
                        draft.accent === c ? "border-foreground scale-110" : "border-white/20"
                      }`}
                      style={{ background: accentSwatch(c) }}
                    />
                  ))}
                </div>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Card style">
                <div className="grid grid-cols-2 gap-2">
                  {CARD_STYLES.map((s) => {
                    const active = draft.card_style === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setDraft({ ...draft, card_style: s.value })}
                        className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-colors ${
                          active
                            ? "border-violet bg-violet/5"
                            : "border-border bg-background hover:bg-secondary/50"
                        }`}
                      >
                        <span className="text-xs font-semibold">{s.label}</span>
                        <span className="text-[10px] text-muted-foreground">{s.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Title emoji">
                <div className="flex items-center gap-2">
                  <input
                    value={draft.title_emoji}
                    onChange={(e) => setDraft({ ...draft, title_emoji: e.target.value.slice(0, 8) })}
                    placeholder="e.g. 🎉"
                    className="input w-24 text-center text-lg"
                  />
                  {draft.title_emoji && (
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, title_emoji: "" })}
                      className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <EmojiRow onPick={(e) => setDraft((d) => ({ ...d, title_emoji: e }))} />
              </Field>
            </div>

            <div className="rounded-xl border border-border bg-background/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Target className="size-3.5 text-violet" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Targeting rules
                </span>
              </div>

              <div className="grid gap-4">
                <Field label="Show on these pages">
                  <textarea
                    value={draft.path_patterns.join("\n")}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        path_patterns: e.target.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    rows={3}
                    placeholder={"One path per line, e.g.\n*\n/\n/store\n/blog/*"}
                    className="input resize-y font-mono text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Use <code className="rounded bg-secondary px-1">*</code> for all pages,{" "}
                    <code className="rounded bg-secondary px-1">/store</code> for an exact path, or{" "}
                    <code className="rounded bg-secondary px-1">/blog/*</code> for a prefix match.
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {["*", "/", "/store", "/pricing", "/blog/*", "/dashboard"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          if (draft.path_patterns.includes(p)) return;
                          setDraft({ ...draft, path_patterns: [...draft.path_patterns, p] });
                        }}
                        className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[10px] hover:bg-secondary"
                      >
                        + {p}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Who can see it">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {AUDIENCE_OPTIONS.map((opt) => {
                      const active = draft.audience === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDraft({ ...draft, audience: opt.value })}
                          className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-colors ${
                            active
                              ? "border-violet bg-violet/5"
                              : "border-border bg-background hover:bg-secondary/50"
                          }`}
                        >
                          <Users className={`size-3.5 ${active ? "text-violet" : "text-muted-foreground"}`} />
                          <span className="text-xs font-semibold">{opt.label}</span>
                          <span className="text-[10px] text-muted-foreground">{opt.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <ArrowUpDown className="size-3.5 text-violet" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Priority
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    step={1}
                    min={-1000}
                    max={1000}
                    value={draft.priority}
                    onChange={(e) =>
                      setDraft({ ...draft, priority: Number.parseInt(e.target.value || "0", 10) || 0 })
                    }
                    className="input w-28"
                  />
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, priority: draft.priority - 1 })}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-secondary"
                  >
                    <ChevronDown className="size-3.5" /> Lower
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, priority: draft.priority + 1 })}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-secondary"
                  >
                    <ChevronUp className="size-3.5" /> Raise
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const max = list.reduce((m, a) => Math.max(m, a.priority ?? 0), 0);
                      setDraft({ ...draft, priority: max + 1 });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-violet/30 bg-violet/5 px-2.5 py-1.5 text-xs font-semibold text-violet hover:bg-violet/10"
                  >
                    Bump to top
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Higher numbers win when several announcements match the same page and viewer. Ties break on most recently updated.
                </p>
              </div>



              <div className="mt-4 border-t border-border pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarClock className="size-3.5 text-violet" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Schedule (optional)
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Start showing">
                    <input
                      type="datetime-local"
                      value={draft.start_at}
                      onChange={(e) => setDraft({ ...draft, start_at: e.target.value })}
                      className="input"
                    />
                  </Field>
                  <Field label="Stop showing">
                    <input
                      type="datetime-local"
                      value={draft.end_at}
                      onChange={(e) => setDraft({ ...draft, end_at: e.target.value })}
                      className="input"
                    />
                  </Field>
                </div>
                {(draft.start_at || draft.end_at) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, start_at: "", end_at: "" })}
                      className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:underline"
                    >
                      Clear schedule
                    </button>
                    {draft.start_at && draft.end_at && new Date(draft.end_at) <= new Date(draft.start_at) && (
                      <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-500">
                        End must be after start
                      </span>
                    )}
                  </div>
                )}
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Leave both empty to run as soon as the toggle is on. Times use your local timezone.
                </p>
              </div>
            </div>




            <div className="rounded-xl border border-border bg-background/50 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Image style
                </span>
                {draft.image_url && draft.image_style !== "none" && (
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, image_url: "" })}
                    className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:underline"
                  >
                    Remove image
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {STYLE_OPTIONS.map(({ value, label, hint, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDraft({ ...draft, image_style: value })}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
                      draft.image_style === value
                        ? "border-violet bg-violet/5"
                        : "border-border bg-background hover:bg-secondary/50"
                    }`}
                  >
                    <Icon className={`size-4 ${draft.image_style === value ? "text-violet" : "text-muted-foreground"}`} />
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="text-[10px] text-muted-foreground">{hint}</span>
                  </button>
                ))}
              </div>

              {draft.image_style !== "none" && (
                <div className="mt-4 grid gap-3">
                  <div className="flex items-start gap-3">
                    {draft.image_url ? (
                      <div
                        className={`shrink-0 overflow-hidden rounded-lg border border-border bg-secondary ${
                          draft.image_style === "thumbnail" ? "size-16" : "h-16 w-28"
                        }`}
                      >
                        <img src={draft.image_url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div
                        className={`flex shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-secondary text-muted-foreground ${
                          draft.image_style === "thumbnail" ? "size-16" : "h-16 w-28"
                        }`}
                      >
                        <ImageIcon className="size-5" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFilePicked(f);
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
                        >
                          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                          {uploading ? "Uploading…" : "Upload image"}
                        </button>
                        {draft.image_url && (
                          <button
                            type="button"
                            onClick={() => {
                              // Re-crop existing image URL by fetching it into a File
                              fetch(draft.image_url)
                                .then((r) => r.blob())
                                .then((b) => {
                                  const ext = (b.type.split("/")[1] || "png").split("+")[0];
                                  const file = new File([b], `image.${ext}`, { type: b.type || "image/png" });
                                  setPendingFile(file);
                                })
                                .catch(() => setStatus("Could not load image for cropping"));
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                          >
                            <CropIcon className="size-3.5" /> Re-crop
                          </button>
                        )}
                        <label className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={lockAspect}
                            onChange={(e) => setLockAspect(e.target.checked)}
                            className="size-3.5 accent-violet"
                          />
                          Lock {cropAspectLabel}
                        </label>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        PNG/JPG/WebP, max 5MB. {lockAspect ? `Uploads open a cropper locked to ${cropAspectLabel}.` : "Aspect lock is off — uploads use the original file."}
                      </p>
                    </div>
                  </div>
                  <input
                    value={draft.image_url}
                    onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                    placeholder="Or paste image URL: https://…"
                    className="input"
                  />
                </div>
              )}
            </div>



            {status && (
              <p className="rounded-lg bg-secondary p-2.5 text-xs text-foreground">{status}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!draft.title.trim() || save.isPending}
                onClick={() => save.mutate(draft)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet/25 transition-transform hover:scale-[1.01] disabled:opacity-50"
              >
                {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {draft.id ? "Save changes" : "Create announcement"}
              </button>
              {draft.id && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Delete this announcement?")) del.mutate(draft.id!);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-500/10"
                >
                  <Trash2 className="size-4" /> Delete
                </button>
              )}
              {draft.id && (
                <button
                  type="button"
                  onClick={() => setDraft(emptyDraft)}
                  className="inline-flex items-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="border-t border-border p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-bold">Live preview</h3>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Exactly what visitors see
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                device === "desktop" ? "bg-violet text-white" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Monitor className="size-3" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                device === "mobile" ? "bg-violet text-white" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Smartphone className="size-3" /> Mobile
            </button>
          </div>
        </div>

        {!draft.title.trim() ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-background/50 text-xs text-muted-foreground">
            Add a title to see the live preview
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className={`relative overflow-hidden rounded-[2rem] border-4 border-foreground/10 bg-black/80 shadow-2xl transition-all ${
                device === "mobile" ? "h-[720px] w-[360px]" : "h-[560px] w-full max-w-[1000px]"
              }`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--violet)/0.25),transparent_60%),radial-gradient(circle_at_70%_80%,hsl(var(--emerald)/0.2),transparent_60%)]" />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="relative h-full w-full overflow-auto">
                <AnnouncementPreview
                  a={{
                    id: draft.id ?? "preview",
                    enabled: draft.enabled,
                    title: draft.title,
                    body: draft.body,
                    cta_label: draft.cta_label,
                    cta_url: draft.cta_url,
                    image_url: draft.image_url,
                    image_style: draft.image_style,
                    badge: draft.badge,
                    accent: draft.accent,
                    path_patterns: draft.path_patterns,
                    audience: draft.audience,
                    start_at: draft.start_at ? new Date(draft.start_at).toISOString() : null,
                    end_at: draft.end_at ? new Date(draft.end_at).toISOString() : null,
                    priority: draft.priority,
                    updated_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    card_style: draft.card_style,
                    title_emoji: draft.title_emoji,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>



      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { border-color: hsl(var(--violet)); box-shadow: 0 0 0 3px hsl(var(--violet) / 0.15); }
      `}</style>

      {pendingFile && (
        <ImageCropperModal
          file={pendingFile}
          aspect={cropAspect}
          aspectLabel={cropAspectLabel}
          onCancel={() => setPendingFile(null)}
          onConfirm={async (blob, name) => {
            setPendingFile(null);
            await handleUpload(blob, name);
          }}
        />
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function EmojiRow({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {EMOJI_QUICK.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onPick(e)}
          className="rounded-md border border-border bg-background px-1.5 py-0.5 text-sm hover:bg-secondary"
          aria-label={`Insert ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function accentSwatch(name: string): string {
  const map: Record<string, string> = {
    violet: "oklch(0.52 0.24 293)",
    emerald: "oklch(0.66 0.16 165)",
    amber: "oklch(0.75 0.16 75)",
    rose: "oklch(0.65 0.22 15)",
    sky: "oklch(0.7 0.16 235)",
    blue: "oklch(0.6 0.2 255)",
    fuchsia: "oklch(0.6 0.28 320)",
    teal: "oklch(0.65 0.14 195)",
    orange: "oklch(0.72 0.19 55)",
    slate: "oklch(0.55 0.03 260)",
  };
  return map[name] ?? map.violet;
}
