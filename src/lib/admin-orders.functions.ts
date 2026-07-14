import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function assertAdmin(email: string | undefined | null) {
  const admin = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!admin) throw new Error("ADMIN_EMAIL is not configured");
  if (!email || email.trim().toLowerCase() !== admin) throw new Error("Forbidden: admin only");
}

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    let q = sb.from("orders").select("*").order("created_at", { ascending: false }).limit(data.limit ?? 200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.search) q = q.or(`email.ilike.%${data.search}%,service_label.ilike.%${data.search}%,promo_code.ilike.%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminOrderStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertAdmin((context.claims as { email?: string }).email);
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
    assertAdmin((context.claims as { email?: string }).email);
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
    assertAdmin((context.claims as { email?: string }).email);
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
    assertAdmin((context.claims as { email?: string }).email);
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
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { error } = await sb.auth.admin.generateLink({
      type: "magiclink",
      email: data.email,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
