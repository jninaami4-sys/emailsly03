import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListReferrals,
  adminReferralStats,
  adminUpdateReferralStatus,
  type AdminReferralRow,
} from "@/lib/admin-referrals.functions";
import { Loader2, Users, Gift, DollarSign, Wallet, RefreshCcw, ArrowRight, Search } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["all", "pending", "qualified", "rewarded", "paid_out", "cancelled"];

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    qualified: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    rewarded: "bg-violet-500/10 text-violet-300 border-violet-500/30",
    paid_out: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${styles[status] ?? "bg-secondary text-muted-foreground border-border"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function ReferralsAdmin() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListReferrals);
  const statsFn = useServerFn(adminReferralStats);
  const updateFn = useServerFn(adminUpdateReferralStatus);

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminReferralRow | null>(null);

  const stats = useQuery({ queryKey: ["admin-referral-stats"], queryFn: () => statsFn() });
  const referrals = useQuery({
    queryKey: ["admin-referrals", status, search],
    queryFn: () => listFn({ data: { status, search: search || undefined, limit: 200 } }),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-referrals"] });
    qc.invalidateQueries({ queryKey: ["admin-referral-stats"] });
  };

  const mutation = useMutation({
    mutationFn: updateFn,
    onSuccess: () => {
      toast.success("Referral updated");
      setEditing(null);
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  const rows = referrals.data ?? [];
  const s = stats.data;

  const statCards = useMemo(
    () => [
      { label: "Total referrals", value: s?.total ?? 0, icon: Users, tint: "text-violet-400" },
      { label: "Qualified", value: s?.byStatus?.qualified ?? 0, icon: Gift, tint: "text-sky-400" },
      { label: "Outstanding reward", value: money(s?.outstandingCents ?? 0), icon: Wallet, tint: "text-amber-400" },
      { label: "Paid out", value: money(s?.paidOutCents ?? 0), icon: DollarSign, tint: "text-emerald-400" },
    ],
    [s],
  );

  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="font-display text-lg font-bold">Referrals</h2>
          <p className="text-xs text-muted-foreground">Who referred whom, which order qualified, and reward status.</p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider hover:bg-secondary"
        >
          <RefreshCcw className="size-3" />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</span>
              <c.icon className={`size-4 ${c.tint}`} />
            </div>
            <div className="mt-2 font-display text-2xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, name, code, service…"
            className="w-56 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                status === st
                  ? "border-violet bg-violet/20 text-violet-200"
                  : "border-border bg-background text-muted-foreground hover:bg-secondary"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        {referrals.isLoading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading referrals…
          </div>
        ) : referrals.error ? (
          <div className="p-6 text-sm text-rose-400">{(referrals.error as Error).message}</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No referrals yet. When a signed-up customer arrives via a referral link and places their first paid order, they'll show up here.
          </div>
        ) : (
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Referrer</th>
                <th className="px-2 py-2.5"></th>
                <th className="px-4 py-2.5">Referred customer</th>
                <th className="px-4 py-2.5">Qualifying order</th>
                <th className="px-4 py-2.5">Reward</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.referrer?.full_name || r.referrer?.email || "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.referrer?.email}</div>
                    {r.referrer?.referral_code && (
                      <div className="mt-0.5 font-mono text-[10px] text-violet-300">code: {r.referrer.referral_code}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">
                    <ArrowRight className="size-4" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.referred?.full_name || r.referred?.email || "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.referred?.email}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      joined {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {r.order ? (
                      <>
                        <div className="font-medium">{r.order.service_label}</div>
                        <div className="text-xs text-muted-foreground">
                          {money(r.order.total_cents, r.order.currency)} · {r.order.payment_status}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                          #{r.order.id.slice(0, 8)}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">Awaiting first paid order</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Referrer:</span>{" "}
                      <span className="font-semibold text-emerald-400">{money(r.reward_referrer_cents, r.currency)}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Referred:</span>{" "}
                      <span className="font-semibold text-emerald-400">{money(r.reward_referred_cents, r.currency)}</span>
                    </div>
                    {r.payout_method && (
                      <div className="mt-0.5 font-mono text-[10px] uppercase text-muted-foreground">via {r.payout_method}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                    {r.paid_out_at && (
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        paid {new Date(r.paid_out_at).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(r)}
                      className="rounded-lg border border-border bg-background px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider hover:bg-secondary"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold">Update referral</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {editing.referrer?.email} → {editing.referred?.email}
            </p>
            <ReferralEditor
              row={editing}
              onSubmit={(patch) => mutation.mutate({ data: { id: editing.id, ...patch } })}
              onCancel={() => setEditing(null)}
              submitting={mutation.isPending}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function ReferralEditor({
  row,
  onSubmit,
  onCancel,
  submitting,
}: {
  row: AdminReferralRow;
  onSubmit: (patch: { status: "pending" | "qualified" | "rewarded" | "paid_out" | "cancelled"; payout_method?: "credit" | "cash"; notes?: string }) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [status, setStatus] = useState<any>(row.status);
  const [method, setMethod] = useState<"credit" | "cash" | "">(row.payout_method ?? "");
  const [notes, setNotes] = useState(row.notes ?? "");

  return (
    <div className="mt-4 space-y-3">
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {STATUSES.filter((s) => s !== "all").map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Payout method</span>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as "credit" | "cash" | "")}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">— none —</option>
          <option value="credit">Store credit</option>
          <option value="cash">Cash payout</option>
        </select>
      </label>

      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          placeholder="Internal notes (payout ref, disputes, etc.)"
        />
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-secondary"
        >
          Cancel
        </button>
        <button
          disabled={submitting}
          onClick={() =>
            onSubmit({
              status,
              payout_method: method || undefined,
              notes: notes || undefined,
            })
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet/90 disabled:opacity-50"
        >
          {submitting && <Loader2 className="size-3.5 animate-spin" />}
          Save
        </button>
      </div>
    </div>
  );
}
