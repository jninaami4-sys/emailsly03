import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { upsertSiteContent } from "@/lib/site-content.functions";
import { supabase } from "@/integrations/supabase/client";
import { Save, Loader2 } from "@/components/admin/AdminIcons";
import {
  SERVICE_ICON_KEYS,
  GRADIENT_PRESETS,
  getServiceIcon,
  getGradientPreset,
} from "@/lib/service-icons";

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 30;

async function uploadImage(file: File, folder: string): Promise<string> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const up = await supabase.storage.from("brand-assets").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (up.error) throw up.error;
  const signed = await supabase.storage.from("brand-assets").createSignedUrl(path, SIGNED_URL_TTL);
  if (signed.error || !signed.data?.signedUrl) throw signed.error || new Error("Failed to sign URL");
  return signed.data.signedUrl;
}

export type FieldDef = {
  key: string;
  label: string;
  kind: "text" | "textarea" | "image" | "icon" | "color";
  full?: boolean;
  placeholder?: string;
};

type Props = {
  section: string;
  title: string;
  description: string;
  scalarFields?: FieldDef[]; // top-level fields (e.g. heading)
  itemFields: FieldDef[];
  itemLabel: string; // "Trust stat", "Testimonial"
  storageFolder: string;
  makeNewItem: () => Record<string, unknown>;
  initial: Record<string, unknown>;
  defaults: Record<string, unknown>;
  onSaved: () => void;
};

export function MediaItemsEditor({
  section,
  title,
  description,
  scalarFields = [],
  itemFields,
  itemLabel,
  storageFolder,
  makeNewItem,
  initial,
  defaults,
  onSaved,
}: Props) {
  const merged = { ...defaults, ...initial };
  const [values, setValues] = useState<Record<string, unknown>>(merged);
  const items = (values.items as Array<Record<string, unknown>>) ?? [];
  const upsertFn = useServerFn(upsertSiteContent);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    setValues({ ...defaults, ...initial });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initial)]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = JSON.parse(JSON.stringify(values));
      await upsertFn({ data: { section, data: payload } });
    },
    onSuccess: () => {
      setError(null);
      setSavedAt(Date.now());
      qc.invalidateQueries({ queryKey: ["site-content"] });
      onSaved();
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Save failed"),
  });

  const setItems = (next: Array<Record<string, unknown>>) =>
    setValues((v) => ({ ...v, items: next }));

  const updateItem = (i: number, patch: Record<string, unknown>) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="rounded-xl border border-border bg-background/40 p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => setItems([...items, makeNewItem()])}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold hover:border-violet"
        >
          + Add {itemLabel}
        </button>
      </div>

      {scalarFields.length > 0 && (
        <div className="mb-5 grid gap-3 rounded-xl border border-border bg-background/60 p-4 sm:grid-cols-2">
          {scalarFields.map((f) => (
            <FieldRenderer
              key={f.key}
              def={f}
              value={values[f.key]}
              onChange={(next) => setValues((v) => ({ ...v, [f.key]: next }))}
              storageFolder={storageFolder}
            />
          ))}
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-border bg-background/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {itemLabel} #{i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                  className="rounded-md border border-coral/30 bg-coral/5 px-2 py-1 text-xs font-semibold text-coral"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {itemFields.map((f) => (
                <FieldRenderer
                  key={f.key}
                  def={f}
                  value={item[f.key]}
                  onChange={(next) => updateItem(i, { [f.key]: next })}
                  storageFolder={storageFolder}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-coral/30 bg-coral/5 px-3 py-2 text-sm text-coral">{error}</p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_oklch(0.52_0.24_293/0.6)] disabled:opacity-60"
        >
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {mutation.isPending ? "Saving…" : "Save all"}
        </button>
        {savedAt && !mutation.isPending && <span className="text-xs text-emerald">Saved ✓</span>}
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet";

function FieldRenderer({
  def,
  value,
  onChange,
  storageFolder,
}: {
  def: FieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
  storageFolder: string;
}) {
  const [uploading, setUploading] = useState(false);
  const span = def.full ? "sm:col-span-2" : "";

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file, storageFolder);
      onChange(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={span}>
      <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {def.label}
      </label>
      {def.kind === "textarea" ? (
        <textarea
          rows={3}
          value={String(value ?? "")}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      ) : def.kind === "icon" ? (
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          <option value="">(none)</option>
          {SERVICE_ICON_KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      ) : def.kind === "color" ? (
        <div className="flex flex-wrap gap-2">
          {GRADIENT_PRESETS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => onChange(g.key)}
              className={`h-8 w-14 rounded-lg bg-gradient-to-br ${g.gradient} ring-2 ${
                value === g.key ? "ring-violet" : "ring-transparent"
              }`}
              title={g.label}
            />
          ))}
        </div>
      ) : def.kind === "image" ? (
        <div className="flex items-center gap-2">
          {value ? (
            <img src={String(value)} alt="" className="size-10 rounded-md object-cover ring-1 ring-border" />
          ) : (
            <div className="grid size-10 place-items-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
              img
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
            className="text-xs"
          />
          <input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder="or paste URL"
            className={`${inputCls} flex-1`}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-md border border-border px-2 py-1 text-xs"
            >
              Clear
            </button>
          )}
          {uploading && <Loader2 className="size-4 animate-spin text-violet" />}
        </div>
      ) : (
        <input
          type="text"
          value={String(value ?? "")}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      )}
    </div>
  );
}

/** Preview helper — renders the icon (preset or uploaded) for a trust item. */
export function TrustItemIcon({
  icon,
  iconUrl,
  color,
  className,
}: {
  icon?: string;
  iconUrl?: string;
  color?: string;
  className?: string;
}) {
  const Icon = getServiceIcon(icon);
  const preset = getGradientPreset(color);
  return (
    <div className={`grid size-12 place-items-center overflow-hidden rounded-lg bg-gradient-to-br ${preset.gradient} ${className ?? ""}`}>
      {iconUrl ? <img src={iconUrl} alt="" className="size-7 object-contain" /> : <Icon className="size-6 text-white" />}
    </div>
  );
}
