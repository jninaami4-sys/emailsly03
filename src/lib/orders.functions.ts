import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** List all orders the signed-in client owns (by user_id or by email). */
export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Fetch a single order (RLS enforces ownership). */
export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as any;
    const [{ data: order, error: e1 }, { data: events, error: e2 }] = await Promise.all([
      supabase.from("orders").select("*").eq("id", data.id).maybeSingle(),
      supabase.from("order_events").select("*").eq("order_id", data.id).order("created_at", { ascending: true }),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    return { order, events: events ?? [] };
  });

/** Read the signed-in user's profile (creates a minimal row if missing). */
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const email = (context.claims as { email?: string }).email ?? "";
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data;
    // ensure a row exists
    const { data: created, error: e2 } = await supabase
      .from("profiles")
      .insert({ user_id: context.userId, email })
      .select()
      .single();
    if (e2) throw new Error(e2.message);
    return created;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        full_name: z.string().trim().max(120).optional().nullable(),
        company: z.string().trim().max(160).optional().nullable(),
        phone: z.string().trim().max(40).optional().nullable(),
        country: z.string().trim().max(80).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as any;
    const email = (context.claims as { email?: string }).email ?? "";
    const { error } = await supabase
      .from("profiles")
      .upsert(
        { user_id: context.userId, email, ...data, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Client asks for a revision on a delivered order. */
export const requestRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ order_id: z.string().uuid(), message: z.string().trim().min(3).max(2000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as any;
    const { error: e1 } = await supabase.from("order_events").insert({
      order_id: data.order_id,
      actor_id: context.userId,
      actor_role: "client",
      event_type: "revision_requested",
      message: data.message,
    });
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await supabase.from("order_messages").insert({
      order_id: data.order_id,
      sender_id: context.userId,
      sender_role: "client",
      body: data.message,
    });
    if (e2) throw new Error(e2.message);
    return { ok: true };
  });



/** Record a completed order from the payment-success page (idempotent by payment_ref). */
export const recordMyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    _z
      .object({
        payment_ref: z.string().min(1),
        service_label: z.string().min(1),
        service_id: z.string().optional().nullable(),
        quantity: z.number().int().min(1).default(1),
        subtotal_cents: z.number().int().min(0),
        discount_cents: z.number().int().min(0).default(0),
        promo_code: z.string().optional().nullable(),
        total_cents: z.number().int().min(0),
        currency: z.string().default("USD"),
        payment_provider: z.string().default("stripe"),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const email = (context.claims as { email?: string }).email ?? "";
    // idempotency: payment_ref
    const { data: existing } = await sb
      .from("orders")
      .select("id")
      .eq("payment_ref", data.payment_ref)
      .maybeSingle();
    if (existing) return { ok: true, id: existing.id, duplicate: true };
    const { data: row, error } = await sb
      .from("orders")
      .insert({
        user_id: context.userId,
        email,
        service_id: data.service_id ?? null,
        service_label: data.service_label,
        quantity: data.quantity,
        subtotal_cents: data.subtotal_cents,
        discount_cents: data.discount_cents,
        promo_code: data.promo_code ?? null,
        total_cents: data.total_cents,
        currency: data.currency,
        status: "pending",
        payment_status: "paid",
        payment_provider: data.payment_provider,
        payment_ref: data.payment_ref,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await sb.from("order_events").insert({
      order_id: row.id,
      actor_id: context.userId,
      actor_role: "system",
      event_type: "payment_received",
      message: "Payment received",
    });
    return { ok: true, id: row.id, duplicate: false };
  });
