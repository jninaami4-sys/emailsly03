import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Stripe webhook — the ONLY path that marks an order as paid and lets referral rewards fire.
 *
 * Every inbound POST is recorded in `public.stripe_webhook_deliveries` with the
 * outcome (received / verified / duplicate / processed / unhandled / rejected /
 * error) so admins have an end-to-end audit log even for rejected requests.
 * Successful, verified events are also stored in `public.stripe_events` for
 * idempotency.
 */

function verifyStripeSignature(payload: string, header: string, secret: string, toleranceSec = 300) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header
      .split(",")
      .map((p) => p.trim().split("="))
      .filter((kv) => kv.length === 2)
      .map(([k, v]) => [k, v]),
  ) as Record<string, string>;
  const timestamp = parts.t;
  const sig = parts.v1;
  if (!timestamp || !sig) return false;
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(ageSec) || ageSec > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

type DeliveryLog = {
  event_id: string | null;
  event_type: string | null;
  verified: boolean;
  status: string;
  http_status: number;
  outcome: string | null;
  error_message: string | null;
  duration_ms: number;
  stripe_ref: string | null;
  matched_order_id: string | null;
  source_ip: string | null;
  signature_present: boolean;
  payload_bytes: number;
};

async function logDelivery(sb: any, row: DeliveryLog) {
  try {
    await sb.from("stripe_webhook_deliveries").insert(row);
  } catch {
    // never let logging failures affect the webhook response
  }
}

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const startedAt = Date.now();
        const sourceIp =
          request.headers.get("cf-connecting-ip") ??
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          null;
        const sig = request.headers.get("stripe-signature") ?? "";
        const raw = await request.text();
        const payloadBytes = raw.length;

        const base: DeliveryLog = {
          event_id: null,
          event_type: null,
          verified: false,
          status: "received",
          http_status: 200,
          outcome: null,
          error_message: null,
          duration_ms: 0,
          stripe_ref: null,
          matched_order_id: null,
          source_ip: sourceIp,
          signature_present: Boolean(sig),
          payload_bytes: payloadBytes,
        };

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const sb = supabaseAdmin as any;

        const finish = async (
          status: string,
          httpStatus: number,
          extra: Partial<DeliveryLog> = {},
          body = "ok",
        ) => {
          await logDelivery(sb, {
            ...base,
            ...extra,
            status,
            http_status: httpStatus,
            duration_ms: Date.now() - startedAt,
          });
          return new Response(body, { status: httpStatus });
        };

        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) {
          return finish("error", 500, { error_message: "STRIPE_WEBHOOK_SECRET missing" }, "Server not configured");
        }

        if (!verifyStripeSignature(raw, sig, secret)) {
          return finish(
            "rejected",
            401,
            { error_message: "Invalid or missing stripe-signature" },
            "Invalid signature",
          );
        }
        base.verified = true;

        let event: any;
        try {
          event = JSON.parse(raw);
        } catch {
          return finish("error", 400, { error_message: "Malformed JSON body" }, "Bad JSON");
        }
        if (!event?.id || !event?.type) {
          return finish("error", 400, { error_message: "Missing event id/type" }, "Bad event");
        }
        base.event_id = event.id;
        base.event_type = event.type;
        const stripeRef = event?.data?.object?.id ?? null;
        base.stripe_ref = stripeRef;

        const { error: dupErr } = await sb
          .from("stripe_events")
          .insert({ id: event.id, type: event.type, payload: event });
        if (dupErr && (dupErr as any).code === "23505") {
          return finish("duplicate", 200, { outcome: "Already processed" }, "ok (duplicate)");
        }
        if (dupErr) {
          return finish(
            "error",
            500,
            { error_message: `db error: ${(dupErr as any).message}` },
            `db error: ${(dupErr as any).message}`,
          );
        }

        try {
          let matchedOrderId: string | null = null;
          let outcome = "processed";
          if (event.type === "checkout.session.completed") {
            const s = event.data?.object ?? {};
            if (s.payment_status !== "paid") {
              return finish("verified", 200, { outcome: "Session not paid — ignored" }, "ok (not paid)");
            }
            matchedOrderId = await markOrderPaid(sb, {
              order_id: s.metadata?.order_id ?? s.client_reference_id ?? null,
              stripe_ref: s.id,
              user_id: s.metadata?.user_id ?? null,
              email: s.customer_details?.email ?? s.customer_email ?? null,
              amount_cents: Number.isFinite(s.amount_total) ? s.amount_total : null,
              currency: (s.currency || "usd").toUpperCase(),
            });
            outcome = matchedOrderId ? "Order marked paid" : "No matching order";
          } else if (event.type === "payment_intent.succeeded") {
            const pi = event.data?.object ?? {};
            matchedOrderId = await markOrderPaid(sb, {
              order_id: pi.metadata?.order_id ?? null,
              stripe_ref: pi.id,
              user_id: pi.metadata?.user_id ?? null,
              email: pi.receipt_email ?? null,
              amount_cents: Number.isFinite(pi.amount_received) ? pi.amount_received : pi.amount,
              currency: (pi.currency || "usd").toUpperCase(),
            });
            outcome = matchedOrderId ? "Order marked paid" : "No matching order";
          } else {
            return finish(
              "unhandled",
              200,
              { outcome: `Event type not handled: ${event.type}` },
              "ok (unhandled)",
            );
          }

          return finish(
            "processed",
            200,
            { matched_order_id: matchedOrderId, outcome },
            "ok",
          );
        } catch (e: any) {
          return finish(
            "error",
            500,
            { error_message: `handler error: ${e?.message ?? "unknown"}` },
            `handler error: ${e?.message ?? "unknown"}`,
          );
        }
      },
    },
  },
});

async function markOrderPaid(
  sb: any,
  opts: {
    order_id: string | null;
    stripe_ref: string;
    user_id: string | null;
    email: string | null;
    amount_cents: number | null;
    currency: string;
  },
): Promise<string | null> {
  let orderRow: any = null;
  if (opts.order_id) {
    const { data } = await sb.from("orders").select("*").eq("id", opts.order_id).maybeSingle();
    if (data) orderRow = data;
  }
  if (!orderRow && opts.user_id) {
    const { data } = await sb
      .from("orders")
      .select("*")
      .eq("user_id", opts.user_id)
      .neq("payment_status", "paid")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) orderRow = data;
  }
  if (!orderRow && opts.email) {
    const { data } = await sb
      .from("orders")
      .select("*")
      .ilike("email", opts.email)
      .neq("payment_status", "paid")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) orderRow = data;
  }
  if (!orderRow) return null;
  if (orderRow.payment_status === "paid") return orderRow.id;

  const patch: Record<string, unknown> = {
    payment_status: "paid",
    payment_provider: "stripe",
    payment_ref: opts.stripe_ref,
  };
  if (opts.amount_cents != null) patch.total_cents = opts.amount_cents;
  patch.currency = opts.currency;

  await sb.from("orders").update(patch).eq("id", orderRow.id);
  await sb.from("order_events").insert({
    order_id: orderRow.id,
    actor_role: "system",
    event_type: "payment_received",
    message: `Stripe payment confirmed (${opts.stripe_ref})`,
  });
  return orderRow.id;
}
