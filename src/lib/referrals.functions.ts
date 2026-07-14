import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { createHash } from "crypto";
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

const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "ymail.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "tutanota.com",
  "gmx.com",
  "zoho.com",
  "mail.com",
]);

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
    const emailMap = new Map<string, string>();
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

/**
 * Attach a referral code to the signed-in user.
 * Runs anti-abuse checks and records signup fingerprint (IP + UA hash) on the profile and on the resulting referrals row.
 *
 * Anti-abuse rules applied here:
 *   - hard block: attempting to use own code
 *   - hard block: profile already attributed
 *   - flag `same_email`     — same email as referrer (should be impossible but guarded)
 *   - flag `same_domain`    — same non-public corporate domain
 *   - flag `same_ip`        — signup IP matches referrer's signup IP
 *   - flag `same_device`    — signup UA-hash matches referrer's UA-hash
 *
 * Flagged referrals still create the pending referral row but with admin_review_state='flagged';
 * the orders_qualify_referral trigger will NOT auto-issue credits until an admin approves.
 */
export const attachReferrer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().min(4).max(24) }).parse(d))
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const code = data.code.trim().toUpperCase();
    const myEmail = ((context.claims as { email?: string }).email ?? "").toLowerCase().trim();
    logReferral({ event: "referral.attach", status: "start", user_id: context.userId, code });

    const { data: current } = await sb
      .from("profiles")
      .select("referred_by_user_id,referral_code,signup_ip,signup_ua_hash")
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
      .select("user_id,email,signup_ip,signup_ua_hash")
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

    // Capture request fingerprint
    const ip = safeGetIp();
    const uaHash = safeUaHash();

    // Compute flags
    const flags: string[] = [];
    const refEmail = ((refProfile.email as string | null) ?? "").toLowerCase().trim();
    if (myEmail && refEmail && myEmail === refEmail) {
      // Hard block — same address is unambiguous self-referral
      logReferral({ event: "referral.attach", status: "ok", user_id: context.userId, code, reason: "same_email", applied: false });
      return { ok: false, reason: "Cannot use a code for your own email" };
    }
    const myDomain = myEmail.split("@")[1] ?? "";
    const refDomain = refEmail.split("@")[1] ?? "";
    if (
      myDomain &&
      refDomain &&
      myDomain === refDomain &&
      !PUBLIC_EMAIL_DOMAINS.has(myDomain)
    ) {
      flags.push("same_domain");
    }
    if (ip && refProfile.signup_ip && ip === String(refProfile.signup_ip)) {
      flags.push("same_ip");
    }
    if (uaHash && refProfile.signup_ua_hash && uaHash === refProfile.signup_ua_hash) {
      flags.push("same_device");
    }

    // Persist signup fingerprint on profile (only if not already set)
    const profilePatch: Record<string, unknown> = { referred_by_user_id: refProfile.user_id };
    if (!current?.signup_ip && ip) profilePatch.signup_ip = ip;
    if (!current?.signup_ua_hash && uaHash) profilePatch.signup_ua_hash = uaHash;

    const { error } = await admin
      .from("profiles")
      .update(profilePatch)
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

    // The profiles_create_pending_referral trigger has now created (or ensured) a referrals row for us.
    // Update it with fingerprint + flag_reasons.
    const nextState = flags.length > 0 ? "flagged" : "auto";
    const { error: refErr } = await admin
      .from("referrals")
      .update({
        signup_ip: ip,
        signup_ua_hash: uaHash,
        flag_reasons: flags,
        admin_review_state: nextState,
      })
      .eq("referred_user_id", context.userId);
    if (refErr) {
      const c = classifyReferralError(refErr);
      logReferral({
        event: "referral.attach",
        status: "error",
        user_id: context.userId,
        code,
        step: "update_referral_flags",
        error_code: c.code,
        error_message: c.message,
        rls_hint: c.rls_hint,
      });
    }

    logReferral({
      event: "referral.attach",
      status: "ok",
      user_id: context.userId,
      code,
      applied: true,
      referrer_id: refProfile.user_id,
      flags,
      review_state: nextState,
    });
    return { ok: true, flags, review_state: nextState };
  });

function safeGetIp(): string | null {
  try {
    return getRequestIP({ xForwardedFor: true }) ?? null;
  } catch {
    return null;
  }
}

function safeUaHash(): string | null {
  try {
    const ua = getRequestHeader("user-agent") ?? "";
    const al = getRequestHeader("accept-language") ?? "";
    if (!ua) return null;
    return createHash("sha256").update(`${ua}|${al}`).digest("hex");
  } catch {
    return null;
  }
}
