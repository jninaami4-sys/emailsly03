import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listStoreOffers, upsertStoreOffer, deleteStoreOffer } from "@/lib/admin-extras.functions";
import { Plus, Save, Trash2, Loader2 } from "@/components/admin/AdminIcons";

type Offer = {
  id: string;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_url: string | null;
  badge: string | null;
  bg_gradient: string | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  sort_order: number;
};

const empty = {
  id: null as string | null,
  title: "",
  subtitle: "",
  cta_label: "",
  cta_url: "",
  badge: "",
  bg_gradient: "",
  starts_at: "",
  ends_at: "",
  active: true,
  sort_order: 0,
};

export function StoreOffersAdmin() {
  const qc = useQueryClient();
  const listFn = (listStoreOffers);
  const upFn = upsertStoreOffer;
  const delFn = deleteStoreOffer;
  const [draft, setDraft] = useState(empty);

  const { data, isLoading } = useQuery({ queryKey: ["admin-store-offers"], queryFn: () => listFn() });

  const save = useMutation({
    mutationFn: () =>
      upFn({
        data: {
          ...draft,
          starts_at: draft.starts_at || null,
          ends_at: draft.ends_at || null,
        } as any,
      }),
    onSuccess: () => {
      setDraft(empty);
      qc.invalidateQueries({ queryKey: ["admin-store-offers"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-store-offers"] }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-lg font-black">Store offer banners</h3>
        <p className="mt-1 text-sm text-muted-foreground">Promotional banners shown across the store page.</p>
        <div className="mt-4 divide-y divide-border">
          {isLoading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
          {data?.offers?.map((o: Offer) => (
            <div key={o.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{o.title}</span>
                  {!o.active && <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">off</span>}
                  {o.badge && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">{o.badge}</span>}
                </div>
                {o.subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{o.subtitle}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() =>
                    setDraft({
                      id: o.id,
                      title: o.title,
                      subtitle: o.subtitle ?? "",
                      cta_label: o.cta_label ?? "",
                      cta_url: o.cta_url ?? "",
                      badge: o.badge ?? "",
                      bg_gradient: o.bg_gradient ?? "",
                      starts_at: o.starts_at?.slice(0, 16) ?? "",
                      ends_at: o.ends_at?.slice(0, 16) ?? "",
                      active: o.active,
                      sort_order: o.sort_order,
                    })
                  }
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-bold"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirm("Delete this offer?") && remove.mutate(o.id)}
                  className="rounded-lg border border-border bg-background p-1.5 text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
          {!isLoading && !data?.offers?.length && (
            <div className="p-6 text-center text-sm text-muted-foreground">No offers yet.</div>
          )}
        </div>
      </section>

      <aside className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-lg font-black">{draft.id ? "Edit offer" : "New offer"}</h3>
        <div className="mt-4 space-y-3">
          <Field label="Title">
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={input} />
          </Field>
          <Field label="Subtitle">
            <textarea value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} className={input} rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Badge">
              <input value={draft.badge} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} className={input} placeholder="Limited" />
            </Field>
            <Field label="Sort order">
              <input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} className={input} />
            </Field>
          </div>
          <Field label="CTA label">
            <input value={draft.cta_label} onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })} className={input} />
          </Field>
          <Field label="CTA URL">
            <input value={draft.cta_url} onChange={(e) => setDraft({ ...draft, cta_url: e.target.value })} className={input} placeholder="/store" />
          </Field>
          <Field label="Background gradient (CSS)">
            <input value={draft.bg_gradient} onChange={(e) => setDraft({ ...draft, bg_gradient: e.target.value })} className={input} placeholder="linear-gradient(135deg,#4f6bff,#9333ea)" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts at">
              <input type="datetime-local" value={draft.starts_at} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })} className={input} />
            </Field>
            <Field label="Ends at">
              <input type="datetime-local" value={draft.ends_at} onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })} className={input} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
            Active
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            disabled={!draft.title || save.isPending}
            onClick={() => save.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : draft.id ? <Save className="size-4" /> : <Plus className="size-4" />}
            {draft.id ? "Save changes" : "Create offer"}
          </button>
          {draft.id && (
            <button onClick={() => setDraft(empty)} className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold">
              Cancel
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
