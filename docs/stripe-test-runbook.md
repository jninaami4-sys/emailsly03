# Stripe Test-Mode Purchase Runbook

End-to-end verification of the checkout flow: **Cart → Stripe Checkout →
Webhook → Order row → Success page → Referral credit (if applicable)**.

Run this in test mode any time you change checkout, webhook, order, or
referral logic. It should take ~5 minutes end to end.

---

## 0. Pre-flight

Confirm before you start — a missing item here is the usual cause of a
"webhook never fired" report.

- [ ] Stripe dashboard is toggled to **Test mode** (top-right).
- [ ] `STRIPE_WEBHOOK_SECRET` in Lovable Cloud secrets matches the endpoint
      you're about to hit (published vs preview have different endpoints).
- [ ] Webhook endpoint is registered in Stripe → Developers → Webhooks:
  - Production: `https://project--<project-id>.lovable.app/api/public/webhooks/stripe`
  - Preview:    `https://project--<project-id>-dev.lovable.app/api/public/webhooks/stripe`
  - Events: `checkout.session.completed`, `payment_intent.succeeded`,
            `charge.refunded`, `payment_intent.payment_failed`.
- [ ] You're signed in to the app with a real test user (referral credits
      need `orders.user_id`).
- [ ] Optional: open Stripe → Developers → **Events** and
      **Logs** in two tabs so you can watch them fill in live.

---

## 1. Test card

Use Stripe's canonical test cards. Any future expiry, any 3-digit CVC, any
ZIP.

| Scenario                      | Card number           |
| ----------------------------- | --------------------- |
| **Success (default)**         | `4242 4242 4242 4242` |
| Requires 3-D Secure auth      | `4000 0025 0000 3155` |
| Declined — generic            | `4000 0000 0000 0002` |
| Declined — insufficient funds | `4000 0000 0000 9995` |
| Disputed / chargeback         | `4000 0000 0000 0259` |

Full list: https://docs.stripe.com/testing#cards

---

## 2. Build the cart

1. Sign in.
2. Add at least one item to the cart. If testing referral credits, also
    click "Apply credit" so `discount_cents` is non-zero.
3. Open the cart drawer and click **Checkout**.

**Verify:**
- Browser Network tab shows a `POST` to the checkout server fn returning
  `{ url: "https://checkout.stripe.com/..." }`.
- No red errors in the browser console.

---

## 3. Complete Stripe Checkout

1. On the Stripe-hosted page, confirm the line items, amount, and currency
   match the cart.
2. Enter email (auto-filled if signed in), card `4242 4242 4242 4242`,
   any future expiry, any CVC, any ZIP.
3. Submit.

**Verify on Stripe:**
- Developers → **Payments**: a new `succeeded` PaymentIntent for the exact
  amount.
- Developers → **Events**: `checkout.session.completed` and
  `payment_intent.succeeded` both listed, both showing a **200** response
  from your webhook URL. If either shows a non-2xx, jump to §7.

---

## 4. Webhook fired

Check server logs for the webhook route
(`/api/public/webhooks/stripe`) — filter by `stripe` or the session id.

**Expect to see, in order:**
1. Signature verified (no `Invalid signature` line).
2. `checkout.session.completed` handled — order lookup + update.
3. Insert into `stripe_events` (idempotency guard).

**Red flags:**
- `Invalid signature` → wrong `STRIPE_WEBHOOK_SECRET` for this environment.
- `Order not found` → cart create step didn't persist an `orders` row with
  the `cs_...` id in `payment_ref`.
- Duplicate handling → `stripe_events` should dedupe; second delivery
  should short-circuit.

---

## 5. Database rows

Run these in order. Replace `<cs_id>` with the Checkout Session id from
Stripe (`cs_test_...`).

```sql
-- 1. Order flipped to paid
select id, user_id, status, payment_status, payment_provider,
       payment_ref, total_cents, discount_cents, currency, created_at
from public.orders
where payment_ref = '<cs_id>';
-- expect: payment_status='paid', payment_provider='stripe',
--         status in ('pending','in_progress'), total_cents matches Stripe.

-- 2. Idempotency row present
select * from public.stripe_events
where id in (select event_id from public.stripe_events order by created_at desc limit 5);
-- expect: the checkout.session.completed event id logged exactly once.

-- 3. Order event trail
select event_type, actor_role, message, created_at
from public.order_events
where order_id = (select id from public.orders where payment_ref = '<cs_id>')
order by created_at;
-- expect: at least a 'paid' / 'payment_received' entry from the webhook.
```

### If the buyer was referred

The `orders_qualify_referral` trigger only fires when
`payment_status='paid'`, `payment_provider='stripe'`, and `payment_ref`
starts with `cs_`, `pi_`, or `ch_`.

```sql
-- 4. Referral moved from pending → qualified
select id, referrer_id, referred_user_id, status,
       reward_referrer_cents, reward_referred_cents,
       admin_review_state, flag_reasons
from public.referrals
where referred_user_id = (select user_id from public.orders where payment_ref='<cs_id>');
-- expect: status='qualified', reward_*_cents > 0,
--         admin_review_state='auto' (or 'flagged' if rules tripped).

-- 5. Credits issued to both sides
select user_id, delta_cents, source, notes, created_at
from public.referral_credits
where referral_id = (select id from public.referrals
                     where referred_user_id = (select user_id from public.orders where payment_ref='<cs_id>'))
order by created_at;
-- expect: one 'referral_earned_referrer' row for the inviter,
--         one 'referral_earned_referred' row for the buyer,
--         each with delta_cents > 0.
```

---

## 6. Client-side success page

Back in the app you should have been redirected to `/payment-success`.

**Verify:**
- Order summary renders (id, amount, items).
- No `?redirect=/auth` bounce — session survived the round-trip.
- `conversion_events` picked up a `purchase` row:
  ```sql
  select event_key, order_id, value_cents, currency, created_at
  from public.conversion_events
  order by created_at desc limit 5;
  ```
- `server_event_log` shows the server-side purchase relay to GA4 / Meta /
  TikTok with `status='ok'` (or `'skipped'` if a provider is disabled).

---

## 7. Failure paths (spot-check at least one)

### 7a. Declined card
Repeat §2–3 with `4000 0000 0000 0002`.
- Stripe shows a `payment_intent.payment_failed` event.
- `orders.payment_status` stays `unpaid` (or your equivalent). No referral
  qualification, no credits, no `conversion_events.purchase` row.

### 7b. Refund
On a successful test order: Stripe dashboard → Payments → open the
PaymentIntent → **Refund**.
- `charge.refunded` event delivered to webhook (200 response).
- `orders.payment_status='refunded'`, `orders.status='refunded'`.
- If a referral had been qualified, the `referrals_issue_credits` trigger
  writes a `source='reversal'` row in `referral_credits` (net-zero).

### 7c. Replay the webhook
Stripe → Events → open the `checkout.session.completed` → **Resend**.
- Server responds 200 again.
- No duplicate `stripe_events`, `order_events`, or `referral_credits` rows
  — idempotency is holding.

---

## 8. Cleanup

Test orders are fine to leave in the DB; if you want a clean slate:

```sql
delete from public.orders
where payment_ref like 'cs_test_%' and created_at > now() - interval '1 day';
```
(Cascades take care of `order_events`, `referrals`, `referral_credits`.)

---

## Quick failure-to-cause map

| Symptom                                    | Most likely cause                                                      |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| Webhook shows 401 in Stripe                | `STRIPE_WEBHOOK_SECRET` mismatch for this environment                  |
| Webhook 200 but order not `paid`           | Checkout created no order row, or `payment_ref` didn't match `cs_...`  |
| Order paid but referral still `pending`    | Trigger guard: `payment_provider`, `payment_ref` prefix, or no user_id |
| Referral `qualified` but no credit rows    | `admin_review_state='flagged'` — check `referrals.flag_reasons`        |
| Success page bounces to `/auth`            | Session lost — usually a stale bearer; sign out/in and retry           |
| Duplicate credits after webhook resend     | `stripe_events` idempotency guard missing — fix before shipping        |
