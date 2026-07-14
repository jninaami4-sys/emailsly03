import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Stripe webhook — the ONLY path that marks an order as paid and lets referral rewards fire.
 *
 * Expects events from a Stripe endpoint configured with your STRIPE_WEBHOOK_SECRET (added via add_secret).
 * Verifies the stripe-signature header (HMAC-SHA256 of `${timestamp}.${payload}`).
 * Handles `checkout.session.completed` and `payment_intent.succeeded`.
 *
 * The order to update is identified by (in order):
 *   - metadata.order_id
 *   - client_reference_id  (recommended: set to your app order id when creating the checkout session)
 *
 * On success:
 *   - stores Stripe session/PI id in orders.payment_ref
 *   - sets payment_status='paid' and payment_provider='stripe'
 *   - the orders_qualify_referral trigger takes it from there
 *
 * Idempotent by Stripe event.id via public.stripe_events.
 */

// Verify Stripe's signature scheme: t=<ts>,v1=<sig>,v0=... — v1 is HMAC-SHA256(secret, `${ts}.${payload}`)
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

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) return new Response("Server not configured", { status: 500 });

        const sig = request.headers.get("stripe-signature") ?? "";
        const raw = await request.text();
        if (!verifyStripeSignature(raw, sig, secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: any;
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }
        if (!event?.id || !event?.type) return new Response("Bad event", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const sb = supabaseAdmin as any;

        // Idempotency: insert; on conflict, we've already handled this event.
        const { error: dupErr } = await sb
          .from("stripe_events")
          .insert({ id: event.id, type: event.type, payload: event });
        if (dupErr && (dupErr as any).code === "23505") {
          return new Response("ok (duplicate)", { status: 200 });
        }
        if (dupErr) {
          return new Response(`db error: ${dupErr.message}`, { status: 500 });
        }

        try {
          if (event.type === "checkout.session.completed") {
            const s = event.data?.object ?? {};
            if (s.payment_status !== "paid") {
              return new Response("ok (not paid)", { status: 200 });
            }
            await markOrderPaid(sb, {
              order_id: s.metadata?.order_id ?? s.client_reference_id ?? null,
              stripe_ref: s.id, // cs_...
              user_id: s.metadata?.user_id ?? null,
              email: s.customer_details?.email ?? s.customer_email ?? null,
              amount_cents: Number.isFinite(s.amount_total) ? s.amount_total : null,
              currency: (s.currency || "usd").toUpperCase(),
            });
          } else if (event.type === "payment_intent.succeeded") {
            const pi = event.data?.object ?? {};
            await markOrderPaid(sb, {
              order_id: pi.metadata?.order_id ?? null,
              stripe_ref: pi.id, // pi_...
              user_id: pi.metadata?.user_id ?? null,
              email: pi.receipt_email ?? null,
              amount_cents: Number.isFinite(pi.amount_received) ? pi.amount_received : pi.amount,
              currency: (pi.currency || "usd").toUpperCase(),
            });
          } else {
            // Acknowledge unhandled event types so Stripe stops retrying.
            return new Response("ok (unhandled)", { status: 200 });
          }
        } catch (e: any) {
          return new Response(`handler error: ${e?.message ?? "unknown"}`, { status: 500 });
        }

        return new Response("ok", { status: 200 });
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
) {
  // 1) Locate order: by id -> by (user_id, unpaid) latest -> by email
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
  if (!orderRow) return; // nothing to do — no matching order

  if (orderRow.payment_status === "paid") return;

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
}
