import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListStripeEvents, type StripeEventRow } from "@/lib/admin-stripe-events.functions";
import { CheckCircle2, RefreshCw, ShieldCheck, Webhook, XCircle } from "@/components/admin/AdminIcons";

const TYPES = [
  "all",
  "checkout.session.completed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "charge.refunded",
];

function money(cents: number | null, currency: string | null) {
  if (cents == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency ?? ""}`.trim();
  }
}

function relTime(iso: string) {
  const d = new Date(iso).getTime();
  const s = Math.max(1, Math.round((Date.now() - d) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function StripeEventsAdmin() {
  const listFn = useServerFn(adminListStripeEvents);
  const [type, setType] = useState<string>("all");
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["admin-stripe-events", type],
    queryFn: () => listFn({ data: { type, limit: 100 } }),
    retry: false,
  });

  const rows = data ?? [];
  const stats = useMemo(() => {
    const total = rows.length;
    const verified = rows.filter((r) => r.verified).length;
    const linked = rows.filter((r) => r.order_id).length;
    return { total, verified, linked };
  }, [rows]);

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-violet/15 text-violet ring-1 ring-violet/30">
            <Webhook className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold">Stripe webhook events</h2>
            <p className="text-xs text-muted-foreground">
              Latest events received at <code className="rounded bg-muted px-1 py-0.5">/api/public/webhooks/stripe</code>.
              Rows are only stored after HMAC-SHA256 signature verification passes, so every
              entry below is signature-verified.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-px border-b border-border bg-border text-center text-xs">
        <Stat label="Events" value={stats.total} />
        <Stat
          label="Verified"
          value={`${stats.verified}/${stats.total || 0}`}
          tone="ok"
        />
        <Stat
          label="Linked to order"
          value={`${stats.linked}/${stats.total || 0}`}
          tone={stats.linked === stats.total ? "ok" : "warn"}
        />
      </div>

      {error ? (
        <div className="p-4 text-sm text-rose-400">
          {(error as Error).message || "Failed to load events."}
        </div>
      ) : isLoading ? (
        <div className="p-6 text-sm text-muted-foreground">Loading events…</div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">
          No webhook events yet. Trigger a test purchase and they'll show up here.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Event</th>
                <th className="px-4 py-2 font-medium">Sig</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Stripe ref</th>
                <th className="px-4 py-2 font-medium">Order</th>
                <th className="px-4 py-2 font-medium">Referral</th>
                <th className="px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Row key={r.id} r={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "ok" | "warn";
}) {
  const color =
    tone === "ok"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-400"
        : "text-foreground";
  return (
    <div className="bg-card px-3 py-2.5">
      <div className={`font-display text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Row({ r }: { r: StripeEventRow }) {
  return (
    <tr className="border-t border-border align-top">
      <td className="px-4 py-3">
        <div className="font-mono text-xs">{r.type}</div>
        <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground" title={r.id}>
          {r.id}
        </div>
        {r.customer_email ? (
          <div className="mt-0.5 text-[11px] text-muted-foreground">{r.customer_email}</div>
        ) : null}
      </td>
      <td className="px-4 py-3">
        {r.verified ? (
          <span
            className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/30"
            title="stripe-signature HMAC verified"
          >
            <ShieldCheck className="size-3" /> valid
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-medium text-rose-400 ring-1 ring-rose-500/30">
            <XCircle className="size-3" /> invalid
          </span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">{money(r.amount_cents, r.currency)}</td>
      <td className="px-4 py-3">
        {r.stripe_ref ? (
          <a
            href={`https://dashboard.stripe.com/test/payments/${r.stripe_ref}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-violet hover:underline"
            title="Open in Stripe dashboard (test mode)"
          >
            {r.stripe_ref}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {r.order_id ? (
          <a
            href={`/_authenticated/invoice/${r.order_id}`}
            className="inline-flex items-center gap-1.5 text-xs hover:underline"
          >
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            <span className="font-mono">{r.order_id.slice(0, 8)}…</span>
            {r.order_payment_status ? (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                {r.order_payment_status}
              </span>
            ) : null}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">unmatched</span>
        )}
      </td>
      <td className="px-4 py-3">
        {r.referral_id ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-violet/10 px-1.5 py-0.5 text-[11px] font-medium text-violet ring-1 ring-violet/30">
            {r.referral_status ?? "referral"}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground" title={r.received_at}>
        {relTime(r.received_at)}
      </td>
    </tr>
  );
}
