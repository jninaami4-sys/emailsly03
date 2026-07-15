import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ---------- shared ---------- */

const CATEGORIES = ["payment", "delivery", "quality", "refund", "account", "other"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const STATUSES = ["open", "in_progress", "waiting_customer", "resolved", "closed"] as const;

export type SupportTicketStatus = (typeof STATUSES)[number];
export type SupportTicketCategory = (typeof CATEGORIES)[number];
export type SupportTicketPriority = (typeof PRIORITIES)[number];

async function isAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return !!data;
}

/* ---------- customer-facing ---------- */

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        order_id: z.string().uuid().optional().nullable(),
        subject: z.string().trim().min(3).max(200),
        category: z.enum(CATEGORIES).default("other"),
        priority: z.enum(PRIORITIES).default("normal"),
        message: z.string().trim().min(5).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as any;
    const email = (context.claims as { email?: string }).email ?? "";

    // If order_id supplied, verify it belongs to caller (RLS also enforces this)
    if (data.order_id) {
      const { data: ord, error: e0 } = await supabase
        .from("orders")
        .select("id")
        .eq("id", data.order_id)
        .maybeSingle();
      if (e0) throw new Error(e0.message);
      if (!ord) throw new Error("Order not found");
    }

    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: context.userId,
        email,
        order_id: data.order_id ?? null,
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        status: "open",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    const { error: mErr } = await supabase.from("support_ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: context.userId,
      sender_role: "customer",
      body: data.message,
    });
    if (mErr) throw new Error(mErr.message);

    return { ok: true, id: ticket.id };
  });

export const listMySupportTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", context.userId)
      .order("last_message_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMySupportTicket = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as any;
    const [{ data: ticket, error: e1 }, { data: messages, error: e2 }] = await Promise.all([
      supabase.from("support_tickets").select("*").eq("id", data.id).maybeSingle(),
      supabase
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", data.id)
        .order("created_at", { ascending: true }),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    if (!ticket) throw new Error("Ticket not found");
    return { ticket, messages: messages ?? [] };
  });

export const replySupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ ticket_id: z.string().uuid(), body: z.string().trim().min(1).max(4000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as any;

    const { data: ticket, error: tErr } = await supabase
      .from("support_tickets")
      .select("id, user_id")
      .eq("id", data.ticket_id)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!ticket) throw new Error("Ticket not found");

    const admin = await isAdmin(supabase, context.userId);
    const role: "admin" | "customer" =
      admin && ticket.user_id !== context.userId ? "admin" : admin ? "admin" : "customer";

    const { error } = await supabase.from("support_ticket_messages").insert({
      ticket_id: data.ticket_id,
      sender_id: context.userId,
      sender_role: role,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const closeMySupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    // Only admins can UPDATE per RLS, so route close through admin client after ownership check.
    const supabase = context.supabase as any;
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!ticket || ticket.user_id !== context.userId) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("support_tickets")
      .update({ status: "closed" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    // system note
    await (supabaseAdmin as any).from("support_ticket_messages").insert({
      ticket_id: data.id,
      sender_id: context.userId,
      sender_role: "system",
      body: "Ticket closed by customer.",
    });
    return { ok: true };
  });

/* ---------- admin ---------- */

export const adminListSupportTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        status: z.enum([...STATUSES, "all"] as [string, ...string[]]).optional(),
        search: z.string().trim().max(200).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as any;
    if (!(await isAdmin(supabase, context.userId))) throw new Error("Forbidden: admin only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    let q = sb
      .from("support_tickets")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(300);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.search) q = q.or(`email.ilike.%${data.search}%,subject.ilike.%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminGetSupportTicket = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as any;
    if (!(await isAdmin(supabase, context.userId))) throw new Error("Forbidden: admin only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const [{ data: ticket, error: e1 }, { data: messages, error: e2 }] = await Promise.all([
      sb.from("support_tickets").select("*").eq("id", data.id).maybeSingle(),
      sb
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", data.id)
        .order("created_at", { ascending: true }),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    if (!ticket) throw new Error("Ticket not found");
    return { ticket, messages: messages ?? [] };
  });

export const adminUpdateSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(STATUSES).optional(),
        priority: z.enum(PRIORITIES).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as any;
    if (!(await isAdmin(supabase, context.userId))) throw new Error("Forbidden: admin only");
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.priority) patch.priority = data.priority;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("support_tickets")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReplySupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        ticket_id: z.string().uuid(),
        body: z.string().trim().min(1).max(4000),
        status: z.enum(STATUSES).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as any;
    if (!(await isAdmin(supabase, context.userId))) throw new Error("Forbidden: admin only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { error } = await sb.from("support_ticket_messages").insert({
      ticket_id: data.ticket_id,
      sender_id: context.userId,
      sender_role: "admin",
      body: data.body,
    });
    if (error) throw new Error(error.message);
    if (data.status) {
      await sb.from("support_tickets").update({ status: data.status }).eq("id", data.ticket_id);
    }
    return { ok: true };
  });
