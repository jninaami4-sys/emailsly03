import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/require-admin";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


// ---------- Store Offers ----------
export const listStoreOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("store_offers").select("*").order("sort_order").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { offers: data ?? [] };
  });

const offerSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).nullable().optional(),
  cta_label: z.string().max(80).nullable().optional(),
  cta_url: z.string().max(500).nullable().optional(),
  badge: z.string().max(80).nullable().optional(),
  bg_gradient: z.string().max(300).nullable().optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export const upsertStoreOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => offerSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { id, ...payload } = data;
    const row = id
      ? await sb.from("store_offers").update(payload).eq("id", id).select().single()
      : await sb.from("store_offers").insert(payload).select().single();
    if (row.error) throw new Error(row.error.message);
    return { offer: row.data };
  });

export const deleteStoreOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("store_offers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Public read (unauthenticated) — used by /store page. Filters to active + within date window.
export const listActiveStoreOffers = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const sb = createClient(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input: any, init: any) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const now = new Date().toISOString();
  const { data, error } = await (sb as any)
    .from("store_offers")
    .select("id,title,subtitle,cta_label,cta_url,badge,bg_gradient,starts_at,ends_at,sort_order")
    .eq("active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return { offers: data ?? [] };
});

// ---------- Telegram Bots ----------
export const listTelegramBots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("telegram_bots").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { bots: data ?? [] };
  });

const botSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(100),
  bot_token: z.string().min(10).max(300),
  chat_id: z.string().min(1).max(100),
  events: z.array(z.string()).default(["order.new", "ticket.new"]),
  active: z.boolean().optional(),
});

export const upsertTelegramBot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => botSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { id, ...payload } = data;
    const row = id
      ? await sb.from("telegram_bots").update(payload).eq("id", id).select().single()
      : await sb.from("telegram_bots").insert(payload).select().single();
    if (row.error) throw new Error(row.error.message);
    return { bot: row.data };
  });

export const deleteTelegramBot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("telegram_bots").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const testTelegramBot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bot, error } = await (supabaseAdmin as any).from("telegram_bots").select("*").eq("id", data.id).single();
    if (error || !bot) throw new Error(error?.message ?? "Bot not found");
    const res = await fetch(`https://api.telegram.org/bot${bot.bot_token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: bot.chat_id,
        text: `✅ Test message from Emailsly admin — bot "${bot.name}" is connected.`,
      }),
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok && (body as any)?.ok, response: body };
  });

// ---------- Backup / Restore ----------
const BACKUP_TABLES = [
  "site_content",
  "site_settings",
  "pricing_settings",
  "announcements",
  "reviews",
  "product_details",
  "blog_posts",
  "blog_seo_overrides",
  "chatbot_config",
  "chatbot_kb",
  "social_links",
  "sample_datasets",
  "store_offers",
  "telegram_bots",
  "campaigns",
  "referral_settings",
] as const;

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
export type BackupBundle = {
  version: number;
  exported_at: string;
  tables: Record<string, JsonValue[]>;
};

export const exportBackup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const out: Record<string, JsonValue[]> = {};
    for (const t of BACKUP_TABLES) {
      const { data, error } = await sb.from(t).select("*");
      // JSON round-trip strips non-serializable values (Dates, functions, etc.)
      // so the RPC layer can safely serialize the response.
      out[t] = error ? [] : (JSON.parse(JSON.stringify(data ?? [])) as JsonValue[]);
    }
    const bundle: BackupBundle = {
      version: 1,
      exported_at: new Date().toISOString(),
      tables: out,
    };
    return bundle;
  });



export const restoreBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      backup: z.object({
        version: z.number(),
        tables: z.record(z.string(), z.array(z.any())),
      }),
      tables: z.array(z.string()).optional(),
      mode: z.enum(["merge", "replace"]).default("merge"),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const selected = data.tables && data.tables.length ? data.tables : Object.keys(data.backup.tables);
    const results: Record<string, { restored: number; error?: string }> = {};
    for (const t of selected) {
      if (!(BACKUP_TABLES as readonly string[]).includes(t)) {
        results[t] = { restored: 0, error: "table not allowed" };
        continue;
      }
      const rows = data.backup.tables[t] ?? [];
      if (data.mode === "replace") await sb.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (rows.length === 0) {
        results[t] = { restored: 0 };
        continue;
      }
      const { error } = await sb.from(t).upsert(rows, { onConflict: "id" });
      results[t] = { restored: rows.length, error: error?.message };
    }
    return { results };
  });

// ---------- Legacy Order CSV Import ----------
const importRowSchema = z.object({
  email: z.string().email(),
  service_label: z.string().min(1),
  quantity: z.number().int().min(1).optional(),
  total_cents: z.number().int().min(0),
  currency: z.string().default("USD"),
  status: z.string().default("delivered"),
  payment_status: z.string().default("paid"),
  created_at: z.string().optional(),
  notes: z.string().optional(),
});

export const importLegacyOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ rows: z.array(z.record(z.string(), z.any())).min(1).max(5000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const batch_id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`) as string;
    let ok = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const raw of data.rows) {
      try {
        const parsed = importRowSchema.parse({
          ...raw,
          quantity: raw.quantity ? Number(raw.quantity) : undefined,
          total_cents: Math.round(Number(raw.total_cents ?? raw.total ?? 0) * (String(raw.total_cents ?? "").includes(".") ? 100 : 1)),
        });
        const { data: order, error } = await sb.from("orders").insert({
          email: parsed.email,
          service_label: parsed.service_label,
          quantity: parsed.quantity ?? 1,
          total_cents: parsed.total_cents,
          currency: parsed.currency,
          status: parsed.status,
          payment_status: parsed.payment_status,
          created_at: parsed.created_at ?? new Date().toISOString(),
          metadata: { imported: true, notes: parsed.notes ?? null, source: "legacy_csv" },
        }).select("id").single();
        if (error) throw error;
        await sb.from("legacy_order_imports").insert({
          batch_id,
          source_row: raw,
          order_id: order.id,
          status: "imported",
          imported_by: context.userId,
        });
        ok++;
      } catch (e) {
        failed++;
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(msg);
        await sb.from("legacy_order_imports").insert({
          batch_id,
          source_row: raw,
          status: "failed",
          error: msg,
          imported_by: context.userId,
        });
      }
    }
    return { batch_id, imported: ok, failed, errors: errors.slice(0, 20) };
  });

// ---------- Campaigns ----------
export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any).from("campaigns").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { campaigns: data ?? [] };
  });

const campaignSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200),
  audience: z.enum(["all", "paid", "by_service", "by_tag"]).default("all"),
  audience_filter: z.record(z.string(), z.any()).default({}),
  channel: z.enum(["email", "announcement"]).default("email"),
  subject: z.string().max(200).nullable().optional(),
  body: z.string().min(1),
  status: z.enum(["draft", "scheduled", "sending", "sent", "failed"]).default("draft"),
  scheduled_at: z.string().nullable().optional(),
});

export const upsertCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => campaignSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { id, ...payload } = data;
    const row = id
      ? await sb.from("campaigns").update(payload).eq("id", id).select().single()
      : await sb.from("campaigns").insert({ ...payload, created_by: context.userId }).select().single();
    if (row.error) throw new Error(row.error.message);
    return { campaign: row.data };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("campaigns").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const previewCampaignAudience = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      audience: z.enum(["all", "paid", "by_service", "by_tag"]),
      audience_filter: z.record(z.string(), z.any()).default({}),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    if (data.audience === "paid") {
      const { data: rows } = await sb.from("orders").select("email").eq("payment_status", "paid").not("email", "is", null);
      const emails = Array.from(new Set((rows ?? []).map((r: any) => r.email).filter(Boolean)));
      return { count: emails.length, sample: emails.slice(0, 10) };
    }
    if (data.audience === "by_service") {
      const svc = String(data.audience_filter.service_label ?? "");
      const { data: rows } = await sb.from("orders").select("email").ilike("service_label", `%${svc}%`).not("email", "is", null);
      const emails = Array.from(new Set((rows ?? []).map((r: any) => r.email).filter(Boolean)));
      return { count: emails.length, sample: emails.slice(0, 10) };
    }
    // all — profiles table
    const { data: rows, count } = await sb.from("profiles").select("email", { count: "exact" }).not("email", "is", null).limit(10);
    return { count: count ?? 0, sample: (rows ?? []).map((r: any) => r.email) };
  });

export const sendCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { data: c, error } = await sb.from("campaigns").select("*").eq("id", data.id).single();
    if (error || !c) throw new Error(error?.message ?? "Campaign not found");

    let recipients = 0;
    if (c.channel === "announcement") {
      // Create a site announcement from campaign body
      await sb.from("announcements").insert({
        enabled: true,
        title: c.name,
        body: c.body,
        audience: "all",
      });
      recipients = -1; // site-wide
    } else {
      // Email channel — resolve audience emails and record intent.
      // Actual SMTP delivery is handled by the PHP backend / mailer job that
      // scans campaigns with status='sending'. We just flip status and count.
      let emails: string[] = [];
      if (c.audience === "paid") {
        const { data: rows } = await sb.from("orders").select("email").eq("payment_status", "paid").not("email", "is", null);
        emails = Array.from(new Set((rows ?? []).map((r: any) => r.email)));
      } else if (c.audience === "by_service") {
        const svc = String(c.audience_filter?.service_label ?? "");
        const { data: rows } = await sb.from("orders").select("email").ilike("service_label", `%${svc}%`).not("email", "is", null);
        emails = Array.from(new Set((rows ?? []).map((r: any) => r.email)));
      } else {
        const { data: rows } = await sb.from("profiles").select("email").not("email", "is", null);
        emails = Array.from(new Set((rows ?? []).map((r: any) => r.email)));
      }
      recipients = emails.length;
    }

    await sb.from("campaigns").update({
      status: c.channel === "announcement" ? "sent" : "sending",
      recipient_count: recipients < 0 ? 0 : recipients,
      sent_at: new Date().toISOString(),
    }).eq("id", c.id);

    return { ok: true, recipients };
  });
