import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyOrders, getMyOrder, getMyProfile, updateMyProfile, requestRevision } from "@/lib/orders.functions";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Loader2, Download, Package, User as UserIcon, Receipt, RotateCcw, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your dashboard" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: DashboardPage,
});

type Tab = "orders" | "downloads" | "profile";

function DashboardPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const listFn = useServerFn(listMyOrders);
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => listFn() });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-6">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">Dashboard</span>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Your orders</h1>
        </header>

        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1">
          <TabBtn active={tab === "orders"} onClick={() => setTab("orders")} icon={<Package className="size-4" />}>
            Orders
          </TabBtn>
          <TabBtn active={tab === "downloads"} onClick={() => setTab("downloads")} icon={<Download className="size-4" />}>
            Downloads
          </TabBtn>
          <TabBtn active={tab === "profile"} onClick={() => setTab("profile")} icon={<UserIcon className="size-4" />}>
            Profile
          </TabBtn>
        </div>

        {tab === "orders" && <OrdersTab orders={orders.data ?? []} loading={orders.isLoading} />}
        {tab === "downloads" && <DownloadsTab orders={(orders.data ?? []).filter((o: any) => o.delivery_url)} />}
        {tab === "profile" && <ProfileTab />}
      </main>
      <Footer />
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-violet text-white" : "text-muted-foreground hover:bg-secondary"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

function OrdersTab({ orders, loading }: { orders: any[]; loading: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (loading) return <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />;
  if (orders.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">No orders yet.</p>
        <Link to="/store" className="mt-3 inline-block rounded-lg bg-violet px-4 py-2 text-sm font-semibold text-white">
          Browse services
        </Link>
      </div>
    );
  return (
    <>
      <div className="grid gap-3">
        {orders.map((o) => (
          <button
            key={o.id}
            onClick={() => setOpenId(o.id)}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-violet sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="font-display text-base font-semibold">{o.service_label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {new Date(o.created_at).toLocaleDateString()} · qty {o.quantity}
                {o.promo_code && ` · promo ${o.promo_code}`}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill value={o.status} />
              <div className="font-mono text-sm font-semibold">{money(o.total_cents, o.currency)}</div>
            </div>
          </button>
        ))}
      </div>
      {openId && <OrderDrawer id={openId} onClose={() => setOpenId(null)} />}
    </>
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

function OrderDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const getFn = useServerFn(getMyOrder);
  const revFn = useServerFn(requestRevision);
  const { data, isLoading } = useQuery({ queryKey: ["my-order", id], queryFn: () => getFn({ data: { id } }) });
  const [revText, setRevText] = useState("");
  const rev = useMutation({
    mutationFn: () => revFn({ data: { order_id: id, message: revText } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-order", id] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      setRevText("");
    },
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-end bg-black/50 sm:items-stretch" onClick={onClose}>
      <div
        className="h-full w-full max-w-xl overflow-y-auto border-l border-border bg-background p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="mb-4 text-xs text-muted-foreground hover:text-foreground">
          ← Close
        </button>
        {isLoading || !data?.order ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="mb-4">
              <h2 className="font-display text-2xl font-bold">{data.order.service_label}</h2>
              <div className="mt-1 flex items-center gap-2">
                <StatusPill value={data.order.status} />
                <span className="font-mono text-sm">{money(data.order.total_cents, data.order.currency)}</span>
              </div>
            </div>

            {data.order.delivery_url && (
              <div className="mb-4 rounded-xl border border-emerald/40 bg-emerald/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald">
                  <Download className="size-4" /> Delivery ready
                </div>
                {data.order.delivery_notes && (
                  <p className="mb-3 text-sm text-muted-foreground">{data.order.delivery_notes}</p>
                )}
                <a
                  href={data.order.delivery_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald px-4 py-2 text-sm font-semibold text-white"
                >
                  Open in Google Drive <ExternalLink className="size-4" />
                </a>
              </div>
            )}

            {data.order.cancel_reason && (
              <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/5 p-4 text-sm">
                <div className="mb-1 font-semibold text-rose-500">Order {data.order.status}</div>
                <p className="text-muted-foreground">{data.order.cancel_reason}</p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Timeline
              </h3>
              <ul className="space-y-2">
                <li className="rounded-lg border border-border bg-card p-3 text-xs">
                  <div className="font-semibold">Order placed</div>
                  <div className="text-muted-foreground">{new Date(data.order.created_at).toLocaleString()}</div>
                </li>
                {data.events.map((e: any) => (
                  <li key={e.id} className="rounded-lg border border-border bg-card p-3 text-xs">
                    <div className="font-semibold uppercase">{e.event_type.replace("_", " ")}</div>
                    <div className="text-muted-foreground">
                      {new Date(e.created_at).toLocaleString()} · {e.actor_role}
                    </div>
                    {e.message && <p className="mt-1">{e.message}</p>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              <Link
                to="/invoice/$orderId"
                params={{ orderId: id }}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                <Receipt className="size-3" /> View invoice
              </Link>
              <Link
                to="/store"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                <RotateCcw className="size-3" /> Reorder
              </Link>
            </div>

            <div>
              <h3 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Request revision
              </h3>
              <textarea
                value={revText}
                onChange={(e) => setRevText(e.target.value)}
                rows={3}
                placeholder="Describe what needs changing..."
                className="w-full rounded-lg border border-border bg-background p-3 text-sm"
              />
              <button
                disabled={revText.trim().length < 3 || rev.isPending}
                onClick={() => rev.mutate()}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-violet px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {rev.isPending ? <Loader2 className="size-3 animate-spin" /> : null}
                Send revision request
              </button>
              {rev.isSuccess && <p className="mt-2 text-xs text-emerald">Sent — admin has been notified.</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DownloadsTab({ orders }: { orders: any[] }) {
  if (orders.length === 0)
    return <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">No delivered files yet.</p>;
  return (
    <div className="grid gap-3">
      {orders.map((o) => (
        <div key={o.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <div className="font-semibold">{o.service_label}</div>
            <div className="text-xs text-muted-foreground">
              Delivered {o.delivered_at ? new Date(o.delivered_at).toLocaleDateString() : "—"}
            </div>
            {o.delivery_notes && <p className="mt-1 text-xs text-muted-foreground">{o.delivery_notes}</p>}
          </div>
          <a
            href={o.delivery_url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald px-3 py-1.5 text-xs font-semibold text-white"
          >
            Open <ExternalLink className="size-3" />
          </a>
        </div>
      ))}
    </div>
  );
}

function ProfileTab() {
  const getFn = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-profile"], queryFn: () => getFn() });
  const [form, setForm] = useState<{ full_name: string; company: string; phone: string; country: string }>({
    full_name: "",
    company: "",
    phone: "",
    country: "",
  });
  useMemo(() => {
    if (data) setForm({ full_name: data.full_name ?? "", company: data.company ?? "", phone: data.phone ?? "", country: data.country ?? "" });
  }, [data]);
  const save = useMutation({
    mutationFn: () => updateFn({ data: form }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-profile"] }),
  });

  if (isLoading || !data) return <Loader2 className="size-5 animate-spin" />;

  return (
    <div className="max-w-xl rounded-2xl border border-border bg-card p-5">
      <div className="mb-4">
        <label className="text-xs font-semibold">Email</label>
        <input value={data.email} disabled className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm opacity-70" />
      </div>
      {(["full_name", "company", "phone", "country"] as const).map((k) => (
        <div key={k} className="mb-3">
          <label className="text-xs font-semibold capitalize">{k.replace("_", " ")}</label>
          <input
            value={(form as any)[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      ))}
      <button
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {save.isPending ? <Loader2 className="size-3 animate-spin" /> : null}
        Save changes
      </button>
      {save.isSuccess && <p className="mt-2 text-xs text-emerald">Saved.</p>}
    </div>
  );
}
