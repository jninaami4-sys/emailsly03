# Referrals: Stripe-verified rewards + anti-abuse + admin tracking

## 1. Stripe webhook (real payment gate)

Since you already have Stripe elsewhere, I'll add a signed webhook. Rewards will only fire when Stripe confirms.

- New public route `src/routes/api/public/webhooks/stripe.ts`
  - Verifies `stripe-signature` with HMAC-SHA256 using `STRIPE_WEBHOOK_SECRET` (I'll request it via `add_secret`).
  - Handles `checkout.session.completed` and `payment_intent.succeeded`.
  - Idempotent by Stripe event id (new table `stripe_events`).
  - Marks the order `payment_status='paid'`, stores `payment_ref` (Stripe session/PI id), which trips the existing `orders_qualify_referral` trigger.
- Order creation moves from "instantly paid" to `payment_status='pending'`; only the webhook flips it to `paid`. The `/payment-success` page just polls the order until it flips (no client-driven crediting).
- Referral trigger updated: only qualify when `payment_provider='stripe'` AND payment_ref starts with `cs_`/`pi_` AND order passes anti-abuse checks (below).

## 2. Referral link capture

- New `src/lib/referral-capture.ts` client util. On any page load with `?ref=CODE`, store `{ code, ts, landing_url }` in `localStorage.lyra_ref` (30-day TTL) and drop a first-party cookie `lyra_ref`.
- On `SIGNED_IN` (root `onAuthStateChange`), call existing `attachReferrer({ code })`. Ignored if the profile already has one, or on self-referral.
- Stripe checkout session gets `client_reference_id = user_id` and `metadata.ref_code` for defense-in-depth.

## 3. Anti-abuse (all four)

New columns on `referrals`: `signup_ip inet`, `signup_ua_hash text`, `flag_reasons text[]`, `admin_review_state text default 'auto'` (`auto|flagged|approved|rejected`), `qualified_order_min_cents int`.

- **Same email/domain**: `attachReferrer` reads referrer's email; blocks if identical. If both are on the same *corporate* domain (not in a public-email allowlist: gmail/outlook/yahoo/proton/icloud/hotmail/live/aol/…), status set to `flagged` with reason `same_domain` — admin must approve.
- **Same IP/device**: `attachReferrer` records `signup_ip` (from `getRequestIP`) and a SHA-256 of user-agent + accept-language. If either matches the referrer's stored signup fingerprint → `flagged` with reason `same_device` / `same_ip`.
- **One reward per referred user, ever**: `referrals` already has `unique(referred_user_id)`; the trigger already stops after status leaves `pending`. I'll add an explicit assertion and test.
- **Min order + monthly cap**: constants in `pricing_settings` (`referral_min_order_cents` default 2000, `referral_monthly_cap_cents` default 50000). Trigger will:
  - Skip qualification if order `total_cents - discount_cents < min`.
  - Compute referrer's rewards issued in the current calendar month; if adding this reward exceeds cap → set `admin_review_state='flagged'` with reason `monthly_cap` (credits NOT issued until admin approves).

Credits are issued by trigger ONLY when `admin_review_state='auto'` OR `'approved'`. Flagged referrals sit in a review queue.

## 4. Admin — Referrals view enhancements

`src/components/admin/ReferralsAdmin.tsx` gains:

- **Funnel header** (last 30d / all-time toggle): ref link clicks → signups → paid conversions → total credits issued/redeemed/outstanding. Click tracking via a lightweight `referral_clicks` table pinged from the capture util (fire-and-forget public endpoint, dedup by `code+visitor_id/day`).
- **Leaderboard**: top 10 referrers by paid conversions + credits earned.
- **Full-chain expandable row**: referrer → each referred user → their paid orders (id, total, Stripe ref, status) → credits earned & redeemed per order.
- **Fraud flags column** with reason chips; row-level Approve / Reject buttons that call new admin server fns (`approveReferral`, `rejectReferral`) which flip `admin_review_state` and let the trigger issue/withhold credits.
- **Payout controls**: mark credits as `paid_out` (new column on `referral_credits`: `payout_batch_id`, `paid_out_at`). "Export owed CSV" button (server-side, admin-only) grouped by referrer with totals owed.

## 5. Technical details

**DB migration (single file):**
- ALTER `referrals`: add `signup_ip`, `signup_ua_hash`, `flag_reasons text[]`, `admin_review_state text default 'auto'` (check constraint).
- ALTER `referral_credits`: add `payout_batch_id uuid`, `paid_out_at timestamptz`.
- ALTER `pricing_settings`: add `referral_min_order_cents int default 2000`, `referral_monthly_cap_cents int default 50000`.
- New `referral_clicks(id, code, visitor_hash, landing_url, ua_hash, ip inet, created_at)` + narrow anon INSERT policy (rate-limited by unique `(code, visitor_hash, date)`).
- New `stripe_events(id text primary key, type text, received_at)` — service-role only, powers webhook idempotency.
- Rewrite `orders_qualify_referral()` and `referrals_issue_credits()` per rules above (SECURITY DEFINER, `SET search_path=public`).
- GRANTs + RLS for every new table/column.

**Server fns / routes:**
- `src/routes/api/public/webhooks/stripe.ts` (raw-body HMAC verify → admin client insert).
- `src/routes/api/public/referral-click.ts` (rate-limited insert).
- `src/lib/referrals.functions.ts`: extend `attachReferrer` with IP/UA + email checks; add `getReferralFunnelStats`, `getReferralLeaderboard`.
- `src/lib/admin-referrals.functions.ts`: `listReferralsWithChain`, `approveReferral`, `rejectReferral`, `markCreditsPaidOut`, `exportOwedCsv` (admin-gated via `has_role`).

**Client:**
- `src/routes/__root.tsx`: mount capture util; call `attachReferrer` in the `SIGNED_IN` handler (already filtered).
- `src/routes/payment-success.tsx`: replace client-side `recordMyOrder` with a poll on order `payment_status`; UI stays but no reward can be forged by opening the URL directly.
- Admin UI rewrite for the four sections above.

**Secrets:**
- Ask you to add `STRIPE_WEBHOOK_SECRET` via `add_secret` before Step 1 goes live. Public routes give a stable URL you'll paste into Stripe Dashboard → Webhooks; I'll surface it after the route exists.

## Rollout order

1. Migration + `STRIPE_WEBHOOK_SECRET` request.
2. Webhook route + order pending/paid flow + payment-success poll.
3. Capture util + attachReferrer hardening.
4. Admin UI: funnel, leaderboard, chain, flags, payouts, CSV.
