/**
 * Admin orders API — thin proxies to PHP `/api/admin/orders/*`.
 *
 * Batch 3 of the Supabase → PHP/MySQL migration. Not TanStack server
 * functions anymore. Auth / role check happens server-side in PHP
 * (`Auth::requireAdmin()`). Call sites should call these directly
 * (no `useServerFn` wrapper).
 */
import { adminOrdersApi } from "@/lib/api-client";

type OrderRow = Record<string, unknown> & {
  id: string;
  user_id: string | null;
  short_id?: string;
  customer_name?: string | null;
};

export async function adminListOrders(args?: {
  data?: {
    status?: string;
    search?: string;
    limit?: number;
    view?: "active" | "archived";
    dateFrom?: string;
    dateTo?: string;
  };
}) {
  const d = args?.data ?? {};
  const query: Record<string, string> = {};
  if (d.status && d.status !== "all") query.status = d.status;
  if (d.search) query.q = d.search;
  if (d.view) query.view = d.view;
  if (d.dateFrom) query.from = d.dateFrom;
  if (d.dateTo) query.to = d.dateTo;
  if (d.limit) query.limit = String(d.limit);
  const { orders } = await adminOrdersApi.list(query);
  return (orders ?? []) as OrderRow[];
}

export async function adminOrderStats() {
  const res = await fetch("/api/admin/orders/stats", {
    headers: { authorization: `Bearer ${localStorage.getItem("api_token") ?? ""}` },
  });
  if (!res.ok) throw new Error(`Stats ${res.status}`);
  return res.json() as Promise<{
    total_orders: number;
    paid_count: number;
    revenue_cents: number;
    revenue_month_cents: number;
    refunded_cents: number;
    avg_order_cents: number;
    by_status: Record<string, number>;
  }>;
}

export async function adminDeliverOrder(args: {
  data: { id: string; delivery_url: string; delivery_notes?: string | null };
}) {
  await adminOrdersApi.update(args.data.id, {
    status: "delivered",
    delivery_url: args.data.delivery_url,
    delivery_notes: args.data.delivery_notes ?? null,
    delivered_at: new Date().toISOString(),
  });
  return { ok: true };
}

export async function adminCancelOrder(args: {
  data: { id: string; reason: string; refund?: boolean };
}) {
  await adminOrdersApi.update(args.data.id, {
    status: args.data.refund ? "refunded" : "cancelled",
    cancel_reason: args.data.reason,
    payment_status: args.data.refund ? "refunded" : undefined,
  });
  return { ok: true };
}

export async function adminSetStatus(args: {
  data: { id: string; status: string };
}) {
  await adminOrdersApi.update(args.data.id, { status: args.data.status });
  return { ok: true };
}

export async function adminSendMagicLink(args: { data: { email: string } }) {
  const res = await fetch("/api/admin/users/magic-link", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${localStorage.getItem("api_token") ?? ""}`,
    },
    body: JSON.stringify({ email: args.data.email }),
  });
  if (!res.ok) throw new Error(`Magic link ${res.status}`);
  return { ok: true };
}

export async function adminCreateOrder(args: { data: Record<string, unknown> }) {
  return adminOrdersApi.create(args.data);
}

export async function adminUpdateOrder(args: {
  data: { id: string; patch: Record<string, unknown> };
}) {
  await adminOrdersApi.update(args.data.id, args.data.patch);
  return { ok: true };
}

export async function adminDeleteOrder(args: { data: { id: string } }) {
  await adminOrdersApi.destroy(args.data.id);
  return { ok: true };
}

export async function adminArchiveOrders(args: { data: { ids: string[] } }) {
  await adminOrdersApi.bulk("archive", args.data.ids);
  return { ok: true, count: args.data.ids.length };
}

export async function adminRestoreOrders(args: { data: { ids: string[] } }) {
  await adminOrdersApi.bulk("restore", args.data.ids);
  return { ok: true, count: args.data.ids.length };
}

export async function adminDeleteOrders(args: { data: { ids: string[] } }) {
  await adminOrdersApi.bulk("delete", args.data.ids);
  return { ok: true, count: args.data.ids.length };
}
