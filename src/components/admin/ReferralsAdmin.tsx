import { Fragment, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListReferrals,
  adminReferralStats,
  adminUpdateReferralStatus,
  adminApproveReferral,
  adminRejectReferral,
  adminReferrerChain,
  adminReferralFunnel,
  adminReferralLeaderboard,
  adminMarkCreditsPaidOut,
  adminExportOwedCsv,
  type AdminReferralRow,
} from "@/lib/admin-referrals.functions";
import {
  Loader2,
  Users,
  Gift,
  DollarSign,
  Wallet,
  RefreshCcw,
  ArrowRight,
  Search,
  ShieldAlert,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Download,
  Trophy,
  MousePointerClick,
  UserPlus,
  CreditCard,
} from "@/components/admin/AdminIcons";
import { toast } from "sonner";

const STATUSES = ["all", "pending", "qualified", "rewarded", "paid_out", "cancelled"];
const REVIEW_STATES = ["all", "auto", "flagged", "approved", "rejected"];

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

function ReviewBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    auto: "bg-secondary text-muted-foreground border-border",
    flagged: "bg-orange-500/10 text-orange-400 border-orange-500/40",
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    rejected: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };
  return (
    <span className={`inline-flex rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider ${styles[state] ?? styles.auto}`}>
      {state}
    </span>
  );
}

function FlagChips({ flags }: { flags: string[] }) {
  if (!flags?.length) return null;
  const labels: Record<string, string> = {
    same_email: "same email",
    same_domain: "same domain",
    same_ip: "same IP",
    same_device: "same device",
    below_min_order: "below min",
    monthly_cap: "monthly cap",
  };
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {flags.map((f) => (
        <span key={f} className="inline-flex items-center gap-1 rounded border border-orange-500/40 bg-orange-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-orange-300">
          <ShieldAlert className="size-2.5" />
          {labels[f] ?? f}
        </span>
      ))}
    </div>
  );
}

export function ReferralsAdmin() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListReferrals);
  const statsFn = useServerFn(adminReferralStats);
  const updateFn = useServerFn(adminUpdateReferralStatus);
  const approveFn = useServerFn(adminApproveReferral);
  const rejectFn = useServerFn(adminRejectReferral);
  const funnelFn = useServerFn(adminReferralFunnel);
  const leaderFn = useServerFn(adminReferralLeaderboard);
  const chainFn = useServerFn(adminReferrerChain);
  const payoutFn = useServerFn(adminMarkCreditsPaidOut);
  const csvFn = useServerFn(adminExportOwedCsv);

  const [status, setStatus] = useState("all");
  const [reviewState, setReviewState] = useState("all");
  const [search, setSearch] = useState("");
  const [funnelDays, setFunnelDays] = useState(30);
  const [editing, setEditing] = useState<AdminReferralRow | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const stats = useQuery({ queryKey: ["admin-referral-stats"], queryFn: () => statsFn() });
  const funnel = useQuery({
    queryKey: ["admin-referral-funnel", funnelDays],
    queryFn: () => funnelFn({ data: { days: funnelDays } }),
  });
  const leaderboard = useQuery({
    queryKey: ["admin-referral-leaderboard"],
    queryFn: () => leaderFn({ data: { limit: 10 } }),
  });
  const referrals = useQuery({
    queryKey: ["admin-referrals", status, reviewState, search],
    queryFn: () =>
      listFn({ data: { status, review_state: reviewState, search: search || undefined, limit: 200 } }),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-referrals"] });
    qc.invalidateQueries({ queryKey: ["admin-referral-stats"] });
    qc.invalidateQueries({ queryKey: ["admin-referral-funnel"] });
    qc.invalidateQueries({ queryKey: ["admin-referral-leaderboard"] });
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

  const approveMut = useMutation({
    mutationFn: (id: string) => approveFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Approved — credits issued");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Approve failed"),
  });
  const rejectMut = useMutation({
    mutationFn: (id: string) => rejectFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Rejected — credits reversed");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Reject failed"),
  });

  const rows = referrals.data ?? [];
  const s = stats.data;
  const f = funnel.data;
  const lb = leaderboard.data ?? [];

  const statCards = useMemo(
    () => [
      { label: "Total referrals", value: s?.total ?? 0, icon: Users, tint: "text-violet-400" },
      { label: "Flagged", value: s?.byReview?.flagged ?? 0, icon: ShieldAlert, tint: "text-orange-400" },
      { label: "Outstanding reward", value: money(s?.outstandingCents ?? 0), icon: Wallet, tint: "text-amber-400" },
      { label: "Paid out", value: money(s?.paidOutCents ?? 0), icon: DollarSign, tint: "text-emerald-400" },
    ],
    [s],
  );

  const downloadCsv = async () => {
    try {
      const { csv, count } = await csvFn();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `referral-owed-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${count} referrer${count === 1 ? "" : "s"}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed");
    }
  };

  const payoutMut = useMutation({
    mutationFn: (userIds: string[]) => payoutFn({ data: { user_ids: userIds } }),
    onSuccess: (r) => {
      toast.success(`Marked ${r.count} credit${r.count === 1 ? "" : "s"} as paid out (${money(r.total_cents)})`);
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Payout failed"),
  });

  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="font-display text-lg font-bold">Referrals</h2>
          <p className="text-xs text-muted-foreground">Attribution, anti-abuse review, and payouts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider hover:bg-secondary"
          >
            <Download className="size-3" /> Export owed
          </button>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider hover:bg-secondary"
          >
            <RefreshCcw className="size-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Funnel */}
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Attribution funnel</h3>
          <div className="flex gap-1">
            {[7, 30, 90, 365].map((d) => (
              <button
                key={d}
                onClick={() => setFunnelDays(d)}
                className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${funnelDays === d ? "border-violet bg-violet/20 text-violet-200" : "border-border bg-background text-muted-foreground hover:bg-secondary"}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FunnelCard icon={MousePointerClick} label="Clicks" value={f?.clicks ?? 0} tint="text-sky-400" />
          <FunnelCard icon={UserPlus} label="Signups" value={f?.signups ?? 0} tint="text-violet-400" />
          <FunnelCard icon={CreditCard} label="Paid conversions" value={f?.paid_conversions ?? 0} tint="text-amber-400" />
          <FunnelCard icon={DollarSign} label="Credits outstanding" value={money(f?.credits_outstanding_cents ?? 0)} tint="text-emerald-400" />
        </div>
      </div>

      {/* Stat cards */}
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

      {/* Leaderboard */}
      <div className="border-b border-border p-4">
        <h3 className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <Trophy className="size-3" /> Top referrers
        </h3>
        {leaderboard.isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading leaderboard…</div>
        ) : lb.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No referrers yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead className="text-left font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="pb-2">#</th>
                  <th className="pb-2">Referrer</th>
                  <th className="pb-2 text-right">Conversions</th>
                  <th className="pb-2 text-right">Earned</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lb.map((r, i) => (
                  <tr key={r.user_id}>
                    <td className="py-1.5 font-mono text-xs text-muted-foreground">{i + 1}</td>
                    <td className="py-1.5">
                      <div className="text-sm">{r.full_name || r.email}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {r.email}{" "}
                        {r.referral_code && <span className="text-violet-300">· {r.referral_code}</span>}
                      </div>
                    </td>
                    <td className="py-1.5 text-right font-mono text-xs">{r.conversions}</td>
                    <td className="py-1.5 text-right font-mono text-xs text-emerald-400">{money(r.earned_cents)}</td>
                    <td className="py-1.5 text-right">
                      <button
                        onClick={() => payoutMut.mutate([r.user_id])}
                        disabled={payoutMut.isPending || r.earned_cents <= 0}
                        className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[9px] uppercase hover:bg-secondary disabled:opacity-40"
                      >
                        Pay out
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, name, code, flags…"
            className="w-56 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                status === st ? "border-violet bg-violet/20 text-violet-200" : "border-border bg-background text-muted-foreground hover:bg-secondary"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {REVIEW_STATES.map((r) => (
            <button
              key={r}
              onClick={() => setReviewState(r)}
              className={`rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                reviewState === r ? "border-orange-500 bg-orange-500/20 text-orange-200" : "border-border bg-background text-muted-foreground hover:bg-secondary"
              }`}
            >
              {r === "all" ? "all reviews" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {referrals.isLoading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading referrals…
          </div>
        ) : referrals.error ? (
          <div className="p-6 text-sm text-rose-400">{(referrals.error as Error).message}</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No referrals match. When someone signs up via a referral link and pays via Stripe, they'll show up here.
          </div>
        ) : (
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-8"></th>
                <th className="px-4 py-2.5">Referrer</th>
                <th className="px-2 py-2.5"></th>
                <th className="px-4 py-2.5">Referred customer</th>
                <th className="px-4 py-2.5">Qualifying order (Stripe)</th>
                <th className="px-4 py-2.5">Reward</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <Fragment key={r.id}>
                  <tr className="hover:bg-secondary/30">
                    <td className="px-2 py-3">
                      {r.referrer?.user_id && (
                        <button
                          onClick={() => setExpanded(expanded === r.referrer!.user_id ? null : r.referrer!.user_id)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Show full referrer chain"
                        >
                          {expanded === r.referrer.user_id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                      )}
                    </td>
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
                        {r.signup_ip && <span className="ml-1">· {r.signup_ip}</span>}
                      </div>
                      <FlagChips flags={r.flag_reasons} />
                    </td>
                    <td className="px-4 py-3">
                      {r.order ? (
                        <>
                          <div className="font-medium">{r.order.service_label}</div>
                          <div className="text-xs text-muted-foreground">
                            {money(r.order.total_cents, r.order.currency)} · {r.order.payment_status}
                          </div>
                          {r.order.payment_ref && (
                            <div className="mt-0.5 font-mono text-[10px] text-muted-foreground" title={r.order.payment_ref}>
                              {r.order.payment_ref.slice(0, 24)}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">Awaiting first Stripe-paid order</span>
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
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={r.status} />
                        <ReviewBadge state={r.admin_review_state} />
                        {r.paid_out_at && (
                          <div className="text-[10px] text-muted-foreground">paid {new Date(r.paid_out_at).toLocaleDateString()}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        {r.admin_review_state === "flagged" && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => approveMut.mutate(r.id)}
                              disabled={approveMut.isPending}
                              className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 font-mono text-[9px] font-semibold uppercase text-emerald-300 hover:bg-emerald-500/20"
                            >
                              <Check className="size-3" /> Approve
                            </button>
                            <button
                              onClick={() => rejectMut.mutate(r.id)}
                              disabled={rejectMut.isPending}
                              className="inline-flex items-center gap-1 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 font-mono text-[9px] font-semibold uppercase text-rose-300 hover:bg-rose-500/20"
                            >
                              <X className="size-3" /> Reject
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => setEditing(r)}
                          className="rounded-lg border border-border bg-background px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider hover:bg-secondary"
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === r.referrer?.user_id && (
                    <tr>
                      <td colSpan={8} className="border-t border-border/50 bg-secondary/20 px-4 py-3">
                        <ReferrerChainPanel referrerId={r.referrer!.user_id} chainFn={chainFn} />
                      </td>
                    </tr>
                  )}
                </Fragment>
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

function FunnelCard({ icon: Icon, label, value, tint }: { icon: any; label: string; value: number | string; tint: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`size-3.5 ${tint}`} />
      </div>
      <div className="mt-1 font-display text-xl font-bold">{value}</div>
    </div>
  );
}

function ReferrerChainPanel({ referrerId, chainFn }: { referrerId: string; chainFn: (args: { data: { referrer_id: string } }) => Promise<Awaited<ReturnType<typeof adminReferrerChain>>> }) {
  const chain = useQuery({
    queryKey: ["admin-referrer-chain", referrerId],
    queryFn: () => chainFn({ data: { referrer_id: referrerId } }),
  });
  if (chain.isLoading) return <div className="p-2 text-xs text-muted-foreground">Loading chain…</div>;
  if (chain.error) return <div className="p-2 text-xs text-rose-400">{(chain.error as Error).message}</div>;
  const c = chain.data;
  if (!c) return null;
  return (
    <div>
      <div className="mb-2 text-xs text-muted-foreground">
        Full chain for <span className="font-semibold text-foreground">{c.referrer.email}</span>
        {c.referrer.referral_code && <span className="ml-1 font-mono text-violet-300">· {c.referrer.referral_code}</span>}
      </div>
      <div className="space-y-2">
        {c.referrals.map((r) => (
          <div key={r.referral_id} className="rounded-lg border border-border bg-background p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-medium">{r.referred?.full_name || r.referred?.email || "—"}</div>
                <div className="text-[10px] text-muted-foreground">{r.referred?.email}</div>
                <FlagChips flags={r.flag_reasons} />
              </div>
              <div className="flex items-center gap-1.5">
                <StatusBadge status={r.status} />
                <ReviewBadge state={r.admin_review_state} />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-[11px]">
              <div>
                <span className="text-muted-foreground">Earned:</span>{" "}
                <span className="font-mono text-emerald-400">{money(r.credits_earned_cents)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Redeemed:</span>{" "}
                <span className="font-mono text-amber-400">{money(r.credits_redeemed_cents)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Orders:</span>{" "}
                <span className="font-mono">{r.orders.length}</span>
              </div>
            </div>
            {r.orders.length > 0 && (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[500px] text-[11px]">
                  <thead className="text-left font-mono text-[9px] uppercase text-muted-foreground">
                    <tr>
                      <th className="py-1">Service</th>
                      <th className="py-1">Total</th>
                      <th className="py-1">Payment</th>
                      <th className="py-1">Stripe ref</th>
                      <th className="py-1">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {r.orders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-1">{o.service_label}</td>
                        <td className="py-1 font-mono">{money(o.total_cents, o.currency)}</td>
                        <td className="py-1">
                          <span className={o.payment_status === "paid" ? "text-emerald-400" : "text-muted-foreground"}>{o.payment_status}</span>
                        </td>
                        <td className="py-1 font-mono text-[10px] text-muted-foreground" title={o.payment_ref ?? ""}>
                          {(o.payment_ref ?? "").slice(0, 20)}
                        </td>
                        <td className="py-1 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        {c.referrals.length === 0 && <div className="p-2 text-xs text-muted-foreground">No referrals yet.</div>}
      </div>
    </div>
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
  const [method, setMethod] = useState<"credit" | "cash" | "">((row.payout_method as "credit" | "cash" | null) ?? "");
  const [notes, setNotes] = useState(row.notes ?? "");

  return (
    <div className="mt-4 space-y-3">
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
          {STATUSES.filter((s) => s !== "all").map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Payout method</span>
        <select value={method} onChange={(e) => setMethod(e.target.value as "credit" | "cash" | "")} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">— none —</option>
          <option value="credit">Store credit</option>
          <option value="cash">Cash payout</option>
        </select>
      </label>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Notes</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Internal notes (payout ref, disputes, etc.)" />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-secondary">
          Cancel
        </button>
        <button
          disabled={submitting}
          onClick={() => onSubmit({ status, payout_method: method || undefined, notes: notes || undefined })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet/90 disabled:opacity-50"
        >
          {submitting && <Loader2 className="size-3.5 animate-spin" />}
          Save
        </button>
      </div>
    </div>
  );
}
