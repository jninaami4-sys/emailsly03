/**
 * Admin — Referrals moderation / analytics. Thin proxies (Batch 6 migration).
 */
import { adminReferralsApi } from "@/lib/api-client";

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

type Empty = Record<string, never>;

export async function adminListReferrals(args?: {
  data?: { status?: string; review_state?: string; search?: string; limit?: number };
}): Promise<AdminReferralRow[]> {
  const { referrals } = await adminReferralsApi.list(args?.data);
  return (referrals ?? []) as AdminReferralRow[];
}

export async function adminReferralStats(_?: { data?: Empty }): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byReview: Record<string, number>;
  totalRewardCents: number;
  outstandingCents: number;
  paidOutCents: number;
}> {
  const { stats } = await adminReferralsApi.stats();
  return stats;
}

export async function adminUpdateReferralStatus(args: {
  data: {
    id: string;
    status: "pending" | "qualified" | "rewarded" | "paid_out" | "cancelled";
    payout_method?: "credit" | "cash";
    notes?: string;
  };
}): Promise<{ ok: true }> {
  const { id, ...body } = args.data;
  await adminReferralsApi.update(id, body);
  return { ok: true };
}

export async function adminApproveReferral(args: {
  data: { id: string; notes?: string };
}): Promise<{ ok: true }> {
  await adminReferralsApi.approve(args.data.id, args.data.notes);
  return { ok: true };
}

export async function adminRejectReferral(args: {
  data: { id: string; notes?: string };
}): Promise<{ ok: true }> {
  await adminReferralsApi.reject(args.data.id, args.data.notes);
  return { ok: true };
}

export async function adminReferrerChain(args: {
  data: { referrer_id: string };
}): Promise<ReferrerChain> {
  const { chain } = await adminReferralsApi.chain(args.data.referrer_id);
  return chain as ReferrerChain;
}

export async function adminReferralFunnel(args?: {
  data?: { days?: number };
}): Promise<{
  window_days: number;
  clicks: number;
  signups: number;
  paid_conversions: number;
  credits_issued_cents: number;
  credits_redeemed_cents: number;
  credits_outstanding_cents: number;
}> {
  const { funnel } = await adminReferralsApi.funnel(args?.data?.days ?? 30);
  return funnel;
}

export async function adminReferralLeaderboard(args?: {
  data?: { limit?: number };
}): Promise<
  Array<{
    user_id: string;
    email: string;
    full_name: string | null;
    referral_code: string | null;
    conversions: number;
    earned_cents: number;
  }>
> {
  const { leaderboard } = await adminReferralsApi.leaderboard(args?.data?.limit ?? 10);
  return leaderboard ?? [];
}

export async function adminMarkCreditsPaidOut(args: {
  data: { user_ids: string[]; notes?: string };
}): Promise<{ ok: true; batch_id: string | null; count: number; total_cents: number }> {
  const res = await adminReferralsApi.markPaidOut(args.data.user_ids, args.data.notes);
  return { ok: true, ...res };
}

export async function adminExportOwedCsv(_?: { data?: Empty }): Promise<{
  csv: string;
  count: number;
}> {
  return adminReferralsApi.exportOwedCsv();
}
