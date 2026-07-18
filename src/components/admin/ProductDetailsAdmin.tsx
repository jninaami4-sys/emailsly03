import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PRODUCTS } from "@/lib/products";
import {
  deleteProductDetails,
  listProductDetails,
  upsertProductDetails,
  type ProductDetails,
} from "@/lib/product-details.functions";
import { Loader2, Save, Trash2, Info } from "@/components/admin/AdminIcons";

type FormState = {
  enabled: boolean;
  long_description: string;
  extra_info: string;
  cta_label: string;
  cta_url: string;
  image_url: string;
};

const EMPTY: FormState = {
  enabled: true,
  long_description: "",
  extra_info: "",
  cta_label: "",
  cta_url: "",
  image_url: "",
};

export function ProductDetailsAdmin() {
  const qc = useQueryClient();
  const listFn = listProductDetails;
  const upsertFn = upsertProductDetails;
  const deleteFn = deleteProductDetails;

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-product-details"],
    queryFn: () => listFn(),
  });

  const bySlug = useMemo(() => {
    const map = new Map<string, ProductDetails>();
    (rows ?? []).forEach((r) => map.set(r.slug, r));
    return map;
  }, [rows]);

  const [selectedSlug, setSelectedSlug] = useState<string>(PRODUCTS[0]?.slug ?? "");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [dirty, setDirty] = useState(false);

  const product = PRODUCTS.find((p) => p.slug === selectedSlug) ?? PRODUCTS[0];
  const existing = bySlug.get(selectedSlug);

  // Sync form when selection or data changes (and not dirty)
  useMemo(() => {
    if (dirty) return;
    if (existing) {
      setForm({
        enabled: existing.enabled,
        long_description: existing.long_description,
        extra_info: existing.extra_info,
        cta_label: existing.cta_label,
        cta_url: existing.cta_url,
        image_url: existing.image_url,
      });
    } else {
      setForm(EMPTY);
    }
  }, [selectedSlug, existing, dirty]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const saveMut = useMutation({
    mutationFn: () => upsertFn({ slug: selectedSlug, ...form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-product-details"] });
      qc.invalidateQueries({ queryKey: ["product-details", selectedSlug] });
      setDirty(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteFn({ slug: selectedSlug }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-product-details"] });
      qc.invalidateQueries({ queryKey: ["product-details", selectedSlug] });
      setForm(EMPTY);
      setDirty(false);
    },
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Product details popup</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a longer description, extra info, and a call-to-action link shown in the popup when a
            visitor clicks a prebuilt list card.
          </p>
        </div>
        {isLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <ul className="max-h-[520px] space-y-1 overflow-y-auto rounded-xl border border-border bg-background p-2">
          {PRODUCTS.map((p) => {
            const has = bySlug.has(p.slug);
            const active = p.slug === selectedSlug;
            return (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setDirty(false);
                    setSelectedSlug(p.slug);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                    active ? "bg-violet text-white" : "hover:bg-secondary"
                  }`}
                >
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${
                      has ? "bg-emerald" : active ? "bg-white/60" : "bg-muted-foreground/40"
                    }`}
                  />
                  <span className="truncate">{p.title}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-background p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Editing
            </p>
            <p className="mt-1 font-display text-sm font-semibold">{product?.title}</p>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">/{selectedSlug}</p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => update("enabled", e.target.checked)}
            />
            Show popup for this product
          </label>

          <Field label="Long description">
            <textarea
              value={form.long_description}
              onChange={(e) => update("long_description", e.target.value)}
              rows={5}
              placeholder="Deeper story about the list: sources, use cases, sample workflows…"
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet"
            />
          </Field>

          <Field label="Additional info">
            <textarea
              value={form.extra_info}
              onChange={(e) => update("extra_info", e.target.value)}
              rows={3}
              placeholder="Delivery timeline, guarantees, refresh cadence, etc."
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CTA label">
              <input
                value={form.cta_label}
                onChange={(e) => update("cta_label", e.target.value)}
                placeholder="View sample"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet"
              />
            </Field>
            <Field label="CTA URL">
              <input
                value={form.cta_url}
                onChange={(e) => update("cta_url", e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet"
              />
            </Field>
          </div>

          <Field label="Hero image URL (optional)">
            <input
              value={form.image_url}
              onChange={(e) => update("image_url", e.target.value)}
              placeholder="https://…/image.jpg"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet"
            />
          </Field>

          {(saveMut.error || deleteMut.error) && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-500">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {(saveMut.error as Error)?.message ||
                  (deleteMut.error as Error)?.message}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => deleteMut.mutate()}
              disabled={!existing || deleteMut.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-rose-500 disabled:opacity-40"
            >
              <Trash2 className="size-3.5" />
              Delete entry
            </button>
            <button
              type="button"
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending || !dirty}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet disabled:opacity-50"
            >
              {saveMut.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save
            </button>
          </div>
        </div>
      </div>
    </section>
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
