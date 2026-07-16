import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListOrders,
  adminOrderStats,
  adminDeliverOrder,
  adminCancelOrder,
  adminSetStatus,
  adminSendMagicLink,
} from "@/lib/admin-orders.functions";
import { Loader2, Package, DollarSign, RefreshCcw, Send, Ban, CheckCircle2, Mail } from "@/components/admin/AdminIcons";

const STATUSES = ["all", "pending", "in_progress", "delivered", "cancelled", "refunded", "revision_requested"];

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

export function OrdersAdmin() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListOrders);
  const statsFn = useServerFn(adminOrderStats);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const stats = useQuery({ queryKey: ["admin-order-stats"], queryFn: () => statsFn() });
  const orders = useQuery({
    queryKey: ["admin-orders", status, search],
    queryFn: () => listFn({ data: { status, search: search || undefined, limit: 200 } }),
  });

  const [deliverFor, setDeliverFor] = useState<any | null>(null);
  const [cancelFor, setCancelFor] = useState<any | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["admin-order-stats"] });
  };

  const s = stats.data;
  const rows = orders.data ?? [];

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">Orders</span>
          <h2 className="font-display text-xl font-bold">Orders &amp; Revenue</h2>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
        >
          <RefreshCcw className="size-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<DollarSign className="size-4" />} label="Revenue (all-time)" value={s ? money(s.revenue_cents) : "—"} accent="emerald" />
        <StatCard icon={<DollarSign className="size-4" />} label="Revenue (30d)" value={s ? money(s.revenue_month_cents) : "—"} accent="violet" />
        <StatCard icon={<Package className="size-4" />} label="Paid orders" value={s ? String(s.paid_count) : "—"} accent="sky" />
        <StatCard icon={<RefreshCcw className="size-4" />} label="Refunded" value={s ? money(s.refunded_cents) : "—"} accent="rose" />
      </div>

      {s && (
        <div className="mb-5 flex flex-wrap gap-2">
          {Object.entries(s.by_status).map(([k, v]) => (
            <span key={k} className="rounded-full border border-border bg-background px-3 py-1 text-xs">
              <span className="font-mono uppercase tracking-wider text-muted-foreground">{k.replace("_", " ")}</span>{" "}
              <span className="font-semibold">{v as number}</span>
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
        >
          {STATUSES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email, service, promo..."
          className="min-w-[220px] flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-2.5">Order ID</th>
              <th className="p-2.5">Date</th>
              <th className="p-2.5">Customer</th>
              <th className="p-2.5">Service</th>
              <th className="p-2.5">Amount</th>
              <th className="p-2.5">Status</th>
              <th className="p-2.5">Pay</th>
              <th className="p-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.isLoading && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  <Loader2 className="mx-auto size-4 animate-spin" />
                </td>
              </tr>
            )}
            {!orders.isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  No orders match.
                </td>
              </tr>
            )}
            {rows.map((o: any) => (
              <tr key={o.id} className="border-t border-border">
                <td className="p-2.5 font-mono text-xs font-bold text-[#facc15]">
                  {o.short_id ?? `ORD-${String(o.id).slice(0, 8).toUpperCase()}`}
                </td>
                <td className="p-2.5 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="p-2.5">
                  <div className="font-semibold">{o.customer_name || o.email?.split("@")[0] || "Guest"}</div>
                  <div className="text-[11px] text-muted-foreground">{o.email}</div>
                  {o.promo_code && <div className="text-[10px] uppercase text-muted-foreground">promo {o.promo_code}</div>}
                </td>
                <td className="p-2.5">
                  <div className="font-medium">{o.service_label}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">qty {o.quantity}</div>
                </td>
                <td className="p-2.5 font-mono text-sm">{money(o.total_cents, o.currency)}</td>
                <td className="p-2.5">
                  <StatusPill value={o.status} />
                </td>
                <td className="p-2.5 text-xs">{o.payment_status}</td>
                <td className="p-2.5">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setDeliverFor(o)}
                      className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold hover:bg-emerald/10 hover:text-emerald"
                      title="Deliver with GDrive URL"
                    >
                      <Send className="inline size-3" /> Deliver
                    </button>
                    <button
                      onClick={() => setCancelFor(o)}
                      className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold hover:bg-rose-500/10 hover:text-rose-500"
                      title="Cancel / refund"
                    >
                      <Ban className="inline size-3" /> Cancel
                    </button>
                    <MagicLinkButton email={o.email} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deliverFor && <DeliverDialog order={deliverFor} onClose={() => setDeliverFor(null)} onDone={refresh} />}
      {cancelFor && <CancelDialog order={cancelFor} onClose={() => setCancelFor(null)} onDone={refresh} />}
    </section>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  const map: Record<string, string> = {
    emerald: "text-emerald bg-emerald/10",
    violet: "text-violet bg-violet/10",
    sky: "text-sky-500 bg-sky-500/10",
    rose: "text-rose-500 bg-rose-500/10",
  };
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <span className={`flex size-7 items-center justify-center rounded-lg ${map[accent]}`}>{icon}</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2 font-display text-xl font-bold">{value}</div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600",
    in_progress: "bg-sky-500/10 text-sky-500",
    delivered: "bg-emerald/10 text-emerald",
    cancelled: "bg-muted text-muted-foreground",
    refunded: "bg-rose-500/10 text-rose-500",
    revision_requested: "bg-violet/10 text-violet",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${map[value] ?? "bg-secondary"}`}>
      {value.replace("_", " ")}
    </span>
  );
}

function DeliverDialog({ order, onClose, onDone }: { order: any; onClose: () => void; onDone: () => void }) {
  const fn = useServerFn(adminDeliverOrder);
  const [url, setUrl] = useState(order.delivery_url ?? "");
  const [notes, setNotes] = useState(order.delivery_notes ?? "");
  const m = useMutation({
    mutationFn: () => fn({ data: { id: order.id, delivery_url: url, delivery_notes: notes } }),
    onSuccess: () => {
      onDone();
      onClose();
    },
  });
  const shortId = order.short_id ?? `ORD-${String(order.id).slice(0, 8).toUpperCase()}`;
  const customer = order.customer_name || order.email?.split("@")[0] || "Guest";
  return (
    <Modal onClose={onClose} title={`Deliver ${shortId}`}>
      <div className="mb-3 rounded-lg border border-border bg-background/50 p-2.5 text-xs">
        <div className="font-bold text-foreground">{customer}</div>
        <div className="text-muted-foreground">{order.email}</div>
        <div className="mt-1 text-muted-foreground">{order.service_label} · qty {order.quantity}</div>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Paste the Google Drive share URL. The client will see this on their dashboard.
      </p>
      <label className="mb-1 block text-xs font-semibold">Google Drive URL</label>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://drive.google.com/..."
        className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <label className="mb-1 block text-xs font-semibold">Notes (optional)</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      {m.error && <p className="mb-2 text-xs text-rose-500">{(m.error as Error).message}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs">
          Cancel
        </button>
        <button
          disabled={!url || m.isPending}
          onClick={() => m.mutate()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {m.isPending ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
          Mark delivered
        </button>
      </div>
    </Modal>
  );
}

function CancelDialog({ order, onClose, onDone }: { order: any; onClose: () => void; onDone: () => void }) {
  const fn = useServerFn(adminCancelOrder);
  const [reason, setReason] = useState("");
  const [refund, setRefund] = useState(false);
  const m = useMutation({
    mutationFn: () => fn({ data: { id: order.id, reason, refund } }),
    onSuccess: () => {
      onDone();
      onClose();
    },
  });
  const shortId = order.short_id ?? `ORD-${String(order.id).slice(0, 8).toUpperCase()}`;
  const customer = order.customer_name || order.email?.split("@")[0] || "Guest";
  return (
    <Modal onClose={onClose} title={`Cancel ${shortId}`}>
      <div className="mb-3 rounded-lg border border-border bg-background/50 p-2.5 text-xs">
        <div className="font-bold text-foreground">{customer}</div>
        <div className="text-muted-foreground">{order.email}</div>
      </div>
      <label className="mb-1 block text-xs font-semibold">Reason (shown to client)</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <label className="mb-3 inline-flex items-center gap-2 text-xs">
        <input type="checkbox" checked={refund} onChange={(e) => setRefund(e.target.checked)} />
        Also mark as refunded
      </label>
      {m.error && <p className="mb-2 text-xs text-rose-500">{(m.error as Error).message}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs">
          Back
        </button>
        <button
          disabled={!reason || m.isPending}
          onClick={() => m.mutate()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {m.isPending ? <Loader2 className="size-3 animate-spin" /> : <Ban className="size-3" />}
          Confirm
        </button>
      </div>
    </Modal>
  );
}

function MagicLinkButton({ email }: { email: string }) {
  const fn = useServerFn(adminSendMagicLink);
  const m = useMutation({ mutationFn: () => fn({ data: { email } }) });
  return (
    <button
      onClick={() => m.mutate()}
      disabled={m.isPending}
      className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold hover:bg-violet/10 hover:text-violet disabled:opacity-50"
      title="Send login link to client"
    >
      {m.isPending ? <Loader2 className="inline size-3 animate-spin" /> : <Mail className="inline size-3" />}
      {m.isSuccess ? " Sent" : " Login link"}
    </button>
  );
}

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-3 font-display text-lg font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}
