import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logReferral, classifyReferralError } from "@/lib/referral-log.server";

export type ReferralSummary = {
  referral_code: string | null;
  balance_cents: number;
  currency: string;
  totals: {
    earned_cents: number;
    redeemed_cents: number;
    pending_cents: number;
  };
  ledger: Array<{
    id: string;
    delta_cents: number;
    source: string;
    notes: string | null;
    created_at: string;
    order_id: string | null;
  }>;
  referrals: Array<{
    id: string;
    status: string;
    referred_email: string | null;
    reward_referrer_cents: number;
    created_at: string;
  }>;
};

export const getMyReferralSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReferralSummary> => {
    const sb = context.supabase as any;

    const started = Date.now();
    logReferral({ event: "referral.summary.fetch", status: "start", user_id: context.userId });

    const [profileRes, ledgerRes, refsRes, balRes] = await Promise.all([
      sb.from("profiles").select("referral_code").eq("user_id", context.userId).maybeSingle(),
      sb
        .from("referral_credits")
        .select("id,delta_cents,source,notes,created_at,order_id")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(50),
      sb
        .from("referrals")
        .select("id,status,referred_user_id,reward_referrer_cents,created_at")
        .eq("referrer_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(50),
      sb.rpc("get_referral_balance", { _user_id: context.userId }),
    ]);

    // Surface per-query errors — a silent RLS/GRANT denial otherwise reads as "empty".
    const partErrors: Array<{ part: string; err: unknown }> = [];
    if (profileRes.error) partErrors.push({ part: "profiles", err: profileRes.error });
    if (ledgerRes.error) partErrors.push({ part: "referral_credits", err: ledgerRes.error });
    if (refsRes.error) partErrors.push({ part: "referrals", err: refsRes.error });
    if ((balRes as any).error) partErrors.push({ part: "rpc:get_referral_balance", err: (balRes as any).error });
    for (const { part, err } of partErrors) {
      const c = classifyReferralError(err);
      logReferral({
        event: "referral.summary.fetch",
        status: "error",
        user_id: context.userId,
        part,
        error_code: c.code,
        error_message: c.message,
        rls_hint: c.rls_hint,
      });
    }

    const profile = profileRes.data;
    const ledger = ledgerRes.data;
    const refs = refsRes.data;
    const bal = balRes.data;

    const rows = (ledger ?? []) as Array<{ delta_cents: number }>;
    const earned = rows.filter((r) => r.delta_cents > 0).reduce((s, r) => s + r.delta_cents, 0);
    const redeemed = rows.filter((r) => r.delta_cents < 0).reduce((s, r) => s + -r.delta_cents, 0);

    const referralRows = (refs ?? []) as any[];
    const referredIds = referralRows.map((r) => r.referred_user_id).filter(Boolean);
    let emailMap = new Map<string, string>();
    if (referredIds.length > 0) {
      const { data: profs } = await sb
        .from("profiles")
        .select("user_id,email")
        .in("user_id", referredIds);
      for (const p of (profs ?? []) as Array<{ user_id: string; email: string }>) emailMap.set(p.user_id, p.email);
    }
    const pending = referralRows
      .filter((r) => r.status === "pending")
      .reduce((s, r) => s + (r.reward_referrer_cents || 0), 0);

    logReferral({
      event: "referral.summary.fetch",
      status: "ok",
      user_id: context.userId,
      duration_ms: Date.now() - started,
      balance_cents: typeof bal === "number" ? bal : 0,
      ledger_rows: rows.length,
      referral_rows: referralRows.length,
      partial_errors: partErrors.length,
    });

    return {
      referral_code: profile?.referral_code ?? null,
      balance_cents: typeof bal === "number" ? bal : 0,
      currency: "USD",
      totals: { earned_cents: earned, redeemed_cents: redeemed, pending_cents: pending },
      ledger: (ledger ?? []) as any,
      referrals: referralRows.map((r) => ({
        id: r.id,
        status: r.status,
        referred_email: emailMap.get(r.referred_user_id) ?? null,
        reward_referrer_cents: r.reward_referrer_cents ?? 0,
        created_at: r.created_at,
      })),
    };
  });

export const getMyReferralBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ balance_cents: number; currency: string }> => {
    const sb = context.supabase as any;
    const started = Date.now();
    logReferral({ event: "referral.balance.fetch", status: "start", user_id: context.userId });
    const { data, error } = await sb.rpc("get_referral_balance", { _user_id: context.userId });
    if (error) {
      const c = classifyReferralError(error);
      logReferral({
        event: "referral.balance.fetch",
        status: "error",
        user_id: context.userId,
        duration_ms: Date.now() - started,
        error_code: c.code,
        error_message: c.message,
        rls_hint: c.rls_hint,
      });
      throw new Error(error.message);
    }
    const balance_cents = typeof data === "number" ? data : 0;
    logReferral({
      event: "referral.balance.fetch",
      status: "ok",
      user_id: context.userId,
      duration_ms: Date.now() - started,
      balance_cents,
    });
    return { balance_cents, currency: "USD" };
  });

export const attachReferrer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().min(4).max(24) }).parse(d))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const code = data.code.trim().toUpperCase();
    logReferral({ event: "referral.attach", status: "start", user_id: context.userId, code });

    const { data: current } = await sb
      .from("profiles")
      .select("referred_by_user_id,referral_code")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (current?.referred_by_user_id) {
      logReferral({ event: "referral.attach", status: "ok", user_id: context.userId, code, reason: "already_attributed", applied: false });
      return { ok: false, reason: "Already attributed" };
    }
    if (current?.referral_code === code) {
      logReferral({ event: "referral.attach", status: "ok", user_id: context.userId, code, reason: "own_code", applied: false });
      return { ok: false, reason: "Cannot use your own code" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const { data: refProfile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("referral_code", code)
      .maybeSingle();
    if (!refProfile) {
      logReferral({ event: "referral.attach", status: "ok", user_id: context.userId, code, reason: "code_not_found", applied: false });
      return { ok: false, reason: "Code not found" };
    }
    if (refProfile.user_id === context.userId) {
      logReferral({ event: "referral.attach", status: "ok", user_id: context.userId, code, reason: "own_code", applied: false });
      return { ok: false, reason: "Cannot use your own code" };
    }

    const { error } = await admin
      .from("profiles")
      .update({ referred_by_user_id: refProfile.user_id })
      .eq("user_id", context.userId);
    if (error) {
      const c = classifyReferralError(error);
      logReferral({
        event: "referral.attach",
        status: "error",
        user_id: context.userId,
        code,
        error_code: c.code,
        error_message: c.message,
        rls_hint: c.rls_hint,
      });
      throw new Error(error.message);
    }
    logReferral({ event: "referral.attach", status: "ok", user_id: context.userId, code, applied: true, referrer_id: refProfile.user_id });
    return { ok: true };
  });
