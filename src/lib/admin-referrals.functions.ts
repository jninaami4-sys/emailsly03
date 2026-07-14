import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function assertAdmin(email: string | undefined | null) {
  const admin = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!admin) throw new Error("ADMIN_EMAIL is not configured");
  if (!email || email.trim().toLowerCase() !== admin) throw new Error("Forbidden: admin only");
}

export type AdminReferralRow = {
  id: string;
  status: string;
  payout_method: string | null;
  reward_referrer_cents: number;
  reward_referred_cents: number;
  currency: string;
  paid_out_at: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
  referrer: { user_id: string; email: string; full_name: string | null; referral_code: string | null } | null;
  referred: { user_id: string; email: string; full_name: string | null } | null;
  order: {
    id: string;
    service_label: string;
    total_cents: number;
    currency: string;
    status: string;
    payment_status: string;
    created_at: string;
  } | null;
};

export const adminListReferrals = createServerFn({ method: "GET" })
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
  .handler(async ({ context, data }): Promise<AdminReferralRow[]> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;

    let q = sb
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: refs, error } = await q;
    if (error) throw new Error(error.message);
    const rows = (refs ?? []) as any[];
    if (rows.length === 0) return [];

    const userIds = Array.from(new Set(rows.flatMap((r) => [r.referrer_id, r.referred_user_id]).filter(Boolean)));
    const orderIds = Array.from(new Set(rows.map((r) => r.order_id).filter(Boolean)));

    const [{ data: profiles }, { data: orders }] = await Promise.all([
      sb.from("profiles").select("user_id,email,full_name,referral_code").in("user_id", userIds),
      orderIds.length
        ? sb
            .from("orders")
            .select("id,service_label,total_cents,currency,status,payment_status,created_at")
            .in("id", orderIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profileMap = new Map<string, any>();
    for (const p of (profiles ?? []) as any[]) profileMap.set(p.user_id, p);
    const orderMap = new Map<string, any>();
    for (const o of (orders ?? []) as any[]) orderMap.set(o.id, o);

    const merged: AdminReferralRow[] = rows.map((r) => ({
      id: r.id,
      status: r.status,
      payout_method: r.payout_method,
      reward_referrer_cents: r.reward_referrer_cents ?? 0,
      reward_referred_cents: r.reward_referred_cents ?? 0,
      currency: r.currency ?? "USD",
      paid_out_at: r.paid_out_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      notes: r.notes,
      referrer: profileMap.get(r.referrer_id) ?? null,
      referred: profileMap.get(r.referred_user_id) ?? null,
      order: r.order_id ? orderMap.get(r.order_id) ?? null : null,
    }));

    const search = data.search?.trim().toLowerCase();
    if (!search) return merged;
    return merged.filter((r) => {
      const hay = [
        r.referrer?.email,
        r.referrer?.full_name,
        r.referrer?.referral_code,
        r.referred?.email,
        r.referred?.full_name,
        r.order?.service_label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(search);
    });
  });

export const adminReferralStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { data, error } = await sb
      .from("referrals")
      .select("status,reward_referrer_cents,reward_referred_cents");
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Array<{
      status: string;
      reward_referrer_cents: number;
      reward_referred_cents: number;
    }>;
    const byStatus: Record<string, number> = {};
    let totalReward = 0;
    let outstanding = 0;
    let paidOut = 0;
    for (const r of rows) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      const both = (r.reward_referrer_cents || 0) + (r.reward_referred_cents || 0);
      totalReward += both;
      if (r.status === "qualified" || r.status === "rewarded") outstanding += both;
      if (r.status === "paid_out") paidOut += both;
    }
    return { total: rows.length, byStatus, totalRewardCents: totalReward, outstandingCents: outstanding, paidOutCents: paidOut };
  });

export const adminUpdateReferralStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "qualified", "rewarded", "paid_out", "cancelled"]),
        payout_method: z.enum(["credit", "cash"]).optional(),
        notes: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const patch: Record<string, unknown> = { status: data.status };
    if (data.payout_method !== undefined) patch.payout_method = data.payout_method;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.status === "paid_out") patch.paid_out_at = new Date().toISOString();
    const { error } = await sb.from("referrals").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
