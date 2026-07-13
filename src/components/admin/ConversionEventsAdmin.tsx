import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Target, Plus, Save, Trash2, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import {
  listConversionEventsAdmin,
  upsertConversionEvent,
  deleteConversionEvent,
  type ConversionEvent,
  type ParamMap,
} from "@/lib/conversion-events.functions";

type Draft = Omit<ConversionEvent, "id" | "created_at" | "updated_at"> & {
  id?: string;
  ga4_params_text: string;
  meta_params_text: string;
  tiktok_params_text: string;
};

const emptyDraft: Draft = {
  event_key: "",
  name: "",
  description: "",
  enabled: true,
  ga4_event_name: "",
  ga4_params: {},
  meta_event_name: "",
  meta_params: {},
  tiktok_event_name: "",
  tiktok_params: {},
  ga4_params_text: "{}",
  meta_params_text: "{}",
  tiktok_params_text: "{}",
};

function toDraft(e: ConversionEvent): Draft {
  return {
    id: e.id,
    event_key: e.event_key,
    name: e.name,
    description: e.description,
    enabled: e.enabled,
    ga4_event_name: e.ga4_event_name,
    ga4_params: e.ga4_params,
    meta_event_name: e.meta_event_name,
    meta_params: e.meta_params,
    tiktok_event_name: e.tiktok_event_name,
    tiktok_params: e.tiktok_params,
    ga4_params_text: JSON.stringify(e.ga4_params ?? {}, null, 2),
    meta_params_text: JSON.stringify(e.meta_params ?? {}, null, 2),
    tiktok_params_text: JSON.stringify(e.tiktok_params ?? {}, null, 2),
  };
}

function parseParams(text: string): ParamMap {
  const raw = (text || "").trim();
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Params must be a JSON object");
  }
  return parsed as ParamMap;
}

export function ConversionEventsAdmin() {
  const qc = useQueryClient();
  const listFn = useServerFn(listConversionEventsAdmin);
  const saveFn = useServerFn(upsertConversionEvent);
  const delFn = useServerFn(deleteConversionEvent);

  const { data, isLoading } = useQuery({
    queryKey: ["conversion-events", "admin"],
    queryFn: () => listFn(),
    retry: false,
  });

  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!status) return;
    const t = window.setTimeout(() => setStatus(null), 3500);
    return () => window.clearTimeout(t);
  }, [status]);

  const events = data ?? [];
  const editingId = draft?.id ?? (draft ? "__new__" : null);

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const ga4 = parseParams(d.ga4_params_text);
      const meta = parseParams(d.meta_params_text);
      const tiktok = parseParams(d.tiktok_params_text);
      return saveFn({
        data: {
          id: d.id,
          event_key: d.event_key,
          name: d.name,
          description: d.description,
          enabled: d.enabled,
          ga4_event_name: d.ga4_event_name,
          ga4_params: ga4,
          meta_event_name: d.meta_event_name,
          meta_params: meta,
          tiktok_event_name: d.tiktok_event_name,
          tiktok_params: tiktok,
        },
      });
    },
    onSuccess: () => {
      setStatus("Saved.");
      setDraft(null);
      qc.invalidateQueries({ queryKey: ["conversion-events", "admin"] });
      qc.invalidateQueries({ queryKey: ["conversion-events"] });
    },
    onError: (e: Error) => setStatus(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      setStatus("Deleted.");
      qc.invalidateQueries({ queryKey: ["conversion-events", "admin"] });
      qc.invalidateQueries({ queryKey: ["conversion-events"] });
    },
    onError: (e: Error) => setStatus(e.message),
  });

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.event_key.localeCompare(b.event_key)),
    [events],
  );

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Target className="size-4" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">Conversion events</h2>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Map one event key → GA4 · Meta · TikTok payloads
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDraft({ ...emptyDraft })}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-secondary"
        >
          <Plus className="size-3.5" />
          New event
        </button>
      </header>

      <div className="grid gap-3 p-4 sm:p-6">
        {status && (
          <p className="rounded-lg bg-secondary p-2.5 text-xs">{status}</p>
        )}

        {draft && editingId === "__new__" && (
          <EventEditor
            draft={draft}
            onChange={setDraft}
            onCancel={() => setDraft(null)}
            onSave={() => save.mutate(draft)}
            saving={save.isPending}
          />
        )}

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : sortedEvents.length === 0 && !draft ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No conversion events yet. Create one to start tracking.
          </p>
        ) : (
          <ul className="grid gap-2">
            {sortedEvents.map((e) => {
              const isOpen = openId === e.id;
              const isEditing = draft?.id === e.id;
              return (
                <li key={e.id} className="overflow-hidden rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(isOpen ? null : e.id);
                      if (!isOpen) setDraft(toDraft(e));
                      else setDraft(null);
                    }}
                    className="flex w-full items-center gap-3 bg-background p-3 text-left hover:bg-secondary/40"
                  >
                    {isOpen ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                    <span
                      className={`size-2 rounded-full ${
                        e.enabled ? "bg-emerald-500" : "bg-muted-foreground/40"
                      }`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {e.name || e.event_key}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {e.event_key} · GA4: {e.ga4_event_name || "—"} · Meta:{" "}
                        {e.meta_event_name || "—"} · TikTok: {e.tiktok_event_name || "—"}
                      </p>
                    </div>
                  </button>

                  {isOpen && isEditing && draft && (
                    <div className="border-t border-border bg-secondary/20 p-4">
                      <EventEditor
                        draft={draft}
                        onChange={setDraft}
                        onCancel={() => {
                          setDraft(null);
                          setOpenId(null);
                        }}
                        onSave={() => save.mutate(draft)}
                        saving={save.isPending}
                        onDelete={() => {
                          if (confirm(`Delete "${e.event_key}"?`)) {
                            remove.mutate(e.id);
                            setDraft(null);
                            setOpenId(null);
                          }
                        }}
                        deleting={remove.isPending}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-xs text-muted-foreground">
          Fire an event anywhere in the app with{" "}
          <code className="rounded bg-background px-1.5 py-0.5 font-mono text-[11px]">
            trackConversion("event_key", {"{ value: 49 }"})
          </code>
          . Overrides merge on top of the default params below.
        </p>
      </div>
    </section>
  );
}

function EventEditor({
  draft,
  onChange,
  onCancel,
  onSave,
  saving,
  onDelete,
  deleting,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Event key" hint="Stable identifier used in code, e.g. purchase">
          <input
            value={draft.event_key}
            onChange={(e) => set("event_key", e.target.value)}
            placeholder="purchase"
            className="ev-input"
          />
        </Field>
        <Field label="Display name">
          <input
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Purchase"
            className="ev-input"
          />
        </Field>
      </div>
      <Field label="Description">
        <input
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Fires when an order is completed"
          className="ev-input"
        />
      </Field>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(e) => set("enabled", e.target.checked)}
        />
        Enabled (fires for visitors)
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <ProviderBlock
          title="GA4"
          accent="text-orange-500 bg-orange-500/10"
          name={draft.ga4_event_name}
          onName={(v) => set("ga4_event_name", v)}
          params={draft.ga4_params_text}
          onParams={(v) => set("ga4_params_text", v)}
          namePlaceholder="purchase"
        />
        <ProviderBlock
          title="Meta Pixel"
          accent="text-blue-500 bg-blue-500/10"
          name={draft.meta_event_name}
          onName={(v) => set("meta_event_name", v)}
          params={draft.meta_params_text}
          onParams={(v) => set("meta_params_text", v)}
          namePlaceholder="Purchase"
        />
        <ProviderBlock
          title="TikTok Pixel"
          accent="text-pink-500 bg-pink-500/10"
          name={draft.tiktok_event_name}
          onName={(v) => set("tiktok_event_name", v)}
          params={draft.tiktok_params_text}
          onParams={(v) => set("tiktok_params_text", v)}
          namePlaceholder="CompletePayment"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-violet px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet/25 disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save event
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold"
        >
          Cancel
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs font-semibold text-rose-500 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        )}
      </div>

      <style>{`
        .ev-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.55rem 0.85rem;
          font-size: 0.875rem;
          outline: none;
        }
        .ev-input:focus { border-color: hsl(var(--violet)); box-shadow: 0 0 0 3px hsl(var(--violet) / 0.15); }
      `}</style>
    </div>
  );
}

function ProviderBlock({
  title,
  accent,
  name,
  onName,
  params,
  onParams,
  namePlaceholder,
}: {
  title: string;
  accent: string;
  name: string;
  onName: (v: string) => void;
  params: string;
  onParams: (v: string) => void;
  namePlaceholder: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${accent}`}>
          {title}
        </span>
      </div>
      <Field label="Event name">
        <input
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder={namePlaceholder}
          className="ev-input"
        />
      </Field>
      <div className="mt-3">
        <Field label="Default params (JSON)">
          <textarea
            value={params}
            onChange={(e) => onParams(e.target.value)}
            rows={5}
            spellCheck={false}
            className="ev-input font-mono text-xs resize-y"
          />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
