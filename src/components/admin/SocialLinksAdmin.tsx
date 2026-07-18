import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Trash2, Plus, Save, X } from "@/components/admin/AdminIcons";
import {
  adminListSocialLinks,
  adminUpsertSocialLink,
  adminToggleSocialLink,
  adminDeleteSocialLink,
  type SocialLink,
  type SocialIconKey,
} from "@/lib/social-links.functions";

const ICON_KEYS: SocialIconKey[] = [
  "whatsapp",
  "email",
  "instagram",
  "telegram",
  "facebook",
  "twitter",
  "linkedin",
  "youtube",
  "tiktok",
  "discord",
  "github",
  "link",
];

type Draft = {
  id?: string;
  platform: string;
  label: string;
  href: string;
  color: string;
  icon: SocialIconKey;
  enabled: boolean;
  sort_order: number;
};

const BLANK: Draft = {
  platform: "",
  label: "",
  href: "",
  color: "#418df1",
  icon: "link",
  enabled: true,
  sort_order: 100,
};

export function SocialLinksAdmin() {
  const listFn = adminListSocialLinks;
  const upsertFn = adminUpsertSocialLink;
  const toggleFn = adminToggleSocialLink;
  const deleteFn = adminDeleteSocialLink;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-social-links"],
    queryFn: () => listFn(),
    staleTime: 10_000,
  });

  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const links = data ?? [];

  async function save() {
    if (!draft) return;
    setBusy(draft.id ?? "new");
    try {
      await upsertFn({ data: draft });
      setDraft(null);
      await refetch();
    } finally {
      setBusy(null);
    }
  }

  async function toggle(l: SocialLink, next: boolean) {
    setBusy(l.id);
    try {
      await toggleFn({ data: { id: l.id, enabled: next } });
      await refetch();
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this social link?")) return;
    setBusy(id);
    try {
      await deleteFn({ data: { id } });
      await refetch();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="font-display text-lg font-bold">Social links</h2>
          <p className="text-xs text-muted-foreground">
            Toggle, reorder, or edit the footer social buttons.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() =>
              setDraft({ ...BLANK, sort_order: (links.at(-1)?.sort_order ?? 0) + 10 })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-violet px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Plus className="size-3.5" /> Add
          </button>
        </div>
      </header>

      <div className="divide-y divide-border">
        {isLoading && (
          <div className="grid place-items-center py-16 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}

        {draft && !draft.id && (
          <DraftEditor
            draft={draft}
            onChange={setDraft}
            onSave={save}
            onCancel={() => setDraft(null)}
            busy={busy === "new"}
          />
        )}

        {links.map((l) =>
          draft?.id === l.id ? (
            <DraftEditor
              key={l.id}
              draft={draft}
              onChange={setDraft}
              onSave={save}
              onCancel={() => setDraft(null)}
              busy={busy === l.id}
            />
          ) : (
            <div key={l.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    aria-hidden
                    className="grid size-6 place-items-center rounded-full border border-border"
                    style={{ backgroundColor: l.color, color: "#fff" }}
                  >
                    <span className="text-[10px] font-bold uppercase">{l.platform[0]}</span>
                  </span>
                  <span className="font-display font-semibold capitalize">{l.platform}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      l.enabled ? "bg-emerald/10 text-emerald" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {l.enabled ? "On" : "Off"}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                    #{l.sort_order}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{l.label}</p>
                <a
                  href={l.href}
                  className="mt-0.5 block truncate text-xs text-violet hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {l.href}
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Show
                  </span>
                  <input
                    type="checkbox"
                    checked={l.enabled}
                    disabled={busy === l.id}
                    onChange={(e) => toggle(l, e.target.checked)}
                    className="size-4 accent-violet"
                  />
                </label>
                <button
                  onClick={() => setDraft({ ...l, icon: l.icon as SocialIconKey })}
                  className="rounded-md border border-border bg-background px-3 py-1 text-xs font-semibold hover:bg-muted"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(l.id)}
                  disabled={busy === l.id}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-coral"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function DraftEditor({
  draft,
  onChange,
  onSave,
  onCancel,
  busy,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });
  return (
    <div className="grid gap-3 border-l-4 border-violet bg-secondary/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Platform (unique key)">
          <input
            value={draft.platform}
            onChange={(e) => set("platform", e.target.value.toLowerCase().trim())}
            placeholder="facebook"
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-violet"
          />
        </Field>
        <Field label="Accessible label">
          <input
            value={draft.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="Follow on Facebook"
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-violet"
          />
        </Field>
        <Field label="URL (or mailto:)">
          <input
            value={draft.href}
            onChange={(e) => set("href", e.target.value)}
            placeholder="https://facebook.com/..."
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-violet"
          />
        </Field>
        <Field label="Icon">
          <select
            value={draft.icon}
            onChange={(e) => set("icon", e.target.value as SocialIconKey)}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-violet"
          >
            {ICON_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Brand color">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={draft.color}
              onChange={(e) => set("color", e.target.value)}
              className="size-9 cursor-pointer rounded-md border border-border bg-background"
            />
            <input
              value={draft.color}
              onChange={(e) => set("color", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-violet"
            />
          </div>
        </Field>
        <Field label="Sort order">
          <input
            type="number"
            value={draft.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-violet"
          />
        </Field>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(e) => set("enabled", e.target.checked)}
          className="size-4 accent-violet"
        />
        Enabled (show on footer)
      </label>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground"
        >
          <X className="size-3.5" /> Cancel
        </button>
        <button
          onClick={onSave}
          disabled={busy || !draft.platform || !draft.label || !draft.href}
          className="inline-flex items-center gap-1.5 rounded-md bg-violet px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          <Save className="size-3.5" /> Save
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
