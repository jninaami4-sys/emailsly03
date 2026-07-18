import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { upsertSiteContent } from "@/lib/site-content.functions";
import {
  SERVICE_ICON_KEYS,
  DEFAULT_SERVICE_CARDS,
  GRADIENT_PRESETS,
  getServiceIcon,
  getGradientPreset,
  type EditableServiceCard,
} from "@/lib/service-icons";
import { uploadsApi } from "@/lib/api-client";
import { Save, Loader2 } from "@/components/admin/AdminIcons";

async function uploadCardIcon(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `service-icons/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const res = await uploadsApi.upload("brand-assets", file, {
    path,
    contentType: file.type || undefined,
    cacheControl: "31536000",
  });
  return res.url;
}

type Props = {
  initial: { items?: EditableServiceCard[] } | Record<string, unknown>;
  onSaved: () => void;
};

export function ServiceCardsEditor({ initial, onSaved }: Props) {
  const initialItems = ((initial as { items?: EditableServiceCard[] })?.items ??
    DEFAULT_SERVICE_CARDS) as EditableServiceCard[];
  const [cards, setCards] = useState<EditableServiceCard[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const upsertFn = useServerFn(upsertSiteContent);
  const qc = useQueryClient();

  useEffect(() => {
    setCards(initialItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialItems)]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = JSON.parse(JSON.stringify({ items: cards }));
      await upsertFn({ data: { section: "service_cards", data: payload } });
    },
    onSuccess: () => {
      setError(null);
      setSavedAt(Date.now());
      qc.invalidateQueries({ queryKey: ["site-content"] });
      onSaved();
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Save failed"),
  });

  const update = (i: number, patch: Partial<EditableServiceCard>) => {
    setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };

  const move = (i: number, dir: -1 | 1) => {
    setCards((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const remove = (i: number) => setCards((prev) => prev.filter((_, idx) => idx !== i));

  const add = () =>
    setCards((prev) => [
      ...prev,
      {
        serviceId: `custom-${Date.now().toString(36)}`,
        title: "New service",
        tagline: "Short description",
        badge: "New",
        price: "$0",
        perUnit: "per unit",
        minOrder: "1 min",
        turnaround: "24h",
        bullets: ["Feature one", "Feature two"],
        icon: "database",
        gradientKey: "indigo",
        enabled: true,
      },
    ]);

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
          <h3 className="font-display text-lg font-bold">Service Cards</h3>
          <p className="text-xs text-muted-foreground">
            Edit every card in the homepage services carousel. Pick a preset icon or upload a custom image per card.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold hover:border-violet"
        >
          + Add card
        </button>
      </div>

      <div className="space-y-4">
        {cards.map((card, i) => (
          <CardEditor
            key={i}
            index={i}
            card={card}
            total={cards.length}
            onUpdate={(patch) => update(i, patch)}
            onMove={(dir) => move(i, dir)}
            onRemove={() => remove(i)}
          />
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
          {mutation.isPending ? "Saving…" : "Save all cards"}
        </button>
        {savedAt && !mutation.isPending && <span className="text-xs text-emerald">Saved ✓</span>}
      </div>
    </form>
  );
}

function CardEditor({
  index,
  card,
  total,
  onUpdate,
  onMove,
  onRemove,
}: {
  index: number;
  card: EditableServiceCard;
  total: number;
  onUpdate: (patch: Partial<EditableServiceCard>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const Icon = getServiceIcon(card.icon);
  const preset = getGradientPreset(card.gradientKey);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadCardIcon(file);
      onUpdate({ iconUrl: url });
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`grid size-10 place-items-center overflow-hidden rounded-lg bg-gradient-to-br ${preset.gradient}`}
          >
            {card.iconUrl ? (
              <img src={card.iconUrl} alt="" className="size-6 object-contain" />
            ) : (
              <Icon className="size-5 text-white" />
            )}
          </div>
          <div>
            <div className="font-display text-sm font-bold">{card.title || "(untitled)"}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              #{index + 1} · id: {card.serviceId}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <label className="mr-2 inline-flex cursor-pointer items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
            <input
              type="checkbox"
              checked={card.enabled !== false}
              onChange={(e) => onUpdate({ enabled: e.target.checked })}
              className="size-3.5 accent-violet"
            />
            Show
          </label>
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-40"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-40"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md border border-coral/30 bg-coral/5 px-2 py-1 text-xs font-semibold text-coral"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Service ID (internal)">
          <input
            value={card.serviceId}
            onChange={(e) => onUpdate({ serviceId: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Badge">
          <input value={card.badge} onChange={(e) => onUpdate({ badge: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Title" full>
          <input value={card.title} onChange={(e) => onUpdate({ title: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Tagline" full>
          <textarea
            value={card.tagline}
            rows={2}
            onChange={(e) => onUpdate({ tagline: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Price">
          <input value={card.price} onChange={(e) => onUpdate({ price: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Per unit">
          <input value={card.perUnit} onChange={(e) => onUpdate({ perUnit: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Min order">
          <input value={card.minOrder} onChange={(e) => onUpdate({ minOrder: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Turnaround">
          <input
            value={card.turnaround}
            onChange={(e) => onUpdate({ turnaround: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Bullets (one per line)" full>
          <textarea
            rows={3}
            value={card.bullets.join("\n")}
            onChange={(e) =>
              onUpdate({ bullets: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })
            }
            className={inputCls}
          />
        </Field>
        <Field label="Icon (preset)">
          <select
            value={card.icon}
            onChange={(e) => onUpdate({ icon: e.target.value })}
            className={inputCls}
          >
            {SERVICE_ICON_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Or upload custom icon (PNG/SVG)">
          <div className="flex items-center gap-2">
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
            {card.iconUrl && (
              <button
                type="button"
                onClick={() => onUpdate({ iconUrl: "" })}
                className="rounded-md border border-border px-2 py-1 text-xs"
              >
                Clear
              </button>
            )}
            {uploading && <Loader2 className="size-4 animate-spin text-violet" />}
          </div>
        </Field>
        <Field label="Gradient theme" full>
          <div className="flex flex-wrap gap-2">
            {GRADIENT_PRESETS.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => onUpdate({ gradientKey: g.key })}
                className={`h-8 w-14 rounded-lg bg-gradient-to-br ${g.gradient} ring-2 ${
                  card.gradientKey === g.key ? "ring-violet" : "ring-transparent"
                }`}
                title={g.label}
              />
            ))}
          </div>
        </Field>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet";

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
