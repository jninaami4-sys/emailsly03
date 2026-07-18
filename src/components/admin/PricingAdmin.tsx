import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Save, Loader2, Check } from "@/components/admin/AdminIcons";
import {
  getPricingSettings,
  updatePricingSetting,
  setPricingPublished,
  getPricingAudit,
  type PricingAuditEntry,
  type PricingSetting,
} from "@/lib/pricing-settings.functions";

type Draft = {
  rate: string;
  min_qty: string;
  min_order: string;
  helper: string;
};

export function PricingAdmin() {
  const getFn = getPricingSettings;
  const updateFn = updatePricingSetting;
  const publishFn = setPricingPublished;
  const auditFn = getPricingAudit;
  const qc = useQueryClient();
  const { data, isLoading, isError, error: queryError, refetch, isFetching } = useQuery({
    queryKey: ["pricing-settings"],
    queryFn: () => getFn(),
  });
  const auditQuery = useQuery({
    queryKey: ["pricing-audit"],
    queryFn: () => auditFn(),
    staleTime: 15_000,
  });

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
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
      await qc.invalidateQueries({ queryKey: ["pricing-audit"] });
      setSavedId(row.service_id);
      setTimeout(() => setSavedId((s) => (s === row.service_id ? null : s)), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  };

  const togglePublished = async (row: PricingSetting, next: boolean) => {
    setTogglingId(row.service_id);
    setError(null);
    try {
      await publishFn({ data: { service_id: row.service_id, published: next } });
      await qc.invalidateQueries({ queryKey: ["pricing-settings"] });
      await qc.invalidateQueries({ queryKey: ["pricing-audit"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update visibility");
    } finally {
      setTogglingId(null);
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
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading pricing settings…
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm">
          <div className="font-semibold text-rose-600">Couldn't load pricing</div>
          <p className="mt-1 text-xs text-rose-600/80">
            {queryError instanceof Error ? queryError.message : "Unknown error while fetching pricing settings."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Check that you're signed in as an admin and that the backend is reachable, then retry.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {isFetching ? "Retrying" : "Retry"}
          </button>
        </div>
      ) : !data || (data as PricingSetting[]).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm">
          <div className="font-semibold">No pricing rows yet</div>
          <p className="mt-1 text-xs text-muted-foreground">
            The <code className="font-mono">pricing_settings</code> table is empty, so the public
            calculator falls back to hard-coded defaults and nothing is editable here. Seed the 10
            default services (Apollo, ZoomInfo, LinkedIn, Manual, Mobile, Pixel, Ads, Tracking,
            Logo, Webdesign) from the database, then click Retry.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-50"
          >
            {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {isFetching ? "Checking" : "Retry"}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-2">Service</th>
                <th className="py-2 pr-2">Visible</th>
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
                const isToggling = togglingId === row.service_id;
                return (
                  <tr key={row.service_id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-2 align-top">
                      <div className="font-semibold">{row.name}</div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {row.service_id} · per {row.unit}
                        {isFixed && " · fixed"}
                        {!row.published && " · hidden"}
                      </div>
                    </td>
                    <td className="py-3 pr-2 align-top">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={row.published}
                        disabled={isToggling}
                        onClick={() => togglePublished(row, !row.published)}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                          row.published ? "bg-emerald" : "bg-muted"
                        }`}
                        title={row.published ? "Visible on storefront — click to hide" : "Hidden — click to publish"}
                      >
                        <span
                          className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
                            row.published ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {isToggling ? "Saving…" : row.published ? "Published" : "Hidden"}
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

      <AuditHistory
        entries={auditQuery.data ?? []}
        loading={auditQuery.isLoading}
        error={auditQuery.isError ? (auditQuery.error instanceof Error ? auditQuery.error.message : "Failed to load history") : null}
        onRefresh={() => auditQuery.refetch()}
        refreshing={auditQuery.isFetching}
      />
    </section>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "on" : "off";
  return String(v);
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function AuditHistory({
  entries,
  loading,
  error,
  onRefresh,
  refreshing,
}: {
  entries: PricingAuditEntry[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-background/60 p-4 sm:p-5">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-bold">Change history</h3>
          <p className="text-[11px] text-muted-foreground">
            Last 100 edits — who changed what, and when.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-muted disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="size-3 animate-spin" /> : null}
          Refresh
        </button>
      </header>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading history…</p>
      ) : error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No edits recorded yet. Changes you make above will show up here.
        </p>
      ) : (
        <ol className="space-y-2">
          {entries.map((e) => {
            const fields = Object.entries(e.changes);
            return (
              <li
                key={e.id}
                className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <div className="font-semibold">
                    {e.service_name ?? e.service_id}
                    <span className="ml-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {e.service_id}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {formatWhen(e.changed_at)} · {e.changed_by_email ?? (e.changed_by ? e.changed_by.slice(0, 8) : "system")}
                  </div>
                </div>
                <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                  {fields.map(([field, diff]) => (
                    <li key={field} className="font-mono text-[11px]">
                      <span className="text-muted-foreground">{field}:</span>{" "}
                      <span className="text-rose-600 line-through">{formatValue(diff.old)}</span>
                      {" → "}
                      <span className="text-emerald">{formatValue(diff.new)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
