import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/require-admin";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type StripeEventRow = {
  id: string;
  type: string;
  received_at: string;
  /**
   * Signature verification result. The webhook only inserts a row after
   * `verifyStripeSignature` returns true, so every stored row is verified.
   * Kept as an explicit field so future work (e.g. logging rejected
   * attempts) can flip it to `false`.
   */
  verified: boolean;
  amount_cents: number | null;
  currency: string | null;
  stripe_ref: string | null;
  customer_email: string | null;
  order_id: string | null;
  order_status: string | null;
  order_payment_status: string | null;
  referral_id: string | null;
  referral_status: string | null;
};


function pickStripeRef(payload: any): string | null {
  const obj = payload?.data?.object;
  return obj?.id ?? null;
}
function pickAmount(payload: any): number | null {
  const obj = payload?.data?.object ?? {};
  const v = obj.amount_total ?? obj.amount_received ?? obj.amount ?? null;
  return Number.isFinite(v) ? v : null;
}
function pickCurrency(payload: any): string | null {
  const c = payload?.data?.object?.currency;
  return c ? String(c).toUpperCase() : null;
}
function pickEmail(payload: any): string | null {
  const obj = payload?.data?.object ?? {};
  return obj.customer_details?.email ?? obj.customer_email ?? obj.receipt_email ?? null;
}

export const adminListStripeEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        limit: z.number().int().min(1).max(200).optional(),
        type: z.string().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<StripeEventRow[]> => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;

    let q = sb
      .from("stripe_events")
      .select("id,type,received_at,payload")
      .order("received_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.type && data.type !== "all") q = q.eq("type", data.type);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const events = (rows ?? []) as Array<{
      id: string;
      type: string;
      received_at: string;
      payload: any;
    }>;

    const refs = events.map((e) => pickStripeRef(e.payload)).filter(Boolean) as string[];
    let ordersByRef = new Map<string, any>();
    if (refs.length) {
      const { data: orders } = await sb
        .from("orders")
        .select("id,user_id,status,payment_status,payment_ref")
        .in("payment_ref", refs);
      for (const o of orders ?? []) ordersByRef.set(o.payment_ref, o);
    }

    const userIds = Array.from(
      new Set(
        Array.from(ordersByRef.values())
          .map((o) => o.user_id)
          .filter(Boolean),
      ),
    ) as string[];
    let referralByUser = new Map<string, any>();
    if (userIds.length) {
      const { data: refRows } = await sb
        .from("referrals")
        .select("id,referred_user_id,status")
        .in("referred_user_id", userIds);
      for (const r of refRows ?? []) referralByUser.set(r.referred_user_id, r);
    }

    return events.map((e): StripeEventRow => {
      const ref = pickStripeRef(e.payload);
      const order = ref ? ordersByRef.get(ref) : null;
      const referral = order?.user_id ? referralByUser.get(order.user_id) : null;
      return {
        id: e.id,
        type: e.type,
        received_at: e.received_at,
        verified: true,
        amount_cents: pickAmount(e.payload),
        currency: pickCurrency(e.payload),
        stripe_ref: ref,
        customer_email: pickEmail(e.payload),
        order_id: order?.id ?? null,
        order_status: order?.status ?? null,
        order_payment_status: order?.payment_status ?? null,
        referral_id: referral?.id ?? null,
        referral_status: referral?.status ?? null,
      };
    });
  });

export type WebhookDeliveryRow = {
  id: string;
  received_at: string;
  event_id: string | null;
  event_type: string | null;
  verified: boolean;
  status: string;
  http_status: number;
  outcome: string | null;
  error_message: string | null;
  duration_ms: number | null;
  stripe_ref: string | null;
  matched_order_id: string | null;
  source_ip: string | null;
  signature_present: boolean;
  payload_bytes: number | null;
};

export const adminListWebhookDeliveries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        limit: z.number().int().min(1).max(500).optional(),
        status: z.string().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<WebhookDeliveryRow[]> => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    let q = sb
      .from("stripe_webhook_deliveries")
      .select(
        "id,received_at,event_id,event_type,verified,status,http_status,outcome,error_message,duration_ms,stripe_ref,matched_order_id,source_ip,signature_present,payload_bytes",
      )
      .order("received_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as WebhookDeliveryRow[];
  });
