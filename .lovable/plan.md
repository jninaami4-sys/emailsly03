
## Goal

Build a portable client + order system so that when you redeploy the site (or move it), every client's login and every order stays intact. Admin can run the business end-to-end (view/cancel/refund/deliver via GDrive). Clients get a real dashboard (orders, timeline, downloads, invoices, reorder/revision, profile).

## Data model (Lovable Cloud / Supabase)

New tables in one migration, with GRANTs + RLS:

- **`profiles`** — one row per `auth.users`, keyed by `user_id`. Fields: `email`, `full_name`, `company`, `phone`, `country`, `notes`, `imported_from` (text tag like `"old-site-A"`), `created_at`.
- **`orders`** — the source of truth for every sale (past and future). Fields:
  - `user_id` (nullable — imported orders may not yet have a login), `email` (always set, used to link on first sign-in)
  - `service_id`, `service_label`, `quantity`, `subtotal_cents`, `discount_cents`, `promo_code`, `total_cents`, `currency`
  - `status`: `pending | in_progress | delivered | cancelled | refunded | revision_requested`
  - `payment_status`, `payment_provider`, `payment_ref` (Stripe session/PI id)
  - `delivery_url` (GDrive), `delivery_notes`, `delivered_at`, `delivered_by`
  - `cancel_reason`, `cancelled_at`
  - `imported_from`, `external_id` (unique per `imported_from`) so re-imports are idempotent
  - `created_at`, `updated_at`
- **`order_events`** — append-only status timeline (status change, delivery, cancel, revision, note). Powers client's "order timeline" and admin audit.
- **`order_messages`** — optional; used for revision requests / admin replies per order.

RLS:
- Client can `SELECT` own `profiles` / `orders` / `order_events` (`user_id = auth.uid()` OR `email = auth.jwt() ->> 'email'` so imported-but-not-yet-signed-up orders auto-appear on first login).
- Client can `UPDATE` own profile and `INSERT` a revision request event on own order.
- Admin (existing `has_role(auth.uid(),'admin')`) can do everything on all rows.
- `service_role` full access for imports/webhooks.

## Data portability (this is the whole point)

- **JSON import** (`admin.tsx` → new "Import" tab): paste or upload a JSON array of `{clients: [...], orders: [...]}`. Server function `importClients` + `importOrders` (admin-only, service-role):
  - Upserts profiles by `imported_from + external_id`.
  - Upserts orders same way — safe to re-run, no duplicates.
  - Creates auth users with `supabaseAdmin.auth.admin.createUser({ email, email_confirm: true })` and emails a **magic link** (passwords from other systems can't be moved; hashes differ). If the user already exists, we skip creation and just relink.
- **JSON export**: one-click download of `{clients, orders, order_events}` as a versioned JSON file to `/mnt/documents/`, so you can migrate off the site the same way — nothing is trapped.
- Because every table has `imported_from` + `external_id`, importing from multiple old sites is safe and traceable.

## Admin panel (`/admin` new tab: "Orders")

- Stats header: **Revenue (all-time / this month)**, **Orders count by status**, **Refunded total**, **Avg order value**. All from a single server fn that runs SUM/COUNT queries.
- Orders table with filters (status, date range, email search, service).
- Row actions:
  - **Deliver** → modal for GDrive URL + notes → sets status `delivered`, records `delivered_at`, writes `order_events`, sends email to client with the link.
  - **Cancel / Refund** → modal for reason → sets status + reason + timestamp, writes event.
  - **Mark in_progress** → simple status bump.
  - **View client** → drawer with client profile + all their orders.
- Everything is a server function with `requireSupabaseAuth` + admin-role check.

## Client dashboard (`/_authenticated/dashboard`)

Sits under the managed `_authenticated` gate. Tabs:

1. **Orders** — list with status pill, amount, service, ordered date. Click row → drawer:
   - Status timeline (from `order_events`).
   - Delivery card: if `delivery_url` present, big "Open in Google Drive" button + notes.
   - Invoice: "View / Download" (renders a printable receipt page at `/invoice/$orderId`; PDF via browser print).
   - Actions: **Request revision** (writes event + message), **Reorder this service** (opens Order drawer prefilled).
2. **Downloads** — flat list of every delivered order with GDrive links, newest first.
3. **Profile** — edit name/company/phone/country; email is read-only (change via auth).

Header adds an avatar menu with Dashboard / Sign out when signed in (replaces the static Sign in link based on session).

## Login flow for imported clients

- Import creates the auth user with `email_confirm: true` and no password.
- We send a Supabase magic link (`signInWithOtp` at import time, or "Send login link" button in admin per client).
- User clicks link → lands on `/auth/callback` → session set → dashboard shows all their historical orders automatically because RLS also matches by email.
- They can then set a password from Profile if they want.

## Files

Migration:
- `supabase/migrations/*_clients_orders.sql` — the three tables + RLS + GRANTs + updated_at trigger + a `has_role`-based admin policy.

Server (client-safe `.functions.ts`, service-role loaded inside handlers):
- `src/lib/orders.functions.ts` — `listMyOrders`, `getMyOrder`, `requestRevision`, `updateMyProfile`.
- `src/lib/admin-orders.functions.ts` — `adminListOrders`, `adminOrderStats`, `adminDeliverOrder`, `adminCancelOrder`, `adminSetStatus`, `adminSendMagicLink`.
- `src/lib/data-portability.functions.ts` — `importClientsAndOrders`, `exportAll`.
- Stripe success webhook / existing `payment-success.tsx` writes a row into `orders` with `payment_status='paid'` so real revenue tracking works from day one.

Routes / UI:
- `src/routes/_authenticated/dashboard.tsx` (+ tabs as subroutes or in-page tabs).
- `src/routes/_authenticated/invoice.$orderId.tsx` — printable invoice.
- `src/components/admin/OrdersAdmin.tsx`, `RevenueStats.tsx`, `DeliverOrderDialog.tsx`, `CancelOrderDialog.tsx`, `ImportExportAdmin.tsx`.
- `src/components/site/Header.tsx` — session-aware account menu.

## Technical notes

- No password migration — magic-link on first sign-in only.
- All admin mutations verify `has_role(userId,'admin')` server-side; client role checks are UI-only.
- Imports and exports run through admin-only server fns using `supabaseAdmin` inside the handler (never at module scope, per import-graph rules).
- Every table has `imported_from` + `external_id` unique key → idempotent re-imports.
- Revenue = `SUM(total_cents)` over `status IN ('delivered','in_progress','pending') AND payment_status='paid'`; refunded tracked separately.
- GDrive URL is stored as plain text — we do not proxy files; the link goes straight to your Drive.

## What you'll do after I ship this

1. Open `/admin` → **Import** tab → paste your JSON from the other site → run.
2. Clients get magic-link emails; they sign in and see all their history.
3. Every new order flows in automatically; you deliver via GDrive link from admin.
4. Anytime, hit **Export** to snapshot everything as JSON — that file plus this codebase = full portability.
