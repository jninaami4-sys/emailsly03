import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/require-admin";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


export type AdminReferralOrder = {
  id: string;
  service_label: string;
  total_cents: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_ref: string | null;
  payment_provider: string | null;
  created_at: string;
};

export type AdminReferralRow = {
  id: string;
  status: string;
  admin_review_state: string;
  flag_reasons: string[];
  payout_method: string | null;
  reward_referrer_cents: number;
  reward_referred_cents: number;
  currency: string;
  paid_out_at: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
  signup_ip: string | null;
  referrer: { user_id: string; email: string; full_name: string | null; referral_code: string | null } | null;
  referred: { user_id: string; email: string; full_name: string | null } | null;
  order: AdminReferralOrder | null;
};

export const adminListReferrals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        status: z.string().optional(),
        review_state: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<AdminReferralRow[]> => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;

    let q = sb
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.review_state && data.review_state !== "all") q = q.eq("admin_review_state", data.review_state);
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
            .select("id,service_label,total_cents,currency,status,payment_status,payment_ref,payment_provider,created_at")
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
      admin_review_state: r.admin_review_state ?? "auto",
      flag_reasons: (r.flag_reasons ?? []) as string[],
      payout_method: r.payout_method,
      reward_referrer_cents: r.reward_referrer_cents ?? 0,
      reward_referred_cents: r.reward_referred_cents ?? 0,
      currency: r.currency ?? "USD",
      paid_out_at: r.paid_out_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      notes: r.notes,
      signup_ip: r.signup_ip ? String(r.signup_ip) : null,
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
        r.order?.payment_ref,
        ...r.flag_reasons,
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
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { data, error } = await sb
      .from("referrals")
      .select("status,admin_review_state,reward_referrer_cents,reward_referred_cents");
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Array<{
      status: string;
      admin_review_state: string | null;
      reward_referrer_cents: number;
      reward_referred_cents: number;
    }>;
    const byStatus: Record<string, number> = {};
    const byReview: Record<string, number> = {};
    let totalReward = 0;
    let outstanding = 0;
    let paidOut = 0;
    for (const r of rows) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      const rev = r.admin_review_state ?? "auto";
      byReview[rev] = (byReview[rev] ?? 0) + 1;
      const both = (r.reward_referrer_cents || 0) + (r.reward_referred_cents || 0);
      totalReward += both;
      if (r.status === "qualified" || r.status === "rewarded") outstanding += both;
      if (r.status === "paid_out") paidOut += both;
    }
    return { total: rows.length, byStatus, byReview, totalRewardCents: totalReward, outstandingCents: outstanding, paidOutCents: paidOut };
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
    await requireAdmin(context);
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

/** Approve a flagged referral — trigger will issue credits if none exist yet. */
export const adminApproveReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), notes: z.string().max(2000).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const patch: Record<string, unknown> = { admin_review_state: "approved" };
    if (data.notes) patch.notes = data.notes;
    const { error } = await sb.from("referrals").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Reject a flagged referral — trigger claws back any already-issued credits. */
export const adminRejectReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), notes: z.string().max(2000).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const patch: Record<string, unknown> = { admin_review_state: "rejected", status: "cancelled" };
    if (data.notes) patch.notes = data.notes;
    const { error } = await sb.from("referrals").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Full chain for one referrer — all referred users, their paid orders, credits earned & redeemed. */
export type ReferrerChain = {
  referrer: { user_id: string; email: string; full_name: string | null; referral_code: string | null };
  referrals: Array<{
    referral_id: string;
    status: string;
    admin_review_state: string;
    flag_reasons: string[];
    referred: { user_id: string; email: string; full_name: string | null } | null;
    orders: Array<{
      id: string;
      service_label: string;
      total_cents: number;
      currency: string;
      payment_status: string;
      payment_ref: string | null;
      payment_provider: string | null;
      created_at: string;
    }>;
    credits_earned_cents: number;
    credits_redeemed_cents: number;
  }>;
};

export const adminReferrerChain = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ referrer_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<ReferrerChain> => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;

    const [{ data: referrerProfile }, { data: refs }] = await Promise.all([
      sb.from("profiles").select("user_id,email,full_name,referral_code").eq("user_id", data.referrer_id).maybeSingle(),
      sb
        .from("referrals")
        .select("id,status,admin_review_state,flag_reasons,referred_user_id,created_at")
        .eq("referrer_id", data.referrer_id)
        .order("created_at", { ascending: false }),
    ]);

    const referralRows = (refs ?? []) as any[];
    const referredIds = referralRows.map((r) => r.referred_user_id).filter(Boolean);
    if (referredIds.length === 0) {
      return {
        referrer: referrerProfile ?? { user_id: data.referrer_id, email: "", full_name: null, referral_code: null },
        referrals: [],
      };
    }
    const [{ data: profs }, { data: orders }, { data: earnedCredits }, { data: redeemedCredits }] = await Promise.all([
      sb.from("profiles").select("user_id,email,full_name").in("user_id", referredIds),
      sb
        .from("orders")
        .select("id,user_id,service_label,total_cents,currency,payment_status,payment_ref,payment_provider,created_at")
        .in("user_id", referredIds)
        .order("created_at", { ascending: false }),
      sb
        .from("referral_credits")
        .select("delta_cents,referral_id")
        .eq("source", "referral_earned_referrer")
        .eq("user_id", data.referrer_id),
      sb
        .from("referral_credits")
        .select("delta_cents,referral_id")
        .eq("source", "referral_redeemed")
        .in("user_id", referredIds),
    ]);

    const profileMap = new Map<string, any>();
    for (const p of (profs ?? []) as any[]) profileMap.set(p.user_id, p);
    const ordersByUser = new Map<string, any[]>();
    for (const o of (orders ?? []) as any[]) {
      if (!ordersByUser.has(o.user_id)) ordersByUser.set(o.user_id, []);
      ordersByUser.get(o.user_id)!.push(o);
    }
    const earnedByRef = new Map<string, number>();
    for (const c of (earnedCredits ?? []) as any[]) {
      if (!c.referral_id) continue;
      earnedByRef.set(c.referral_id, (earnedByRef.get(c.referral_id) ?? 0) + (c.delta_cents ?? 0));
    }
    const redeemedByRef = new Map<string, number>();
    for (const c of (redeemedCredits ?? []) as any[]) {
      if (!c.referral_id) continue;
      redeemedByRef.set(c.referral_id, (redeemedByRef.get(c.referral_id) ?? 0) + Math.abs(c.delta_cents ?? 0));
    }

    return {
      referrer: referrerProfile ?? { user_id: data.referrer_id, email: "", full_name: null, referral_code: null },
      referrals: referralRows.map((r) => ({
        referral_id: r.id,
        status: r.status,
        admin_review_state: r.admin_review_state ?? "auto",
        flag_reasons: (r.flag_reasons ?? []) as string[],
        referred: profileMap.get(r.referred_user_id) ?? null,
        orders: ordersByUser.get(r.referred_user_id) ?? [],
        credits_earned_cents: earnedByRef.get(r.id) ?? 0,
        credits_redeemed_cents: redeemedByRef.get(r.id) ?? 0,
      })),
    };
  });

/** Attribution funnel: clicks → signups → paid conversions → credits issued/redeemed. */
export const adminReferralFunnel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ days: z.number().int().min(1).max(365).default(30) }).parse(d ?? { days: 30 }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const since = new Date(Date.now() - data.days * 864e5).toISOString();

    const [{ count: clicks }, { data: sig }, { data: qual }, { data: credits }] = await Promise.all([
      sb.from("referral_clicks").select("id", { count: "exact", head: true }).gte("created_at", since),
      sb.from("referrals").select("id").gte("created_at", since),
      sb.from("referrals").select("id,status").gte("created_at", since).in("status", ["qualified", "rewarded", "paid_out"]),
      sb.from("referral_credits").select("delta_cents,source").gte("created_at", since),
    ]);
    let issued = 0;
    let redeemed = 0;
    let outstanding = 0;
    for (const c of (credits ?? []) as any[]) {
      const d = c.delta_cents ?? 0;
      if (c.source === "referral_earned_referrer" || c.source === "referral_earned_referred") issued += d;
      else if (c.source === "referral_redeemed") redeemed += Math.abs(d);
    }
    outstanding = Math.max(0, issued - redeemed);
    return {
      window_days: data.days,
      clicks: clicks ?? 0,
      signups: (sig ?? []).length,
      paid_conversions: (qual ?? []).length,
      credits_issued_cents: issued,
      credits_redeemed_cents: redeemed,
      credits_outstanding_cents: outstanding,
    };
  });

/** Top referrers leaderboard by paid conversions and credits earned. */
export const adminReferralLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ limit: z.number().int().min(1).max(50).default(10) }).parse(d ?? { limit: 10 }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { data: credits } = await sb
      .from("referral_credits")
      .select("user_id,delta_cents")
      .eq("source", "referral_earned_referrer");
    const byUser = new Map<string, { earned: number }>();
    for (const c of (credits ?? []) as any[]) {
      const u = c.user_id as string;
      const b = byUser.get(u) ?? { earned: 0 };
      b.earned += c.delta_cents ?? 0;
      byUser.set(u, b);
    }
    const { data: refs } = await sb
      .from("referrals")
      .select("referrer_id,status");
    const conversionsByUser = new Map<string, number>();
    for (const r of (refs ?? []) as any[]) {
      if (["qualified", "rewarded", "paid_out"].includes(r.status)) {
        conversionsByUser.set(r.referrer_id, (conversionsByUser.get(r.referrer_id) ?? 0) + 1);
      }
    }
    const userIds = Array.from(new Set([...byUser.keys(), ...conversionsByUser.keys()]));
    if (userIds.length === 0) return [] as Array<{ user_id: string; email: string; full_name: string | null; referral_code: string | null; conversions: number; earned_cents: number }>;
    const { data: profs } = await sb
      .from("profiles")
      .select("user_id,email,full_name,referral_code")
      .in("user_id", userIds);
    const profMap = new Map<string, any>();
    for (const p of (profs ?? []) as any[]) profMap.set(p.user_id, p);
    const rows = userIds.map((u) => ({
      user_id: u,
      email: profMap.get(u)?.email ?? "",
      full_name: profMap.get(u)?.full_name ?? null,
      referral_code: profMap.get(u)?.referral_code ?? null,
      conversions: conversionsByUser.get(u) ?? 0,
      earned_cents: byUser.get(u)?.earned ?? 0,
    }));
    rows.sort((a, b) => b.earned_cents - a.earned_cents || b.conversions - a.conversions);
    return rows.slice(0, data.limit);
  });

/** Mark a set of credits as paid out (creates a payout batch). */
export const adminMarkCreditsPaidOut = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        user_ids: z.array(z.string().uuid()).min(1).max(500),
        notes: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    // Pull unpaid, positive earned credits for these users
    const { data: credits, error } = await sb
      .from("referral_credits")
      .select("id,user_id,delta_cents,currency")
      .in("user_id", data.user_ids)
      .in("source", ["referral_earned_referrer", "referral_earned_referred"])
      .is("paid_out_at", null);
    if (error) throw new Error(error.message);
    const rows = (credits ?? []) as any[];
    if (rows.length === 0) return { ok: true, batch_id: null, count: 0, total_cents: 0 };
    const totalCents = rows.reduce((s, r) => s + (r.delta_cents ?? 0), 0);
    const currency = rows[0].currency ?? "USD";
    const { data: batch, error: bErr } = await sb
      .from("referral_payout_batches")
      .insert({ created_by: context.userId, total_cents: totalCents, currency, notes: data.notes ?? null })
      .select("id")
      .single();
    if (bErr) throw new Error(bErr.message);
    const now = new Date().toISOString();
    const { error: uErr } = await sb
      .from("referral_credits")
      .update({ payout_batch_id: batch.id, paid_out_at: now })
      .in(
        "id",
        rows.map((r) => r.id),
      );
    if (uErr) throw new Error(uErr.message);
    return { ok: true, batch_id: batch.id, count: rows.length, total_cents: totalCents };
  });

/** CSV of amounts owed per referrer (net earned - redeemed - already paid out). */
export const adminExportOwedCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { data: credits, error } = await sb
      .from("referral_credits")
      .select("user_id,delta_cents,source,paid_out_at,currency");
    if (error) throw new Error(error.message);
    const byUser = new Map<string, { earned: number; redeemed: number; paidOut: number; currency: string }>();
    for (const c of (credits ?? []) as any[]) {
      const u = c.user_id as string;
      const b = byUser.get(u) ?? { earned: 0, redeemed: 0, paidOut: 0, currency: c.currency ?? "USD" };
      const d = c.delta_cents ?? 0;
      if (c.source === "referral_earned_referrer" || c.source === "referral_earned_referred") {
        b.earned += d;
        if (c.paid_out_at) b.paidOut += d;
      } else if (c.source === "referral_redeemed") {
        b.redeemed += Math.abs(d);
      }
      byUser.set(u, b);
    }
    const owedUserIds = Array.from(byUser.entries())
      .filter(([, b]) => b.earned - b.redeemed - b.paidOut > 0)
      .map(([u]) => u);
    if (owedUserIds.length === 0) {
      return { csv: "user_id,email,full_name,earned_cents,redeemed_cents,paid_out_cents,owed_cents,currency\n", count: 0 };
    }
    const { data: profs } = await sb
      .from("profiles")
      .select("user_id,email,full_name")
      .in("user_id", owedUserIds);
    const profMap = new Map<string, any>();
    for (const p of (profs ?? []) as any[]) profMap.set(p.user_id, p);
    const lines = ["user_id,email,full_name,earned_cents,redeemed_cents,paid_out_cents,owed_cents,currency"];
    for (const u of owedUserIds) {
      const b = byUser.get(u)!;
      const p = profMap.get(u) ?? {};
      const owed = b.earned - b.redeemed - b.paidOut;
      lines.push(
        [
          u,
          esc(p.email ?? ""),
          esc(p.full_name ?? ""),
          b.earned,
          b.redeemed,
          b.paidOut,
          owed,
          b.currency,
        ].join(","),
      );
    }
    return { csv: lines.join("\n") + "\n", count: owedUserIds.length };
  });

function esc(v: string) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
