/**
 * Referrals — thin proxies to PHP API (Batch 5 migration).
 */
import { referralsApi } from "@/lib/api-client";

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

type Empty = Record<string, never>;

export async function getMyReferralSummary(_?: { data?: Empty }): Promise<ReferralSummary> {
  const r = await referralsApi.me();
  const ledger = (r.ledger ?? r.credits ?? []) as Array<{ delta_cents: number }>;
  const earned = ledger.filter((x) => x.delta_cents > 0).reduce((s, x) => s + x.delta_cents, 0);
  const redeemed = ledger.filter((x) => x.delta_cents < 0).reduce((s, x) => s + -x.delta_cents, 0);
  const pending = (r.referrals ?? [])
    .filter((x: any) => x.status === "pending")
    .reduce((s: number, x: any) => s + (x.reward_referrer_cents || 0), 0);
  return {
    referral_code: r.profile?.referral_code ?? null,
    balance_cents: Number(r.balance_cents ?? 0),
    currency: "USD",
    totals: {
      earned_cents: r.totals?.earned_cents ?? earned,
      redeemed_cents: r.totals?.redeemed_cents ?? redeemed,
      pending_cents: r.totals?.pending_cents ?? pending,
    },
    ledger: (r.ledger ?? r.credits ?? []) as ReferralSummary["ledger"],
    referrals: (r.referrals ?? []) as ReferralSummary["referrals"],
  };
}

export async function getMyReferralBalance(
  _?: { data?: Empty },
): Promise<{ balance_cents: number; currency: string }> {
  try {
    return await referralsApi.balance();
  } catch {
    const r = await referralsApi.me();
    return { balance_cents: Number(r.balance_cents ?? 0), currency: "USD" };
  }
}

export async function attachReferrer(args: {
  data: { code: string };
}): Promise<{ ok: boolean; reason?: string }> {
  return referralsApi.attach(args.data.code);
}
