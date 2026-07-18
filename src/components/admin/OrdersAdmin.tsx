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
  adminCreateOrder,
  adminUpdateOrder,
  adminDeleteOrder,
} from "@/lib/admin-orders.functions";
import { Loader2, Package, DollarSign, RefreshCcw, Send, Ban, CheckCircle2, Mail } from "@/components/admin/AdminIcons";
import { Plus, Pencil, Trash2 } from "lucide-react";

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
  const [editFor, setEditFor] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteFor, setDeleteFor] = useState<any | null>(null);

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-3.5" /> New order
          </button>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
          >
            <RefreshCcw className="size-3.5" /> Refresh
          </button>
        </div>
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
                  <InlineStatusSelect order={o} onDone={refresh} />
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
                      onClick={() => setEditFor(o)}
                      className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold hover:bg-primary/10 hover:text-primary"
                      title="Edit order"
                    >
                      <Pencil className="inline size-3" /> Edit
                    </button>
                    <button
                      onClick={() => setCancelFor(o)}
                      className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold hover:bg-rose-500/10 hover:text-rose-500"
                      title="Cancel / refund"
                    >
                      <Ban className="inline size-3" /> Cancel
                    </button>
                    <button
                      onClick={() => setDeleteFor(o)}
                      className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold hover:bg-rose-500/10 hover:text-rose-500"
                      title="Delete order"
                    >
                      <Trash2 className="inline size-3" />
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
      {creating && <OrderFormDialog onClose={() => setCreating(false)} onDone={refresh} />}
      {editFor && (
        <OrderFormDialog order={editFor} onClose={() => setEditFor(null)} onDone={refresh} />
      )}
      {deleteFor && <DeleteDialog order={deleteFor} onClose={() => setDeleteFor(null)} onDone={refresh} />}
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
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-3 font-display text-lg font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function toLocalDT(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const tz = d.getTime() - d.getTimezoneOffset() * 60000;
  return new Date(tz).toISOString().slice(0, 16);
}

function OrderFormDialog({
  order,
  onClose,
  onDone,
}: {
  order?: any;
  onClose: () => void;
  onDone: () => void;
}) {
  const isEdit = !!order;
  const createFn = useServerFn(adminCreateOrder);
  const updateFn = useServerFn(adminUpdateOrder);
  const [form, setForm] = useState({
    email: order?.email ?? "",
    service_label: order?.service_label ?? "",
    service_id: order?.service_id ?? "",
    quantity: order?.quantity ?? 1,
    subtotal: ((order?.subtotal_cents ?? 0) / 100).toString(),
    discount: ((order?.discount_cents ?? 0) / 100).toString(),
    total: ((order?.total_cents ?? 0) / 100).toString(),
    currency: order?.currency ?? "USD",
    promo_code: order?.promo_code ?? "",
    status: order?.status ?? "pending",
    payment_status: order?.payment_status ?? "paid",
    payment_provider: order?.payment_provider ?? "manual",
    payment_ref: order?.payment_ref ?? "",
    delivery_url: order?.delivery_url ?? "",
    delivery_notes: order?.delivery_notes ?? "",
    created_at: toLocalDT(order?.created_at) || toLocalDT(new Date().toISOString()),
  });
  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const m = useMutation({
    mutationFn: async () => {
      const payload = {
        email: form.email.trim(),
        service_label: form.service_label.trim(),
        service_id: form.service_id.trim() || null,
        quantity: Number(form.quantity) || 1,
        subtotal_cents: Math.round(Number(form.subtotal) * 100) || 0,
        discount_cents: Math.round(Number(form.discount) * 100) || 0,
        total_cents: Math.round(Number(form.total) * 100) || 0,
        currency: form.currency.trim().toUpperCase() || "USD",
        promo_code: form.promo_code.trim() || null,
        status: form.status,
        payment_status: form.payment_status,
        payment_provider: form.payment_provider.trim() || null,
        payment_ref: form.payment_ref.trim() || null,
        delivery_url: form.delivery_url.trim() || null,
        delivery_notes: form.delivery_notes.trim() || null,
        created_at: form.created_at ? new Date(form.created_at).toISOString() : undefined,
      };
      if (isEdit) return updateFn({ data: { id: order.id, patch: payload } });
      return createFn({ data: payload });
    },
    onSuccess: () => {
      onDone();
      onClose();
    },
  });

  return (
    <Modal onClose={onClose} title={isEdit ? `Edit ${order.short_id ?? "order"}` : "Create order"}>
      <div className="grid gap-2.5 text-xs">
        <Field label="Customer email" required>
          <input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" className={inp} placeholder="client@example.com" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Service label" required>
            <input value={form.service_label} onChange={(e) => set("service_label", e.target.value)} className={inp} placeholder="Apollo Leads" />
          </Field>
          <Field label="Service ID">
            <input value={form.service_id} onChange={(e) => set("service_id", e.target.value)} className={inp} placeholder="apollo" />
          </Field>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Field label="Qty"><input type="number" min={1} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className={inp} /></Field>
          <Field label="Subtotal"><input value={form.subtotal} onChange={(e) => set("subtotal", e.target.value)} className={inp} /></Field>
          <Field label="Discount"><input value={form.discount} onChange={(e) => set("discount", e.target.value)} className={inp} /></Field>
          <Field label="Total"><input value={form.total} onChange={(e) => set("total", e.target.value)} className={inp} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Currency"><input value={form.currency} onChange={(e) => set("currency", e.target.value)} className={inp} /></Field>
          <Field label="Promo code"><input value={form.promo_code} onChange={(e) => set("promo_code", e.target.value)} className={inp} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inp}>
              {["pending", "in_progress", "delivered", "cancelled", "refunded", "revision_requested"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Payment status">
            <select value={form.payment_status} onChange={(e) => set("payment_status", e.target.value)} className={inp}>
              {["paid", "unpaid", "pending", "refunded", "failed"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Payment provider"><input value={form.payment_provider} onChange={(e) => set("payment_provider", e.target.value)} className={inp} placeholder="stripe/manual" /></Field>
          <Field label="Payment ref"><input value={form.payment_ref} onChange={(e) => set("payment_ref", e.target.value)} className={inp} placeholder="cs_..." /></Field>
        </div>
        <Field label="Order date"><input type="datetime-local" value={form.created_at} onChange={(e) => set("created_at", e.target.value)} className={inp} /></Field>
        <Field label="Delivery URL"><input value={form.delivery_url} onChange={(e) => set("delivery_url", e.target.value)} className={inp} placeholder="https://drive.google.com/..." /></Field>
        <Field label="Delivery notes"><textarea rows={2} value={form.delivery_notes} onChange={(e) => set("delivery_notes", e.target.value)} className={inp} /></Field>
      </div>
      {m.error && <p className="mt-2 text-xs text-rose-500">{(m.error as Error).message}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs">Cancel</button>
        <button
          disabled={m.isPending || !form.email || !form.service_label}
          onClick={() => m.mutate()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
        >
          {m.isPending ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
          {isEdit ? "Save changes" : "Create order"}
        </button>
      </div>
    </Modal>
  );
}

const inp = "w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function DeleteDialog({ order, onClose, onDone }: { order: any; onClose: () => void; onDone: () => void }) {
  const fn = useServerFn(adminDeleteOrder);
  const m = useMutation({
    mutationFn: () => fn({ data: { id: order.id } }),
    onSuccess: () => { onDone(); onClose(); },
  });
  const shortId = order.short_id ?? `ORD-${String(order.id).slice(0, 8).toUpperCase()}`;
  return (
    <Modal onClose={onClose} title={`Delete ${shortId}?`}>
      <p className="mb-4 text-xs text-muted-foreground">
        This permanently removes the order and its events/messages. This cannot be undone.
      </p>
      {m.error && <p className="mb-2 text-xs text-rose-500">{(m.error as Error).message}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs">Cancel</button>
        <button
          disabled={m.isPending}
          onClick={() => m.mutate()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {m.isPending ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
          Delete
        </button>
      </div>
    </Modal>
  );
}
