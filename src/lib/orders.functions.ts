/**
 * Customer-scoped orders/profile API — thin proxies to the PHP backend.
 *
 * Batch 3 of the Supabase → PHP/MySQL migration. These are no longer
 * TanStack server functions — they are plain async functions that mirror
 * the old `fn({ data })` signature so existing call sites work unchanged
 * (just drop the `useServerFn(...)` wrapper).
 *
 * All auth / RLS / price-floor / promo validation now lives in the PHP
 * controllers under /api/orders/* (server-side JWT verification via
 * `Auth::requireUser()`).
 */
import { ordersApi, authApi } from "@/lib/api-client";

type Empty = Record<string, never>;

export async function listMyOrders(_?: { data?: Empty }) {
  const { orders } = await ordersApi.list();
  return orders ?? [];
}

export async function getMyOrder(args: { data: { id: string } }) {
  const { order } = await ordersApi.get(args.data.id);
  // Events feed for customer view — PHP endpoint returns messages; treat as
  // event log for the timeline UI until a dedicated /events route ships.
  let events: unknown[] = [];
  try {
    const { messages } = await ordersApi.messages(args.data.id);
    events = messages ?? [];
  } catch {
    /* non-fatal */
  }
  return { order, events };
}

export async function getMyProfile(_?: { data?: Empty }) {
  const r = (await authApi.me()) as { profile?: unknown; user?: unknown };
  return r.profile ?? r.user ?? r;
}

export async function updateMyProfile(args: {
  data: {
    full_name?: string | null;
    company?: string | null;
    phone?: string | null;
    country?: string | null;
    avatar_url?: string | null;
  };
}) {
  await authApi.updateMe(args.data as Record<string, unknown>);
  return { ok: true };
}

export async function requestRevision(args: {
  data: { order_id: string; message: string };
}) {
  await ordersApi.postMessage(args.data.order_id, args.data.message);
  return { ok: true };
}

export async function recordMyOrder(args: {
  data: {
    payment_ref: string;
    service_label: string;
    service_id?: string | null;
    quantity: number;
    subtotal_cents: number;
    discount_cents?: number;
    promo_code?: string | null;
    total_cents: number;
    currency?: string;
    payment_provider?: string;
    credit_applied_cents?: number;
  };
}) {
  return ordersApi.create(args.data) as Promise<{
    id: string;
    ok?: boolean;
    duplicate?: boolean;
    credit_spent_cents?: number;
  }>;
}
