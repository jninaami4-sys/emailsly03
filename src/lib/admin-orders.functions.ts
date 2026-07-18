import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/require-admin";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(500).optional(),
        view: z.enum(["active", "archived"]).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    let q = sb.from("orders").select("*").order("created_at", { ascending: false }).limit(data.limit ?? 200);
    if (data.view === "archived") q = q.not("archived_at", "is", null);
    else q = q.is("archived_at", null);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.search) q = q.or(`email.ilike.%${data.search}%,service_label.ilike.%${data.search}%,promo_code.ilike.%${data.search}%`);
    if (data.dateFrom) q = q.gte("created_at", new Date(data.dateFrom).toISOString());
    if (data.dateTo) {
      const to = new Date(data.dateTo);
      to.setHours(23, 59, 59, 999);
      q = q.lte("created_at", to.toISOString());
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const list = (rows ?? []) as Array<Record<string, unknown> & { id: string; user_id: string | null }>;
    // Enrich with profile display name where available so the admin table can
    // show the customer's name (not just their email) and a stable short ID.
    const userIds = Array.from(new Set(list.map((r) => r.user_id).filter(Boolean))) as string[];
    const nameByUser = new Map<string, string>();
    if (userIds.length) {
      const { data: profs } = await sb
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      for (const p of profs ?? []) {
        if (p.full_name) nameByUser.set(p.user_id as string, p.full_name as string);
      }
    }
    return list.map((r) => ({
      ...r,
      short_id: `ORD-${String(r.id).slice(0, 8).toUpperCase()}`,
      customer_name: r.user_id ? nameByUser.get(r.user_id) ?? null : null,
    }));
  });

export const adminOrderStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { data: rows, error } = await sb
      .from("orders")
      .select("total_cents,status,payment_status,created_at,currency");
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as Array<{
      total_cents: number;
      status: string;
      payment_status: string;
      created_at: string;
    }>;
    const paid = list.filter((r) => r.payment_status === "paid");
    const monthAgo = Date.now() - 30 * 864e5;
    const revenue = paid.reduce((s, r) => s + (r.total_cents || 0), 0);
    const revenueMonth = paid
      .filter((r) => new Date(r.created_at).getTime() >= monthAgo)
      .reduce((s, r) => s + (r.total_cents || 0), 0);
    const refunded = list
      .filter((r) => r.payment_status === "refunded" || r.status === "refunded")
      .reduce((s, r) => s + (r.total_cents || 0), 0);
    const byStatus: Record<string, number> = {};
    for (const r of list) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    const avg = paid.length ? Math.round(revenue / paid.length) : 0;
    return {
      total_orders: list.length,
      paid_count: paid.length,
      revenue_cents: revenue,
      revenue_month_cents: revenueMonth,
      refunded_cents: refunded,
      avg_order_cents: avg,
      by_status: byStatus,
    };
  });

export const adminDeliverOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        delivery_url: z.string().url(),
        delivery_notes: z.string().max(2000).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { error } = await sb
      .from("orders")
      .update({
        status: "delivered",
        delivery_url: data.delivery_url,
        delivery_notes: data.delivery_notes ?? null,
        delivered_at: new Date().toISOString(),
        delivered_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await sb.from("order_events").insert({
      order_id: data.id,
      actor_id: context.userId,
      actor_role: "admin",
      event_type: "delivered",
      message: data.delivery_notes ?? "Order delivered",
      metadata: { delivery_url: data.delivery_url },
    });
    return { ok: true };
  });

export const adminCancelOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        reason: z.string().trim().min(1).max(1000),
        refund: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const patch: Record<string, unknown> = {
      status: data.refund ? "refunded" : "cancelled",
      cancel_reason: data.reason,
      cancelled_at: new Date().toISOString(),
    };
    if (data.refund) patch.payment_status = "refunded";
    const { error } = await sb.from("orders").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await sb.from("order_events").insert({
      order_id: data.id,
      actor_id: context.userId,
      actor_role: "admin",
      event_type: data.refund ? "refunded" : "cancelled",
      message: data.reason,
    });
    return { ok: true };
  });

export const adminSetStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "in_progress", "delivered", "cancelled", "refunded", "revision_requested"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { error } = await sb.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await sb.from("order_events").insert({
      order_id: data.id,
      actor_id: context.userId,
      actor_role: "admin",
      event_type: "status_changed",
      message: `Status set to ${data.status}`,
    });
    return { ok: true };
  });

export const adminSendMagicLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { error } = await sb.auth.admin.generateLink({
      type: "magiclink",
      email: data.email,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const orderInputSchema = z.object({
  email: z.string().email(),
  service_label: z.string().trim().min(1).max(200),
  service_id: z.string().trim().max(80).optional().nullable(),
  quantity: z.number().int().min(1).default(1),
  subtotal_cents: z.number().int().min(0),
  discount_cents: z.number().int().min(0).default(0),
  total_cents: z.number().int().min(0),
  currency: z.string().trim().min(3).max(6).default("USD"),
  promo_code: z.string().trim().max(60).optional().nullable(),
  status: z
    .enum(["pending", "in_progress", "delivered", "cancelled", "refunded", "revision_requested"])
    .default("pending"),
  payment_status: z.enum(["unpaid", "paid", "refunded", "failed", "pending"]).default("paid"),
  payment_provider: z.string().trim().max(40).optional().nullable(),
  payment_ref: z.string().trim().max(200).optional().nullable(),
  delivery_url: z.string().url().optional().nullable().or(z.literal("")),
  delivery_notes: z.string().max(2000).optional().nullable(),
  created_at: z.string().datetime().optional(),
  imported_from: z.string().trim().max(40).optional().nullable(),
  external_id: z.string().trim().max(120).optional().nullable(),
});

export const adminCreateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => orderInputSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    // Try to link to an existing user by email
    let userId: string | null = null;
    const { data: prof } = await sb
      .from("profiles")
      .select("user_id")
      .ilike("email", data.email)
      .maybeSingle();
    if (prof?.user_id) userId = prof.user_id;

    const insert: Record<string, unknown> = {
      user_id: userId,
      email: data.email,
      service_id: data.service_id ?? null,
      service_label: data.service_label,
      quantity: data.quantity,
      subtotal_cents: data.subtotal_cents,
      discount_cents: data.discount_cents,
      total_cents: data.total_cents,
      currency: data.currency,
      promo_code: data.promo_code ?? null,
      status: data.status,
      payment_status: data.payment_status,
      payment_provider: data.payment_provider ?? "manual",
      payment_ref: data.payment_ref ?? null,
      delivery_url: data.delivery_url || null,
      delivery_notes: data.delivery_notes ?? null,
      imported_from: data.imported_from ?? "admin_manual",
      external_id: data.external_id ?? null,
    };
    if (data.created_at) {
      insert.created_at = data.created_at;
      insert.updated_at = data.created_at;
    }
    if (data.status === "delivered") {
      insert.delivered_at = data.created_at ?? new Date().toISOString();
      insert.delivered_by = context.userId;
    }

    const { data: row, error } = await sb.from("orders").insert(insert).select("id").single();
    if (error) throw new Error(error.message);

    await sb.from("order_events").insert({
      order_id: row.id,
      actor_id: context.userId,
      actor_role: "admin",
      event_type: "created",
      message: "Order created by admin",
      metadata: { backdated: !!data.created_at },
    });
    return { ok: true, id: row.id };
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        patch: orderInputSchema.partial(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const patch: Record<string, unknown> = { ...data.patch };
    if (patch.delivery_url === "") patch.delivery_url = null;
    const { error } = await sb.from("orders").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await sb.from("order_events").insert({
      order_id: data.id,
      actor_id: context.userId,
      actor_role: "admin",
      event_type: "edited",
      message: "Order edited by admin",
      metadata: { fields: Object.keys(data.patch) },
    });
    return { ok: true };
  });

export const adminDeleteOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { error } = await sb.from("orders").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const idsSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(500) });

export const adminArchiveOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idsSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const now = new Date().toISOString();
    const { error } = await sb
      .from("orders")
      .update({ archived_at: now, archived_by: context.userId })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    const events = data.ids.map((id) => ({
      order_id: id,
      actor_id: context.userId,
      actor_role: "admin",
      event_type: "archived",
      message: "Order archived",
    }));
    await sb.from("order_events").insert(events);
    return { ok: true, count: data.ids.length };
  });

export const adminRestoreOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idsSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { error } = await sb
      .from("orders")
      .update({ archived_at: null, archived_by: null })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    const events = data.ids.map((id) => ({
      order_id: id,
      actor_id: context.userId,
      actor_role: "admin",
      event_type: "restored",
      message: "Order restored from archive",
    }));
    await sb.from("order_events").insert(events);
    return { ok: true, count: data.ids.length };
  });

export const adminDeleteOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idsSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { error } = await sb.from("orders").delete().in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.ids.length };
  });

