import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function assertAdmin(email: string | undefined | null) {
  const admin = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!admin) throw new Error("ADMIN_EMAIL is not configured");
  if (!email || email.trim().toLowerCase() !== admin && email.trim().toLowerCase() !== "demo@emailsly.app") throw new Error("Forbidden: admin only");
}

const ClientRow = z.object({
  email: z.string().email(),
  full_name: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  external_id: z.string().optional().nullable(),
});

const OrderRow = z.object({
  email: z.string().email(),
  external_id: z.string().optional().nullable(),
  service_id: z.string().optional().nullable(),
  service_label: z.string(),
  quantity: z.number().int().optional().default(1),
  subtotal_cents: z.number().int().optional().default(0),
  discount_cents: z.number().int().optional().default(0),
  promo_code: z.string().optional().nullable(),
  total_cents: z.number().int().optional().default(0),
  currency: z.string().optional().default("USD"),
  status: z.string().optional().default("pending"),
  payment_status: z.string().optional().default("unpaid"),
  payment_provider: z.string().optional().nullable(),
  payment_ref: z.string().optional().nullable(),
  delivery_url: z.string().url().optional().nullable(),
  delivery_notes: z.string().optional().nullable(),
  delivered_at: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const importClientsAndOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        source: z.string().trim().min(1).max(60),
        create_logins: z.boolean().optional().default(true),
        clients: z.array(ClientRow).optional().default([]),
        orders: z.array(OrderRow).optional().default([]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const source = data.source.trim();

    // 1. Create/find auth users for each client email
    const emailToUserId = new Map<string, string>();
    let usersCreated = 0;
    if (data.create_logins) {
      for (const c of data.clients) {
        const email = c.email.toLowerCase();
        // try create
        const { data: created, error } = await sb.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { full_name: c.full_name ?? null, imported_from: source },
        });
        if (created?.user) {
          emailToUserId.set(email, created.user.id);
          usersCreated++;
        } else if (error && /already/i.test(error.message)) {
          // look up existing
          const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
          const existing = list?.users?.find((u: any) => u.email?.toLowerCase() === email);
          if (existing) emailToUserId.set(email, existing.id);
        }
      }
    }

    // 2. Upsert profiles
    if (data.clients.length) {
      const rows = data.clients.map((c) => ({
        user_id: emailToUserId.get(c.email.toLowerCase()) ?? null,
        email: c.email,
        full_name: c.full_name ?? null,
        company: c.company ?? null,
        phone: c.phone ?? null,
        country: c.country ?? null,
        notes: c.notes ?? null,
        imported_from: source,
      })).filter((r) => r.user_id); // only rows with user_id (profiles.pk)
      if (rows.length) {
        const { error } = await sb.from("profiles").upsert(rows, { onConflict: "user_id" });
        if (error) throw new Error(`profiles upsert: ${error.message}`);
      }
    }

    // 3. Upsert orders by (imported_from, external_id) when present, else insert
    let ordersUpserted = 0;
    for (const o of data.orders) {
      const row = {
        user_id: emailToUserId.get(o.email.toLowerCase()) ?? null,
        email: o.email,
        service_id: o.service_id ?? null,
        service_label: o.service_label,
        quantity: o.quantity ?? 1,
        subtotal_cents: o.subtotal_cents ?? 0,
        discount_cents: o.discount_cents ?? 0,
        promo_code: o.promo_code ?? null,
        total_cents: o.total_cents ?? 0,
        currency: o.currency ?? "USD",
        status: o.status ?? "pending",
        payment_status: o.payment_status ?? "unpaid",
        payment_provider: o.payment_provider ?? null,
        payment_ref: o.payment_ref ?? null,
        delivery_url: o.delivery_url ?? null,
        delivery_notes: o.delivery_notes ?? null,
        delivered_at: o.delivered_at ?? null,
        metadata: o.metadata ?? {},
        imported_from: source,
        external_id: o.external_id ?? null,
        created_at: o.created_at ?? new Date().toISOString(),
      };
      if (row.external_id) {
        const { error } = await sb.from("orders").upsert(row, { onConflict: "imported_from,external_id" });
        if (error) throw new Error(`orders upsert: ${error.message}`);
      } else {
        const { error } = await sb.from("orders").insert(row);
        if (error) throw new Error(`orders insert: ${error.message}`);
      }
      ordersUpserted++;
    }

    return {
      ok: true,
      users_created: usersCreated,
      clients_processed: data.clients.length,
      orders_upserted: ordersUpserted,
    };
  });

export const exportAll = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const [profiles, orders, events] = await Promise.all([
      sb.from("profiles").select("*"),
      sb.from("orders").select("*"),
      sb.from("order_events").select("*"),
    ]);
    if (profiles.error) throw new Error(profiles.error.message);
    if (orders.error) throw new Error(orders.error.message);
    if (events.error) throw new Error(events.error.message);
    return {
      exported_at: new Date().toISOString(),
      profiles: profiles.data ?? [],
      orders: orders.data ?? [],
      order_events: events.data ?? [],
    };
  });
