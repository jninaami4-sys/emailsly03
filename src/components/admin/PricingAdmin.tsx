import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DollarSign, Save, Loader2, Check } from "lucide-react";
import {
  getPricingSettings,
  updatePricingSetting,
  type PricingSetting,
} from "@/lib/pricing-settings.functions";

type Draft = {
  rate: string;
  min_qty: string;
  min_order: string;
  helper: string;
};

export function PricingAdmin() {
  const getFn = useServerFn(getPricingSettings);
  const updateFn = useServerFn(updatePricingSetting);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["pricing-settings"],
    queryFn: () => getFn(),
  });

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const next: Record<string, Draft> = {};
    for (const row of data as PricingSetting[]) {
      next[row.service_id] = {
        rate: String(row.rate),
        min_qty: String(row.min_qty),
        min_order: String(row.min_order),
        helper: row.helper ?? "",
      };
    }
    setDrafts(next);
  }, [data]);

  const save = async (row: PricingSetting) => {
    const d = drafts[row.service_id];
    if (!d) return;
    setSavingId(row.service_id);
    setError(null);
    try {
      await updateFn({
        data: {
          service_id: row.service_id,
          rate: Number(d.rate),
          min_qty: Number(d.min_qty),
          min_order: Number(d.min_order),
          helper: d.helper.trim() || null,
        },
      });
      await qc.invalidateQueries({ queryKey: ["pricing-settings"] });
      setSavedId(row.service_id);
      setTimeout(() => setSavedId((s) => (s === row.service_id ? null : s)), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <header className="mb-4 flex items-center gap-2">
        <div className="grid size-9 place-items-center rounded-xl bg-emerald-soft text-emerald">
          <DollarSign className="size-4" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">Service pricing</h2>
          <p className="text-xs text-muted-foreground">
            Edit rates, minimum quantity, and minimum order. Changes apply immediately across the site.
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-2">Service</th>
                <th className="py-2 pr-2">Rate</th>
                <th className="py-2 pr-2">Min qty</th>
                <th className="py-2 pr-2">Min order ($)</th>
                <th className="py-2 pr-2">Helper text</th>
                <th className="py-2 pr-2 text-right">Save</th>
              </tr>
            </thead>
            <tbody>
              {(data as PricingSetting[] | undefined)?.map((row) => {
                const d = drafts[row.service_id];
                if (!d) return null;
                const isFixed = row.fixed;
                const isSaving = savingId === row.service_id;
                const isSaved = savedId === row.service_id;
                return (
                  <tr key={row.service_id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-2 align-top">
                      <div className="font-semibold">{row.name}</div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {row.service_id} · per {row.unit}
                        {isFixed && " · fixed"}
                      </div>
                    </td>
                    <td className="py-3 pr-2 align-top">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={d.rate}
                        onChange={(e) =>
                          setDrafts((s) => ({ ...s, [row.service_id]: { ...d, rate: e.target.value } }))
                        }
                        className="w-28 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-violet"
                      />
                    </td>
                    <td className="py-3 pr-2 align-top">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        disabled={isFixed}
                        value={d.min_qty}
                        onChange={(e) =>
                          setDrafts((s) => ({ ...s, [row.service_id]: { ...d, min_qty: e.target.value } }))
                        }
                        className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-violet disabled:opacity-50"
                      />
                    </td>
                    <td className="py-3 pr-2 align-top">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={d.min_order}
                        onChange={(e) =>
                          setDrafts((s) => ({ ...s, [row.service_id]: { ...d, min_order: e.target.value } }))
                        }
                        className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-violet"
                      />
                    </td>
                    <td className="py-3 pr-2 align-top">
                      <input
                        type="text"
                        value={d.helper}
                        placeholder="Optional pricing note"
                        onChange={(e) =>
                          setDrafts((s) => ({ ...s, [row.service_id]: { ...d, helper: e.target.value } }))
                        }
                        className="w-full min-w-[180px] rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-violet"
                      />
                    </td>
                    <td className="py-3 pr-2 text-right align-top">
                      <button
                        type="button"
                        onClick={() => save(row)}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : isSaved ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Save className="size-3.5" />
                        )}
                        {isSaving ? "Saving" : isSaved ? "Saved" : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
